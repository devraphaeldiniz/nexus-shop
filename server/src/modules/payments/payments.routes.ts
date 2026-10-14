import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { PaymentService } from './payments.service.js'
import { authenticate } from '../../middlewares/auth.middleware.js'

const StripeIntentSchema = z.object({
  orderId: z.string().min(1),
})

const MercadoPagoPreferenceSchema = z.object({
  orderId: z.string().min(1),
})

const MercadoPagoPixSchema = z.object({
  orderId: z.string().min(1),
})

export async function paymentRoutes(app: FastifyInstance) {
  const paymentService = new PaymentService()

  // 1. Criar Stripe PaymentIntent
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

  // 2. Webhook Stripe
  app.post('/stripe/webhook', async (request, reply) => {
    // In fastify, the body is parsed or raw depending on configuration
    const result = await paymentService.handleStripeWebhook(request.body)
    return reply.send(result)
  })

  // 3. Criar Mercado Pago Checkout Preference
  app.post(
    '/mercadopago/create-preference',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { orderId } = MercadoPagoPreferenceSchema.parse(request.body)
      const result = await paymentService.createMercadoPagoPreference(
        orderId,
        request.user!.userId
      )
      return reply.send(result)
    }
  )

  // 4. Criar Mercado Pago PIX
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

  // 5. Webhook Mercado Pago
  app.post('/mercadopago/webhook', async (request, reply) => {
    const result = await paymentService.handleMercadoPagoWebhook(request.body)
    return reply.send(result)
  })

  // 6. Simular confirmação de pagamento para ambiente de testes / demonstração
  app.post(
    '/simulate-confirm',
    { preHandler: [authenticate] },
    async (request, reply) => {
      const { orderId, gateway } = request.body as { orderId: string; gateway: string }
      const order = await paymentService.completePayment(
        orderId,
        gateway === 'MERCADOPAGO' ? 'MERCADOPAGO' : 'STRIPE',
        `sim_${Date.now()}`,
        100
      )
      return reply.send({ success: true, order })
    }
  )
}
