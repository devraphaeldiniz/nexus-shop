import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { authenticate } from '../../middlewares/auth.middleware.js'
import { NotFoundError } from '../../utils/errors.js'

const ToggleWishlistSchema = z.object({
  productId: z.string().min(1),
})

export async function wishlistRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // Listar favoritos do usuário
  app.get('/', async (request, reply) => {
    const items = await prisma.wishlistItem.findMany({
      where: { userId: request.user!.userId },
      include: {
        product: {
          include: {
            images: { take: 1, orderBy: { position: 'asc' } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({
      items: items.map((i) => ({
        id: i.id,
        productId: i.productId,
        product: {
          id: i.product.id,
          name: i.product.name,
          slug: i.product.slug,
          brand: i.product.brand,
          price: Number(i.product.price),
          image: i.product.images[0]?.url || '',
          stock: i.product.stock,
        },
      })),
    })
  })

  // Alternar favorito (Adiciona se não existir, remove se existir)
  app.post('/toggle', async (request, reply) => {
    const { productId } = ToggleWishlistSchema.parse(request.body)
    const userId = request.user!.userId

    const product = await prisma.product.findUnique({ where: { id: productId } })
    if (!product) throw new NotFoundError('Produto não encontrado')

    const existing = await prisma.wishlistItem.findUnique({
      where: {
        userId_productId: {
          userId,
          productId,
        },
      },
    })

    if (existing) {
      await prisma.wishlistItem.delete({ where: { id: existing.id } })
      return reply.send({ favorited: false, message: 'Removido dos favoritos' })
    } else {
      await prisma.wishlistItem.create({
        data: { userId, productId },
      })
      return reply.send({ favorited: true, message: 'Adicionado aos favoritos' })
    }
  })
}
