import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PaymentService } from './payments.service.js'
import { authenticate } from '../../middlewares/auth.middleware.js'
import { BadRequestError } from '../../utils/errors.js'

declare module 'fastify' {
  interface FastifyRequest {
    rawBody?: Buffer
  }
}

const OrderPaymentSchema = z.object({
  orderId: z.string().min(1),
})

export async function paymentRoutes(app: FastifyInstance) {
  const paymentService = new PaymentService()

  // Neste escopo o JSON é lido como Buffer e guardado em request.rawBody,
  // porque a assinatura do Stripe é calculada sobre o corpo original (byte a byte).
  app.removeContentTypeParser('application/json')
  app.addContentTypeParser('application/json', { parseAs: 'buffer' }, (request, body, done) => {
    const buffer = body as Buffer
    request.rawBody = buffer
    if (buffer.length === 0) return done(null, {})
    try {
      done(null, JSON.parse(buffer.toString('utf8')))
    } catch {
      done(new BadRequestError('JSON inválido'), undefined)
    }
  })

  // 1. Criar Stripe PaymentIntent
  app.post(
    '/stripe/create-intent',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { orderId } = OrderPaymentSchema.parse(request.body)
      const result = await paymentService.createStripeIntent(orderId, request.user!.userId)
      return reply.send(result)
    }
  )

  // 2. Webhook Stripe com validação de assinatura sobre o corpo bruto
  app.post('/stripe/webhook', async (request, reply) => {
    const signature = request.headers['stripe-signature']
    if (typeof signature !== 'string' || !signature) {
      return reply.status(400).send({ error: 'Assinatura stripe-signature ausente' })
    }
    if (!request.rawBody) {
      return reply.status(400).send({ error: 'Corpo da requisição ausente' })
    }
    const result = await paymentService.handleStripeWebhook(request.rawBody, signature)
    return reply.send(result)
  })

  // 3. Criar PIX via Mercado Pago
  app.post(
    '/mercadopago/create-pix',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { orderId } = OrderPaymentSchema.parse(request.body)
      const result = await paymentService.createMercadoPagoPix(orderId, request.user!.userId)
      return reply.send(result)
    }
  )

  // 4. Webhook Mercado Pago com validação HMAC obrigatória
  app.post('/mercadopago/webhook', async (request, reply) => {
    const xSignature = request.headers['x-signature'] as string | undefined
    const xRequestId = request.headers['x-request-id'] as string | undefined
    const result = await paymentService.handleMercadoPagoWebhook(
      request.body as Parameters<PaymentService['handleMercadoPagoWebhook']>[0],
      (request.query ?? {}) as Record<string, unknown>,
      xSignature,
      xRequestId
    )
    return reply.send(result)
  })
}
