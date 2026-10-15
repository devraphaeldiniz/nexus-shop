import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PaymentService } from './payments.service.js'
import { authenticate } from '../../middlewares/auth.middleware.js'

const StripeIntentSchema = z.object({
  orderId: z.string().min(1),
})

const MercadoPagoPixSchema = z.object({
  orderId: z.string().min(1),
})

export async function paymentRoutes(app: FastifyInstance) {
  const paymentService = new PaymentService()

  // 1. Criar Stripe PaymentIntent real
  app.post(
    '/stripe/create-intent',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { orderId } = StripeIntentSchema.parse(request.body)
      const result = await paymentService.createStripeIntent(
        orderId,
        request.user!.userId
      )
      return reply.send(result)
    }
  )

  // 2. Webhook Stripe com validação de assinatura
  app.post('/stripe/webhook', async (request, reply) => {
    const signature = request.headers['stripe-signature'] as string
    if (!signature) {
      return reply.status(400).send({ error: 'Assinatura stripe-signature ausente' })
    }
    const result = await paymentService.handleStripeWebhook(
      JSON.stringify(request.body),
      signature
    )
    return reply.send(result)
  })

  // 3. Criar PIX Real via Mercado Pago
  app.post(
    '/mercadopago/create-pix',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { orderId } = MercadoPagoPixSchema.parse(request.body)
      const result = await paymentService.createMercadoPagoPix(
        orderId,
        request.user!.userId
      )
      return reply.send(result)
    }
  )

  // 4. Webhook Mercado Pago com validação HMAC
  app.post('/mercadopago/webhook', async (request, reply) => {
    const xSignature = request.headers['x-signature'] as string | undefined
    const xRequestId = request.headers['x-request-id'] as string | undefined
    const result = await paymentService.handleMercadoPagoWebhook(
      request.body,
      xSignature,
      xRequestId
    )
    return reply.send(result)
  })
}
