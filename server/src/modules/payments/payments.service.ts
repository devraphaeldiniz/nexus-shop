import crypto from 'crypto'
import Stripe from 'stripe'
import { MercadoPagoConfig, Preference, Payment } from 'mercadopago'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { PaymentGateway, PaymentStatus, OrderStatus } from '@prisma/client'
import { BadRequestError, NotFoundError, UnauthorizedError } from '../../utils/errors.js'
import { sendMail } from '../../config/mail.js'

export class PaymentService {
  /**
   * Obtém as credenciais ativas do lojista ou recorre às variáveis de ambiente
   */
  private async getActiveCredentials() {
    const settings = await prisma.storeSettings.findUnique({ where: { id: 'default' } })
    return {
      stripeSecret: settings?.stripeSecretKey || env.STRIPE_SECRET_KEY,
      stripeWebhookSecret: env.STRIPE_WEBHOOK_SECRET,
      mpAccessToken: settings?.mercadoPagoAccessToken || env.MERCADOPAGO_ACCESS_TOKEN,
      mpWebhookSecret: env.MERCADOPAGO_WEBHOOK_SECRET,
      storeName: settings?.storeName || 'Nexus Shop',
    }
  }

  // ==========================================
  // STRIPE: INTENT & WEBHOOK REAL COM ASSINATURA
  // ==========================================
  async createStripeIntent(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { user: true, items: true },
    })

    if (!order) throw new NotFoundError('Pedido não encontrado')
    if (order.paymentStatus === 'PAID') {
      throw new BadRequestError('Este pedido já foi pago')
    }

    const { stripeSecret } = await this.getActiveCredentials()
    const activeStripe = new Stripe(stripeSecret, {
      apiVersion: '2024-06-20',
      typescript: true,
    })

    const amountInCents = Math.round(Number(order.total) * 100)

    const paymentIntent = await activeStripe.paymentIntents.create({
      amount: amountInCents,
      currency: env.STRIPE_CURRENCY,
      metadata: {
        orderId: order.id,
        userId: order.userId,
      },
      receipt_email: order.user.email,
      automatic_payment_methods: { enabled: true },
    })

    await prisma.order.update({
      where: { id: order.id },
      data: { externalReference: paymentIntent.id },
    })

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      gateway: PaymentGateway.STRIPE,
    }
  }

  async handleStripeWebhook(rawBody: string | Buffer, signature: string) {
    const { stripeSecret, stripeWebhookSecret } = await this.getActiveCredentials()
    const activeStripe = new Stripe(stripeSecret, {
      apiVersion: '2024-06-20',
      typescript: true,
    })

    let event: Stripe.Event
    try {
      event = activeStripe.webhooks.constructEvent(
        rawBody,
        signature,
        stripeWebhookSecret
      )
    } catch (err: any) {
      throw new UnauthorizedError(`Assinatura de Webhook Stripe inválida: ${err.message}`)
    }

    if (event.type === 'payment_intent.succeeded') {
      const intent = event.data.object as Stripe.PaymentIntent
      const orderId = intent.metadata?.orderId
      if (orderId) {
        await this.completePayment(
          orderId,
          PaymentGateway.STRIPE,
          intent.id,
          intent.amount / 100
        )
      }
    } else if (event.type === 'payment_intent.payment_failed') {
      const intent = event.data.object as Stripe.PaymentIntent
      const orderId = intent.metadata?.orderId
      if (orderId) {
        await prisma.order.update({
          where: { id: orderId },
          data: { paymentStatus: PaymentStatus.FAILED },
        })
      }
    }

    return { received: true }
  }

  // ==========================================
  // MERCADO PAGO: PIX REAL E WEBHOOK HMAC
  // ==========================================
  async createMercadoPagoPix(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { user: true },
    })

    if (!order) throw new NotFoundError('Pedido não encontrado')
    if (order.paymentStatus === 'PAID') {
      throw new BadRequestError('Este pedido já foi pago')
    }

    const { mpAccessToken, storeName } = await this.getActiveCredentials()
    const client = new MercadoPagoConfig({ accessToken: mpAccessToken })
    const payment = new Payment(client)

    const names = (order.user.name || 'Cliente Nexus').trim().split(' ')
    const firstName = names[0]
    const lastName = names.slice(1).join(' ') || 'Cliente'

    // Expira em 30 minutos por segurança
    const expirationDate = new Date(Date.now() + 30 * 60 * 1000).toISOString()

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
      },
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
   * Webhook do Mercado Pago com verificação de assinatura HMAC-SHA256 (Anti-spoofing)
   */
  async handleMercadoPagoWebhook(
    body: any,
    xSignature?: string,
    xRequestId?: string
  ) {
    const { mpAccessToken, mpWebhookSecret } = await this.getActiveCredentials()

    // Validação de assinatura se o segredo estiver configurado
    if (mpWebhookSecret && xSignature && xRequestId) {
      const parts = xSignature.split(',')
      let ts = ''
      let hash = ''
      for (const part of parts) {
        const [k, v] = part.split('=')
        if (k.trim() === 'ts') ts = v.trim()
        if (k.trim() === 'v1') hash = v.trim()
      }

      const manifest = `id:${body.data?.id};request-id:${xRequestId};ts:${ts};`
      const expectedHash = crypto
        .createHmac('sha256', mpWebhookSecret)
        .update(manifest)
        .digest('hex')

      if (hash !== expectedHash) {
        throw new UnauthorizedError('Assinatura do webhook Mercado Pago inválida.')
      }
    }

    if (body.action === 'payment.created' || body.action === 'payment.updated') {
      const paymentId = body.data?.id
      if (paymentId) {
        const client = new MercadoPagoConfig({ accessToken: mpAccessToken })
        const mpPayment = new Payment(client)

        const paymentData = await mpPayment.get({ id: paymentId })
        if (paymentData.status === 'approved' && paymentData.external_reference) {
          await this.completePayment(
            paymentData.external_reference,
            PaymentGateway.MERCADOPAGO,
            String(paymentData.id),
            Number(paymentData.transaction_amount)
          )
        }
      }
    }

    return { received: true }
  }

  // ==========================================
  // CONFIRMAÇÃO DE PAGAMENTO & BAIXA DEFINITIVA
  // ==========================================
  async completePayment(
    orderId: string,
    gateway: PaymentGateway,
    transactionId: string,
    amount: number
  ) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { user: true, items: true },
      })

      if (!order) throw new NotFoundError('Pedido não localizado')
      if (order.paymentStatus === 'PAID') return order // Idempotência garantida

      const updatedOrder = await tx.order.update({
        where: { id: orderId },
        data: {
          paymentStatus: PaymentStatus.PAID,
          status: OrderStatus.CONFIRMED,
        },
      })

      await tx.paymentTransaction.create({
        data: {
          orderId,
          gateway,
          transactionId,
          status: PaymentStatus.PAID,
          amount,
        },
      })

      // Envia confirmação por e-mail para o comprador
      sendMail({
        to: order.user.email,
        subject: `Pagamento Aprovado — Pedido #${order.id.slice(-8)}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #059669; margin-top: 0;">Pagamento Confirmado com Sucesso!</h2>
            <p>Olá, <strong>${order.user.name}</strong>. Recebemos a confirmação do seu pagamento.</p>
            <p><strong>Pedido:</strong> #${order.id.slice(-8)}</p>
            <p><strong>Valor:</strong> R$ ${Number(order.total).toFixed(2)}</p>
            <p>Seu pedido já foi encaminhado para a equipe de separação e expedição.</p>
          </div>
        `,
      }).catch(console.error)

      return updatedOrder
    })
  }
}
