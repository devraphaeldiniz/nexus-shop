import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { OrderService } from './orders.service.js'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'
import { PaymentGateway, PaymentMethod, OrderStatus } from '@prisma/client'
import { SHIPPING_OPTION_IDS } from '../shipping/shipping.service.js'

/** Combinações aceitas: PIX via Mercado Pago, cartão via Stripe. */
const ALLOWED_METHODS: Record<PaymentGateway, PaymentMethod[]> = {
  MERCADOPAGO: [PaymentMethod.PIX],
  STRIPE: [PaymentMethod.CREDIT_CARD],
}

const CreateOrderSchema = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.string().min(1),
          quantity: z.number().int().positive().max(20),
          color: z.string().max(50).optional(),
          storage: z.string().max(50).optional(),
        })
      )
      .min(1, 'O carrinho está vazio')
      .max(50),
    shippingOptionId: z.enum(SHIPPING_OPTION_IDS),
    addressId: z.string().min(1).optional(),
    address: z
      .object({
        street: z.string().min(1),
        number: z.string().min(1),
        complement: z.string().optional(),
        neighborhood: z.string().min(1),
        city: z.string().min(1),
        state: z.string().min(2).max(2),
        zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido'),
      })
      .optional(),
    paymentGateway: z.nativeEnum(PaymentGateway),
    paymentMethod: z.nativeEnum(PaymentMethod),
    couponCode: z.string().optional(),
    notes: z.string().max(500).optional(),
  })
  .refine((d) => d.addressId || d.address, {
    message: 'Informe o endereço de entrega',
    path: ['address'],
  })
  .refine((d) => ALLOWED_METHODS[d.paymentGateway].includes(d.paymentMethod), {
    message: 'Forma de pagamento indisponível para este gateway',
    path: ['paymentMethod'],
  })

const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingCode: z.string().max(100).optional(),
})

export async function orderRoutes(app: FastifyInstance) {
  const orderService = new OrderService()

  app.addHook('preHandler', authenticate)

  app.post('/', async (request, reply) => {
    const data = CreateOrderSchema.parse(request.body)
    const order = await orderService.create(request.user!.userId, data)
    return reply.status(201).send({ order })
  })

  app.get('/my-orders', async (request, reply) => {
    const orders = await orderService.listUserOrders(request.user!.userId)
    return reply.send({ orders })
  })

  // Rotas Admin (declaradas antes de /:id para não colidir)
  app.get('/admin/all', { preHandler: [authorize('ADMIN')] }, async (request, reply) => {
    const query = request.query as { page?: string; limit?: string; status?: OrderStatus }
    const page = Number(query.page) || 1
    const limit = Math.min(Number(query.limit) || 20, 100)
    const status = query.status && query.status in OrderStatus ? query.status : undefined
    const result = await orderService.listAll(page, limit, status)
    return reply.send(result)
  })

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const isAdmin = request.user!.role === 'ADMIN'
    const order = await orderService.getById(id, request.user!.userId, isAdmin)
    return reply.send({ order })
  })

  app.patch('/:id/status', { preHandler: [authorize('ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, trackingCode } = UpdateOrderStatusSchema.parse(request.body)
    const order = await orderService.updateStatus(id, status, trackingCode)
    return reply.send({ order })
  })
}
