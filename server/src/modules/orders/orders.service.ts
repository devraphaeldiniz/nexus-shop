import { prisma } from '../../config/prisma.js'
import {
  Coupon,
  OrderStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
  Prisma,
} from '@prisma/client'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../utils/errors.js'
import { sendMail } from '../../config/mail.js'
import { roundMoney } from '../../utils/money.js'
import { escapeHtml } from '../../utils/html.js'
import { getShippingOption, ShippingOptionId } from '../shipping/shipping.service.js'
import {
  calculateCouponDiscount,
  consumeCoupon,
  getValidCoupon,
} from '../coupons/coupons.service.js'

export interface CreateOrderItemInput {
  productId: string
  quantity: number
  color?: string
  storage?: string
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[]
  shippingOptionId: ShippingOptionId
  addressId?: string
  address?: {
    street: string
    number: string
    complement?: string
    neighborhood: string
    city: string
    state: string
    zipCode: string
  }
  paymentGateway: PaymentGateway
  paymentMethod: PaymentMethod
  couponCode?: string
  notes?: string
}

/** Status que só fazem sentido depois do pagamento confirmado. */
const PAID_ONLY_STATUSES: OrderStatus[] = [
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
]
/** Status em que o estoque do pedido já foi devolvido. */
const RELEASED_STATUSES: OrderStatus[] = [OrderStatus.CANCELLED, OrderStatus.REFUNDED]

type StockLine = { productId: string; quantity: number }

/** Soma quantidades por produto (variações de cor/armazenamento dividem o mesmo estoque). */
function groupByProduct(lines: StockLine[]): Map<string, number> {
  const grouped = new Map<string, number>()
  for (const line of lines) {
    grouped.set(line.productId, (grouped.get(line.productId) || 0) + line.quantity)
  }
  return grouped
}

/**
 * Baixa o estoque de forma atômica: só decrementa se houver saldo.
 * Se algum produto não tiver saldo, lança erro e a transação inteira é desfeita.
 */
export async function reserveStock(tx: Prisma.TransactionClient, lines: StockLine[]) {
  for (const [productId, quantity] of groupByProduct(lines)) {
    const { count } = await tx.product.updateMany({
      where: { id: productId, isActive: true, stock: { gte: quantity } },
      data: {
        stock: { decrement: quantity },
        totalSold: { increment: quantity },
      },
    })
    if (count === 0) {
      const product = await tx.product.findUnique({ where: { id: productId }, select: { name: true } })
      throw new BadRequestError(
        `O produto ${product?.name ?? productId} não possui estoque suficiente.`
      )
    }
  }
}

/** Devolve ao estoque os itens do pedido e libera o uso do cupom. */
export async function releaseStock(
  tx: Prisma.TransactionClient,
  order: { couponId: string | null; items: StockLine[] }
) {
  for (const [productId, quantity] of groupByProduct(order.items)) {
    await tx.product.update({
      where: { id: productId },
      data: {
        stock: { increment: quantity },
        totalSold: { decrement: quantity },
      },
    })
  }
  if (order.couponId) {
    await tx.coupon.updateMany({
      where: { id: order.couponId, currentUses: { gt: 0 } },
      data: { currentUses: { decrement: 1 } },
    })
  }
}

/**
 * Cancela um pedido que ainda não foi pago e devolve estoque/cupom.
 * Idempotente: se o pedido já foi pago ou cancelado, não faz nada e retorna false.
 * Se `onlyIfReference` for informado, só cancela quando o pagamento de referência ainda é o atual
 * (evita que um PIX antigo expirado cancele um pedido que gerou uma nova cobrança).
 */
export async function cancelUnpaidOrder(
  orderId: string,
  reason: string,
  onlyIfReference?: string
): Promise<boolean> {
  return prisma.$transaction(async (tx) => {
    const where: Prisma.OrderWhereInput = {
      id: orderId,
      status: OrderStatus.PENDING,
      paymentStatus: { not: PaymentStatus.PAID },
    }
    if (onlyIfReference) where.externalReference = onlyIfReference

    const { count } = await tx.order.updateMany({
      where,
      data: { status: OrderStatus.CANCELLED, paymentStatus: PaymentStatus.FAILED },
    })
    if (count === 0) return false

    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    })
    await tx.order.update({
      where: { id: orderId },
      data: { notes: [order.notes, `[sistema] Cancelado: ${reason}`].filter(Boolean).join('\n') },
    })
    await releaseStock(tx, order)
    return true
  })
}

