import Stripe from 'stripe'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { PaymentGateway, PaymentMethod, PaymentStatus, OrderStatus } from '@prisma/client'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors.js'
import { sendMail } from '../../config/mail.js'
import { roundMoney, sameAmount } from '../../utils/money.js'
import { escapeHtml } from '../../utils/html.js'
import { verifyMercadoPagoSignature } from '../../utils/mercadopago-signature.js'
import { decryptSecret } from '../../utils/secret-box.js'
import { cancelUnpaidOrder, reserveStock } from '../orders/orders.service.js'

const STRIPE_API_VERSION = '2024-06-20' as const
/** PIX expira em 30 min; a varredura cancela com uma folga. */
const PIX_EXPIRATION_MINUTES = 30
const PIX_STALE_MINUTES = 35
/** Pedidos de cartão sem pagamento são cancelados depois de 24h. */
const CARD_STALE_HOURS = 24

/** Status de PaymentIntent em que ainda dá para pagar com o mesmo client_secret. */
const REUSABLE_INTENT_STATUSES: Stripe.PaymentIntent.Status[] = [
  'requires_payment_method',
  'requires_confirmation',
  'requires_action',
]

/** Corpo das notificações do Mercado Pago (só os campos usados). */
interface MercadoPagoNotification {
  type?: string
  action?: string
  data?: { id?: string | number }
}

function appendNote(current: string | null, note: string) {
  return [current, `[sistema] ${note}`].filter(Boolean).join('\n')
}

