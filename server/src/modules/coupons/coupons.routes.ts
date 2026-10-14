import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'
import { BadRequestError, NotFoundError } from '../../utils/errors.js'

const ValidateCouponSchema = z.object({
  code: z.string().min(1),
  orderAmount: z.number().positive(),
})

const CreateCouponSchema = z.object({
  code: z.string().min(3),
  description: z.string().optional(),
  discountType: z.enum(['percentage', 'fixed']),
  discountValue: z.number().positive(),
  minOrderValue: z.number().positive().optional(),
  maxUses: z.number().int().positive().optional(),
  expiresAt: z.string().datetime().optional(),
})

export async function couponRoutes(app: FastifyInstance) {
  // Validar cupom no checkout
  app.post('/validate', { preHandler: [authenticate] }, async (request, reply) => {
    const { code, orderAmount } = ValidateCouponSchema.parse(request.body)

    const coupon = await prisma.coupon.findUnique({
      where: { code: code.toUpperCase() },
    })

    if (!coupon || !coupon.isActive) {
      throw new NotFoundError('Cupom inválido ou inativo')
    }

    if (coupon.expiresAt && coupon.expiresAt < new Date()) {
      throw new BadRequestError('Este cupom já expirou')
    }

    if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
      throw new BadRequestError('Este cupom atingiu o limite de utilizações')
    }

    if (coupon.minOrderValue && orderAmount < Number(coupon.minOrderValue)) {
      throw new BadRequestError(
        `Valor mínimo para este cupom é de R$ ${Number(coupon.minOrderValue).toFixed(2)}`
      )
    }

    let discount = 0
    if (coupon.discountType === 'percentage') {
      discount = (orderAmount * Number(coupon.discountValue)) / 100
    } else {
      discount = Number(coupon.discountValue)
    }

    return reply.send({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        discountAmount: discount,
      },
    })
  })

  // Listar cupons (Admin)
  app.get('/', { preHandler: [authenticate, authorize('ADMIN')] }, async (_request, reply) => {
    const coupons = await prisma.coupon.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return reply.send({ coupons })
  })

  // Criar cupom (Admin)
  app.post('/', { preHandler: [authenticate, authorize('ADMIN')] }, async (request, reply) => {
    const data = CreateCouponSchema.parse(request.body)
    const coupon = await prisma.coupon.create({
      data: {
        code: data.code.toUpperCase(),
        description: data.description,
        discountType: data.discountType,
        discountValue: data.discountValue,
        minOrderValue: data.minOrderValue,
        maxUses: data.maxUses,
        expiresAt: data.expiresAt ? new Date(data.expiresAt) : undefined,
      },
    })
    return reply.status(201).send({ coupon })
  })
}
