import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { CartService } from './cart.service.js'
import { authenticate } from '../../middlewares/auth.middleware.js'

const AddCartItemSchema = z.object({
  productId: z.string().min(1),
  quantity: z.number().int().positive().default(1),
  color: z.string().optional(),
  storage: z.string().optional(),
})

const UpdateCartItemSchema = z.object({
  quantity: z.number().int().min(0),
})

export async function cartRoutes(app: FastifyInstance) {
  const cartService = new CartService()

  app.addHook('preHandler', authenticate)

  app.get('/', async (request, reply) => {
    const result = await cartService.getCart(request.user!.userId)
    return reply.send(result)
  })

  app.post('/items', async (request, reply) => {
    const { productId, quantity, color, storage } = AddCartItemSchema.parse(request.body)
    const result = await cartService.addItem(
      request.user!.userId,
      productId,
      quantity,
      color,
      storage
    )
    return reply.send(result)
  })

  app.patch('/items/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const { quantity } = UpdateCartItemSchema.parse(request.body)
    const result = await cartService.updateQuantity(request.user!.userId, id, quantity)
    return reply.send(result)
  })

  app.delete('/items/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const result = await cartService.removeItem(request.user!.userId, id)
    return reply.send(result)
  })

  app.delete('/', async (request, reply) => {
    const result = await cartService.clearCart(request.user!.userId)
    return reply.send(result)
  })
}