export class OrderService {
  async create(userId: string, data: CreateOrderInput) {
    // 1. Consolidar itens repetidos (mesmo produto + variação)
    const merged = new Map<string, CreateOrderItemInput>()
    for (const item of data.items) {
      const key = `${item.productId}|${item.color ?? ''}|${item.storage ?? ''}`
      const current = merged.get(key)
      merged.set(key, current ? { ...current, quantity: current.quantity + item.quantity } : { ...item })
    }
    const lines = [...merged.values()]

    // 2. Preços sempre vêm do banco, nunca do cliente
    const productIds = [...new Set(lines.map((l) => l.productId))]
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, isActive: true },
      select: { id: true, name: true, price: true },
    })
    const productMap = new Map(products.map((p) => [p.id, p]))
    for (const line of lines) {
      if (!productMap.has(line.productId)) {
        throw new BadRequestError('Um dos produtos do carrinho não está mais disponível.')
      }
    }

    const subtotal = roundMoney(
      lines.reduce((sum, line) => sum + Number(productMap.get(line.productId)!.price) * line.quantity, 0)
    )

    // 3. Gateway precisa estar ativo no painel do lojista
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } })
    const gatewayEnabled =
      data.paymentGateway === PaymentGateway.STRIPE ? settings?.stripeEnabled : settings?.mercadoPagoEnabled
    if (!gatewayEnabled) {
      throw new BadRequestError('Esta forma de pagamento não está disponível na loja no momento.')
    }

    // 4. Frete e cupom com as mesmas regras exibidas no checkout
    const shipping = await getShippingOption(subtotal, data.shippingOptionId)

    let coupon: Coupon | null = null
    let discount = 0
    if (data.couponCode?.trim()) {
      coupon = await getValidCoupon(data.couponCode, subtotal)
      discount = calculateCouponDiscount(coupon, subtotal)
    }

    const total = roundMoney(Math.max(0, subtotal - discount + shipping.price))

    // 5. Transação: endereço, estoque (atômico), cupom (atômico), pedido e itens
    const order = await prisma.$transaction(async (tx) => {
      let addressId: string
      if (data.addressId) {
        const address = await tx.address.findFirst({ where: { id: data.addressId, userId, archivedAt: null } })
        if (!address) throw new BadRequestError('Endereço de entrega inválido')
        addressId = address.id
      } else if (data.address) {
        const address = await tx.address.create({ data: { userId, ...data.address } })
        addressId = address.id
      } else {
        throw new BadRequestError('Informe o endereço de entrega')
      }

      await reserveStock(tx, lines)
      if (coupon) await consumeCoupon(tx, coupon)

      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId,
          paymentGateway: data.paymentGateway,
          paymentMethod: data.paymentMethod,
          subtotal,
          shippingCost: shipping.price,
          shippingMethod: shipping.id,
          discount,
          total,
          couponId: coupon?.id,
          notes: data.notes,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: lines.map((line) => {
              const product = productMap.get(line.productId)!
              return {
                productId: line.productId,
                name: product.name,
                price: product.price,
                quantity: line.quantity,
                color: line.color,
                storage: line.storage,
              }
            }),
          },
        },
        include: {
          items: true,
          address: true,
          user: { select: { name: true, email: true } },
        },
      })

      // Carrinho do servidor (se usado) é limpo após a compra
      await tx.cartItem.deleteMany({ where: { userId } })

      return newOrder
    })

    sendMail({
      to: order.user.email,
      subject: `Nexus Shop — Pedido #${order.id.slice(-8)} recebido!`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2>Pedido #${order.id.slice(-8)} recebido!</h2>
          <p>Olá, ${escapeHtml(order.user.name)}. Seu pedido foi registrado e aguarda confirmação de pagamento.</p>
          <p><strong>Total:</strong> R$ ${Number(order.total).toFixed(2)}</p>
          <p><strong>Entrega em:</strong> ${escapeHtml(order.address.street)}, ${escapeHtml(order.address.number)} - ${escapeHtml(order.address.city)}/${escapeHtml(order.address.state)}</p>
        </div>
      `,
    }).catch(console.error)

    return order
  }

  async listUserOrders(userId: string) {
    return prisma.order.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        items: true,
        address: true,
      },
    })
  }

  async getById(orderId: string, userId: string, isAdmin = false) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: true,
        address: true,
        user: { select: { id: true, name: true, email: true } },
        transactions: isAdmin,
      },
    })

    if (!order) throw new NotFoundError('Pedido não encontrado')
    if (!isAdmin && order.userId !== userId) {
      throw new ForbiddenError('Acesso não autorizado a este pedido')
    }

    return order
  }

  async listAll(page = 1, limit = 20, status?: OrderStatus) {
    const skip = (page - 1) * limit
    const where = status ? { status } : {}

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { name: true, email: true } },
          items: true,
          address: true,
        },
      }),
      prisma.order.count({ where }),
    ])

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    }
  }

  async updateStatus(
    orderId: string,
    status: OrderStatus,
    trackingCode?: string
  ) {
    const order = await prisma.$transaction(async (tx) => {
      const current = await tx.order.findUnique({
        where: { id: orderId },
        include: { items: true },
      })
      if (!current) throw new NotFoundError('Pedido não encontrado')

      if (RELEASED_STATUSES.includes(current.status) && status !== current.status) {
        throw new BadRequestError('Pedidos cancelados ou reembolsados não podem mudar de status.')
      }
      if (PAID_ONLY_STATUSES.includes(status) && current.paymentStatus !== PaymentStatus.PAID) {
        throw new BadRequestError('Este status só pode ser usado depois do pagamento confirmado.')
      }

      // Cancelar/reembolsar devolve o estoque uma única vez
      if (RELEASED_STATUSES.includes(status) && !RELEASED_STATUSES.includes(current.status)) {
        await releaseStock(tx, current)
      }

      return tx.order.update({
        where: { id: orderId },
        data: {
          status,
          ...(status === OrderStatus.REFUNDED ? { paymentStatus: PaymentStatus.REFUNDED } : {}),
          ...(trackingCode ? { trackingCode } : {}),
        },
        include: { user: { select: { email: true, name: true } } },
      })
    })

    if (trackingCode) {
      sendMail({
        to: order.user.email,
        subject: `Nexus Shop — Pedido #${order.id.slice(-8)} enviado! 🚚`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <h2>Seu smartphone está a caminho! 📦</h2>
            <p>Olá, ${escapeHtml(order.user.name)}. O pedido #${order.id.slice(-8)} foi postado.</p>
            <p><strong>Código de rastreio:</strong> ${escapeHtml(trackingCode)}</p>
          </div>
        `,
      }).catch(console.error)
    }

    return order
  }
}
