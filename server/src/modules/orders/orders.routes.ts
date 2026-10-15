import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { OrderService } from './orders.service.js'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'
import { PaymentGateway, PaymentMethod, OrderStatus } from '@prisma/client'

const CreateOrderSchema = z.object({
  addressId: z.string().min(1).optional(),
  address: z.object({
    street: z.string().min(1),
    number: z.string().min(1),
    complement: z.string().optional(),
    neighborhood: z.string().min(1),
    city: z.string().min(1),
    state: z.string().min(2),
    zipCode: z.string().min(8),
  }).optional(),
  paymentGateway: z.nativeEnum(PaymentGateway),
  paymentMethod: z.nativeEnum(PaymentMethod),
  couponCode: z.string().optional(),
  notes: z.string().optional(),
})

const UpdateOrderStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  trackingCode: z.string().optional(),
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

  app.get('/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const isAdmin = request.user!.role === 'ADMIN'
    const order = await orderService.getById(id, request.user!.userId, isAdmin)
    return reply.send({ order })
  })

  // Rotas Admin
  app.get('/admin/all', { preHandler: [authorize('ADMIN')] }, async (request, reply) => {
    const query = request.query as { page?: string; limit?: string; status?: OrderStatus }
    const page = Number(query.page) || 1
    const limit = Number(query.limit) || 20
    const result = await orderService.listAll(page, limit, query.status)
    return reply.send(result)
  })

  app.patch('/:id/status', { preHandler: [authorize('ADMIN')] }, async (request, reply) => {
    const { id } = request.params as { id: string }
    const { status, trackingCode } = UpdateOrderStatusSchema.parse(request.body)
    const order = await orderService.updateStatus(id, status, trackingCode)
    return reply.send({ order })
  })
}
