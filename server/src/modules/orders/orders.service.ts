import { prisma } from '../../config/prisma.js'
import {
  OrderStatus,
  PaymentGateway,
  PaymentMethod,
  PaymentStatus,
} from '@prisma/client'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
} from '../../utils/errors.js'
import { sendMail } from '../../config/mail.js'

export interface CreateOrderInput {
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

export class OrderService {
  async create(userId: string, data: CreateOrderInput) {
    // 1. Validar endereço do usuário
    let address
    if (data.addressId) {
      address = await prisma.address.findFirst({
        where: { id: data.addressId, userId },
      })
    } else if (data.address) {
      address = await prisma.address.create({
        data: { userId, ...data.address },
      })
    }
    if (!address) throw new BadRequestError('Endereço de entrega inválido')

    // 2. Buscar itens do carrinho
    const cartItems = await prisma.cartItem.findMany({
      where: { userId },
      include: { product: true },
    })

    if (cartItems.length === 0) {
      throw new BadRequestError('O carrinho está vazio')
    }

    // 3. Verificar estoque de todos os itens
    for (const item of cartItems) {
      if (!item.product.isActive || item.product.stock < item.quantity) {
        throw new BadRequestError(
          `O produto ${item.product.name} não possui estoque suficiente.`
        )
      }
    }

    // 4. Calcular subtotal
    const subtotal = cartItems.reduce(
      (sum, item) => sum + Number(item.product.price) * item.quantity,
      0
    )

    // 5. Aplicar cupom se fornecido
    let discount = 0
    let couponId: string | undefined

    if (data.couponCode) {
      const coupon = await prisma.coupon.findUnique({
        where: { code: data.couponCode.toUpperCase() },
      })

      if (
        coupon &&
        coupon.isActive &&
        (!coupon.expiresAt || coupon.expiresAt > new Date()) &&
        (!coupon.maxUses || coupon.currentUses < coupon.maxUses) &&
        (!coupon.minOrderValue || subtotal >= Number(coupon.minOrderValue))
      ) {
        couponId = coupon.id
        if (coupon.discountType === 'percentage') {
          discount = (subtotal * Number(coupon.discountValue)) / 100
        } else {
          discount = Number(coupon.discountValue)
        }
      }
    }

    const shippingCost = subtotal > 3000 ? 0 : 49.90 // Frete grátis acima de R$ 3.000
    const total = Math.max(0, subtotal - discount + shippingCost)

    // 6. Transação no banco de dados para criar pedido, itens e abater estoque
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.order.create({
        data: {
          userId,
          addressId: address.id,
          paymentGateway: data.paymentGateway,
          paymentMethod: data.paymentMethod,
          subtotal,
          shippingCost,
          discount,
          total,
          couponId,
          notes: data.notes,
          status: OrderStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          items: {
            create: cartItems.map((item) => ({
              productId: item.productId,
              name: item.product.name,
              price: item.product.price,
              quantity: item.quantity,
              color: item.color,
              storage: item.storage,
            })),
          },
        },
        include: {
          items: true,
          address: true,
          user: { select: { name: true, email: true } },
        },
      })

      // Abater estoque e incrementar total vendido
      for (const item of cartItems) {
        await tx.product.update({
          where: { id: item.productId },
          data: {
            stock: { decrement: item.quantity },
            totalSold: { increment: item.quantity },
          },
        })
      }

      // Se cupom usado, incrementar usos
      if (couponId) {
        await tx.coupon.update({
          where: { id: couponId },
          data: { currentUses: { increment: 1 } },
        })
      }

      // Limpar carrinho
      await tx.cartItem.deleteMany({ where: { userId } })

      return newOrder
    })

    // Enviar e-mail de confirmação de criação de pedido
    const customer = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })
    if (customer) {
      sendMail({
        to: customer.email,
        subject: `Nexus Shop — Pedido #${order.id.slice(-8)} recebido!`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <h2>Pedido #${order.id.slice(-8)} recebido!</h2>
            <p>Olá, ${customer.name}. Seu pedido foi registrado e aguarda confirmação de pagamento.</p>
            <p><strong>Total:</strong> R$ ${Number(order.total).toFixed(2)}</p>
            <p><strong>Entrega em:</strong> ${address.street}, ${address.number} - ${address.city}/${address.state}</p>
          </div>
        `,
      }).catch(console.error)
    }

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
        transactions: true,
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
    const order = await prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(trackingCode ? { trackingCode } : {}),
      },
      include: { user: { select: { email: true, name: true } } },
    })

    if (trackingCode) {
      sendMail({
        to: order.user.email,
        subject: `Nexus Shop — Pedido #${order.id.slice(-8)} enviado! 🚚`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
            <h2>Seu smartphone está a caminho! 📦</h2>
            <p>Olá, ${order.user.name}. O pedido #${order.id.slice(-8)} foi postado.</p>
            <p><strong>Código de rastreio:</strong> ${trackingCode}</p>
          </div>
        `,
      }).catch(console.error)
    }

    return order
  }
}