export class PaymentService {
  /**
   * Obtém as credenciais ativas do lojista ou recorre às variáveis de ambiente
   */
  private async getActiveCredentials() {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } })
    return {
      stripeSecret: decryptSecret(settings?.stripeSecretKey) || env.STRIPE_SECRET_KEY,
      stripePublishableKey: settings?.stripePublishableKey || env.STRIPE_PUBLISHABLE_KEY || null,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      mpAccessToken: decryptSecret(settings?.mercadoPagoAccessToken) || env.MERCADOPAGO_ACCESS_TOKEN,
      storeName: settings?.storeName || 'Nexus Shop',
    }
  }

  private stripeClient(secret: string) {
    return new Stripe(secret, { apiVersion: STRIPE_API_VERSION, typescript: true })
  }

  private mpPaymentClient(accessToken: string) {
    return new Payment(new MercadoPagoConfig({ accessToken, options: { timeout: 5000 } }))
  }

  /** Pedido do usuário, pendente e criado para o gateway informado. */
  private async getPayableOrder(orderId: string, userId: string, gateway: PaymentGateway) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { user: true },
    })

    if (!order) throw new NotFoundError('Pedido não encontrado')
    if (order.paymentStatus === PaymentStatus.PAID) {
      throw new BadRequestError('Este pedido já foi pago')
    }
    if (order.status !== OrderStatus.PENDING) {
      throw new BadRequestError('Este pedido não está mais aguardando pagamento')
    }
    if (order.paymentGateway !== gateway) {
      throw new BadRequestError('Este pedido foi criado para outra forma de pagamento')
    }
    return order
  }

  // ==========================================
  // STRIPE: INTENT & WEBHOOK COM ASSINATURA
  // ==========================================
  async createStripeIntent(orderId: string, userId: string) {
    const order = await this.getPayableOrder(orderId, userId, PaymentGateway.STRIPE)
    const { stripeSecret, stripePublishableKey } = await this.getActiveCredentials()
    if (!stripeSecret) {
      throw new BadRequestError('Pagamento com cartão indisponível: chave secreta do Stripe não configurada.')
    }

    if (!stripePublishableKey) {
      throw new BadRequestError('Pagamento com cartão indisponível: chave pública do Stripe não configurada.')
    }

    const stripe = this.stripeClient(stripeSecret)
    const amountInCents = Math.round(Number(order.total) * 100)

    // Reaproveita a intenção existente (evita cobranças duplicadas em recarregamentos)
    if (order.externalReference?.startsWith('pi_')) {
      const existing = await stripe.paymentIntents.retrieve(order.externalReference)
      if (REUSABLE_INTENT_STATUSES.includes(existing.status) && existing.amount === amountInCents) {
        return {
          clientSecret: existing.client_secret,
          paymentIntentId: existing.id,
          publishableKey: stripePublishableKey,
          gateway: PaymentGateway.STRIPE,
        }
      }
    }

    const paymentIntent = await stripe.paymentIntents.create(
      {
        amount: amountInCents,
        currency: env.STRIPE_CURRENCY,
        metadata: {
          orderId: order.id,
          userId: order.userId,
        },
        receipt_email: order.user.email,
        automatic_payment_methods: { enabled: true },
      },
      { idempotencyKey: `order-${order.id}-${amountInCents}-${order.externalReference ?? 'first'}` }
    )

    await prisma.order.update({
      where: { id: order.id },
      data: { externalReference: paymentIntent.id },
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      publishableKey: stripePublishableKey,
      gateway: PaymentGateway.STRIPE,
    }
  }

  /**
   * Webhook do Stripe. Recebe o corpo BRUTO (Buffer), exigido pela verificação de assinatura.
   */
  async handleStripeWebhook(rawBody: Buffer, signature: string) {
    const { stripeSecret, stripeWebhookSecret } = await this.getActiveCredentials()
    const stripe = this.stripeClient(stripeSecret)

    if (!stripeWebhookSecret) {
      throw new UnauthorizedError('Segredo do webhook Stripe não configurado.')
    }

    let event: Stripe.Event
    try {
      event = stripe.webhooks.constructEvent(rawBody, signature, stripeWebhookSecret)
    } catch (err) {
      const reason = err instanceof Error ? err.message : 'erro desconhecido'
      throw new UnauthorizedError(`Assinatura de Webhook Stripe inválida: ${reason}`)
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent
      const orderId = intent.metadata?.orderId
      if (orderId) {
        await this.completePayment(orderId, PaymentGateway.STRIPE, intent.id, intent.amount_received / 100)
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      // Cartão recusado: o cliente ainda pode tentar de novo, então o pedido segue PENDING
      const intent = event.data.object as Stripe.PaymentIntent
      const orderId = intent.metadata?.orderId
      if (orderId) {
        await prisma.order.updateMany({
          where: { id: orderId, paymentStatus: { not: PaymentStatus.PAID } },
          data: { paymentStatus: PaymentStatus.FAILED },
        })
      }
    }

    return { received: true }
  }

  // ==========================================
  // MERCADO PAGO: PIX E WEBHOOK HMAC
  // ==========================================
  async createMercadoPagoPix(orderId: string, userId: string) {
    const order = await this.getPayableOrder(orderId, userId, PaymentGateway.MERCADOPAGO)
    const { mpAccessToken, storeName } = await this.getActiveCredentials()
    if (!mpAccessToken) {
      throw new BadRequestError('PIX indisponível: token do Mercado Pago não configurado.')
    }
    const payment = this.mpPaymentClient(mpAccessToken)

    // Reaproveita o PIX pendente que ainda não expirou
    if (order.externalReference) {
      try {
        const existing = await payment.get({ id: order.externalReference })
        const expiresAt = existing.date_of_expiration ? new Date(existing.date_of_expiration) : null
        const data = existing.point_of_interaction?.transaction_data
        if (existing.status === 'pending' && expiresAt && expiresAt.getTime() > Date.now() + 60_000 && data?.qr_code) {
          return {
            paymentId: existing.id,
            qrCode: data.qr_code,
            qrCodeBase64: data.qr_code_base64,
            ticketUrl: data.ticket_url,
            expiresAt: expiresAt.toISOString(),
          }
        }
      } catch {
        // Pagamento anterior não encontrado: gera um novo
      }
    }

    const names = (order.user.name || 'Cliente Nexus').trim().split(' ')
    const firstName = names[0]
    const lastName = names.slice(1).join(' ') || 'Cliente'
    const expirationDate = new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000).toISOString()

    const result = await payment.create({
      body: {
        transaction_amount: Number(order.total),
        description: `${storeName} - Pedido #${order.id.slice(-8)}`,
        payment_method_id: 'pix',
        payer: {
          email: order.user.email,
          first_name: firstName,
          last_name: lastName,
        },
        external_reference: order.id,
        date_of_expiration: expirationDate,
        // Sem notification_url o Mercado Pago só avisa se o webhook estiver configurado no painel
        ...(env.API_PUBLIC_URL
          ? { notification_url: `${env.API_PUBLIC_URL.replace(/\/$/, '')}/api/v1/payments/mercadopago/webhook` }
          : {}),
      },
      requestOptions: { idempotencyKey: `pix-${order.id}-${order.externalReference ?? 'first'}` },
    })

    const pointOfInteraction = result.point_of_interaction?.transaction_data

    await prisma.order.update({
      where: { id: order.id },
      data: { externalReference: String(result.id) },
    })

    return {
      paymentId: result.id,
      qrCode: pointOfInteraction?.qr_code,
      qrCodeBase64: pointOfInteraction?.qr_code_base64,
      ticketUrl: pointOfInteraction?.ticket_url,
      expiresAt: expirationDate,
    }
  }

  /**
   * Webhook do Mercado Pago. A assinatura é obrigatória e o status é sempre
   * confirmado consultando o pagamento na API (nunca confiando no corpo recebido).
   */
  async handleMercadoPagoWebhook(
    body: MercadoPagoNotification | undefined,
    query: Record<string, unknown>,
    xSignature?: string,
    xRequestId?: string
  ) {
    const dataId = String(query?.['data.id'] ?? body?.data?.id ?? '').trim()

    // Assinatura validada antes de qualquer acesso ao banco ou à API do Mercado Pago
    if (!env.MERCADOPAGO_WEBHOOK_SECRET) {
      throw new UnauthorizedError('Segredo do webhook Mercado Pago não configurado.')
    }
    verifyMercadoPagoSignature(env.MERCADOPAGO_WEBHOOK_SECRET, dataId, xSignature, xRequestId)

    const { mpAccessToken } = await this.getActiveCredentials()

    const type = body?.type ?? query?.type ?? query?.topic
    const isPaymentEvent = type === 'payment' || String(body?.action ?? '').startsWith('payment.')
    if (!isPaymentEvent || !dataId) return { received: true }

    const paymentData = await this.mpPaymentClient(mpAccessToken).get({ id: dataId })
    const orderId = paymentData.external_reference
    if (!orderId) return { received: true }

    if (paymentData.status === 'approved') {
      await this.completePayment(
        orderId,
        PaymentGateway.MERCADOPAGO,
        String(paymentData.id),
        Number(paymentData.transaction_amount)
      )
    } else if (paymentData.status === 'cancelled' || paymentData.status === 'rejected') {
      // PIX expirado chega como "cancelled": devolve estoque se ainda for a cobrança atual
      await cancelUnpaidOrder(orderId, `pagamento Mercado Pago ${paymentData.status}`, String(paymentData.id))
    }

    return { received: true }
  }

  // ==========================================
  // CONFIRMAÇÃO DE PAGAMENTO & BAIXA DEFINITIVA
  // ==========================================
  /**
   * Confirma o pagamento de um pedido. Idempotente por transactionId.
   * - Valor diferente do total: registra a transação como FAILED e não libera o pedido.
   * - Pedido já cancelado (ex.: PIX pago depois de expirar): tenta reservar o estoque de novo;
   *   se não houver, marca como pago e deixa uma nota para reembolso manual.
   */
  async completePayment(
    orderId: string,
    gateway: PaymentGateway,
    transactionId: string,
    amount: number
  ) {
    const outcome = await prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true, items: true },
      })
      if (!order) {
        console.warn(`[payments] Pedido ${orderId} não encontrado para a transação ${transactionId}`)
        return null
      }

      const alreadyRecorded = await tx.paymentTransaction.findUnique({ where: { transactionId } })
      if (alreadyRecorded) return null // Idempotência: webhook repetido

      const paidAmount = roundMoney(amount)

      if (!sameAmount(paidAmount, Number(order.total))) {
        await tx.paymentTransaction.create({
          data: {
            orderId,
            gateway,
            transactionId,
            status: PaymentStatus.FAILED,
            amount: paidAmount,
            payload: { reason: 'amount_mismatch', expected: Number(order.total), received: paidAmount },
          },
        })
        await tx.order.update({
          where: { id: orderId },
          data: {
            notes: appendNote(
              order.notes,
              `Pagamento ${transactionId} com valor divergente (recebido R$ ${paidAmount.toFixed(2)}, esperado R$ ${Number(order.total).toFixed(2)}). Verificar.`
            ),
          },
        })
        console.warn(`[payments] Valor divergente no pedido ${orderId}: ${paidAmount} != ${order.total}`)
        return null
      }

      if (order.paymentStatus === PaymentStatus.PAID) {
        // Segundo pagamento para o mesmo pedido: registra para reembolso
        await tx.paymentTransaction.create({
          data: { orderId, gateway, transactionId, status: PaymentStatus.PAID, amount: paidAmount, payload: { warning: 'duplicate_payment' } },
        })
        await tx.order.update({
          where: { id: orderId },
          data: { notes: appendNote(order.notes, `Pagamento duplicado ${transactionId}. Reembolsar.`) },
        })
        return null
      }

      let status: OrderStatus = OrderStatus.CONFIRMED
      let notes = order.notes

      if (order.status === OrderStatus.CANCELLED) {
        const grouped = new Map<string, number>()
        for (const item of order.items) grouped.set(item.productId, (grouped.get(item.productId) || 0) + item.quantity)
        const products = await tx.product.findMany({
          where: { id: { in: [...grouped.keys()] } },
          select: { id: true, stock: true, isActive: true },
        })
        const hasStock = [...grouped].every(([id, qty]) => {
          const p = products.find((x) => x.id === id)
          return !!p && p.isActive && p.stock >= qty
        })

        if (hasStock) {
          await reserveStock(tx, order.items)
          if (order.couponId) {
            await tx.coupon.update({ where: { id: order.couponId }, data: { currentUses: { increment: 1 } } })
          }
          notes = appendNote(notes, 'Pago após o cancelamento; estoque reservado novamente.')
        } else {
          status = OrderStatus.CANCELLED
          notes = appendNote(notes, `Pago após o cancelamento e sem estoque (${transactionId}). Reembolsar.`)
        }
      } else if (order.status !== OrderStatus.PENDING) {
        status = order.status
      }

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: { paymentStatus: PaymentStatus.PAID, status, notes },
      })

      await tx.paymentTransaction.create({
        data: { orderId, gateway, transactionId, status: PaymentStatus.PAID, amount: paidAmount },
      })

      return { order, updatedOrder }
    })

    if (outcome && outcome.updatedOrder.status === OrderStatus.CONFIRMED) {
      const { order } = outcome
      sendMail({
        to: order.user.email,
        subject: `Pagamento Aprovado — Pedido #${order.id.slice(-8)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #059669; margin-top: 0;">Pagamento Confirmado com Sucesso!</h2>
            <p>Olá, <strong>${escapeHtml(order.user.name)}</strong>. Recebemos a confirmação do seu pagamento.</p>
            <p><strong>Pedido:</strong> #${order.id.slice(-8)}</p>
            <p><strong>Valor:</strong> R$ ${Number(order.total).toFixed(2)}</p>
            <p>Seu pedido já foi encaminhado para a equipe de separação e expedição.</p>
          </div>
        `,
      }).catch(console.error)
    }

    return outcome?.updatedOrder ?? null
  }

  // ==========================================
  // VARREDURA DE PEDIDOS SEM PAGAMENTO
  // ==========================================
  /**
   * Cancela pedidos pendentes que passaram do prazo (PIX: 35 min, cartão: 24h) e devolve o estoque.
   * Antes de cancelar, consulta o gateway: se o pagamento foi aprovado e o webhook se perdeu, confirma.
   */
  async reconcileStaleOrders(): Promise<{ confirmed: number; cancelled: number }> {
    const now = Date.now()
    const stale = await prisma.order.findMany({
      where: {
        status: OrderStatus.PENDING,
        paymentStatus: { not: PaymentStatus.PAID },
        OR: [
          { paymentMethod: PaymentMethod.PIX, createdAt: { lt: new Date(now - PIX_STALE_MINUTES * 60_000) } },
          { paymentMethod: PaymentMethod.CREDIT_CARD, createdAt: { lt: new Date(now - CARD_STALE_HOURS * 3_600_000) } },
        ],
      },
      take: 50,
      orderBy: { createdAt: 'asc' },
    })

    let confirmed = 0
    let cancelled = 0
    if (stale.length === 0) return { confirmed, cancelled }

    const { stripeSecret, mpAccessToken } = await this.getActiveCredentials()

    for (const order of stale) {
      try {
        // Antes de cancelar, confere no gateway se o pagamento não foi aprovado (webhook perdido).
        // Se a consulta falhar, cancela mesmo assim: um pagamento que chegue depois é tratado
        // por completePayment (reserva o estoque de novo ou marca para reembolso).
        try {
          if (order.externalReference && order.paymentGateway === PaymentGateway.MERCADOPAGO) {
            const payment = await this.mpPaymentClient(mpAccessToken).get({ id: order.externalReference })
            if (payment.status === 'approved') {
              await this.completePayment(order.id, PaymentGateway.MERCADOPAGO, String(payment.id), Number(payment.transaction_amount))
              confirmed++
              continue
            }
          }

          if (order.externalReference?.startsWith('pi_') && order.paymentGateway === PaymentGateway.STRIPE) {
            const stripe = this.stripeClient(stripeSecret)
            const intent = await stripe.paymentIntents.retrieve(order.externalReference)
            if (intent.status === 'succeeded') {
              await this.completePayment(order.id, PaymentGateway.STRIPE, intent.id, intent.amount_received / 100)
              confirmed++
              continue
            }
            if (intent.status === 'processing') continue // aguarda o resultado do cartão
            if (intent.status !== 'canceled') {
              await stripe.paymentIntents.cancel(intent.id).catch(() => undefined)
            }
          }
        } catch (error) {
          console.warn(`[payments] Não foi possível consultar o gateway do pedido ${order.id}; cancelando pelo prazo.`, error instanceof Error ? error.message : error)
        }

        if (await cancelUnpaidOrder(order.id, 'prazo de pagamento expirado')) cancelled++
      } catch (error) {
        console.error(`[payments] Falha ao reconciliar o pedido ${order.id}:`, error)
      }
    }

    return { confirmed, cancelled }
  }
}
