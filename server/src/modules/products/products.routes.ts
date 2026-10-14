import { FastifyInstance } from 'fastify'
import { ProductService } from './products.service.js'
import {
  ProductQuerySchema,
  CreateProductSchema,
  UpdateProductSchema,
} from './products.schemas.js'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'

export async function productRoutes(app: FastifyInstance) {
  const productService = new ProductService()

  app.get('/', async (request, reply) => {
    const query = ProductQuerySchema.parse(request.query)
    const result = await productService.list(query)
    return reply.send(result)
  })

  app.get('/brands', async (_request, reply) => {
    const brands = await productService.getBrands()
    return reply.send({ brands })
  })

  app.get('/:slug', async (request, reply) => {
    const { slug } = request.params as { slug: string }
    const product = await productService.getBySlug(slug)
    return reply.send({ product })
  })

  // Rotas restritas para Administradores
  app.post(
    '/',
    { preHandler: [authenticate, authorize('ADMIN')] },
    async (request, reply) => {
      const data = CreateProductSchema.parse(request.body)
      const product = await productService.create(data)
      return reply.status(201).send({ product })
    }
  )

  app.patch(
    '/:id',
    { preHandler: [authenticate, authorize('ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const data = UpdateProductSchema.parse(request.body)
      const product = await productService.update(id, data)
      return reply.send({ product })
    }
  )

  app.delete(
    '/:id',
    { preHandler: [authenticate, authorize('ADMIN')] },
    async (request, reply) => {
      const { id } = request.params as { id: string }
      const result = await productService.delete(id)
      return reply.send(result)
    }
  )
}
