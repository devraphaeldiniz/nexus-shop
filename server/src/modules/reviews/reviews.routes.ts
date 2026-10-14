import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { authenticate } from '../../middlewares/auth.middleware.js'
import { BadRequestError, NotFoundError } from '../../utils/errors.js'
import sanitizeHtml from 'sanitize-html'

const CreateReviewSchema = z.object({
  productId: z.string().min(1),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(100).optional(),
  comment: z.string().max(1000).optional(),
})

export async function reviewRoutes(app: FastifyInstance) {
  // Listar avaliações de um produto
  app.get('/product/:productId', async (request, reply) => {
    const { productId } = request.params as { productId: string }

    const reviews = await prisma.review.findMany({
      where: { productId },
      include: {
        user: { select: { name: true, avatar: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    return reply.send({ reviews })
  })

  // Criar avaliação
  app.post('/', { preHandler: [authenticate] }, async (request, reply) => {
    const data = CreateReviewSchema.parse(request.body)
    const userId = request.user!.userId

    const product = await prisma.product.findUnique({
      where: { id: data.productId },
    })
    if (!product) throw new NotFoundError('Produto não encontrado')

    // Checar se usuário já avaliou
    const existing = await prisma.review.findUnique({
      where: {
        userId_productId: {
          userId,
          productId: data.productId,
        },
      },
    })
    if (existing) {
      throw new BadRequestError('Você já avaliou este smartphone')
    }

    // Verificar se é compra verificada
    const hasBought = await prisma.orderItem.findFirst({
      where: {
        productId: data.productId,
        order: {
          userId,
          status: 'DELIVERED',
        },
      },
    })

    // Sanitizar comentário contra XSS
    const cleanComment = data.comment ? sanitizeHtml(data.comment) : undefined
    const cleanTitle = data.title ? sanitizeHtml(data.title) : undefined

    const review = await prisma.review.create({
      data: {
        userId,
        productId: data.productId,
        rating: data.rating,
        title: cleanTitle,
        comment: cleanComment,
        isVerified: !!hasBought,
      },
    })

    // Recalcular média de avaliações do produto
    const stats = await prisma.review.aggregate({
      where: { productId: data.productId },
      _avg: { rating: true },
      _count: { rating: true },
    })

    await prisma.product.update({
      where: { id: data.productId },
      data: {
        avgRating: Number(stats._avg.rating?.toFixed(1) || 0),
        totalReviews: stats._count.rating,
      },
    })

    return reply.status(201).send({ review })
  })
}
