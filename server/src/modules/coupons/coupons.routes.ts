import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { prisma } from '../../config/prisma.js'
import { authenticate, authorize } from '../../middlewares/auth.middleware.js'
import { calculateCouponDiscount, getValidCoupon } from './coupons.service.js'

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
  // Validar cupom no checkout (mesma regra usada na criação do pedido)
  app.post('/validate', { preHandler: [authenticate] }, async (request, reply) => {
    const { code, orderAmount } = ValidateCouponSchema.parse(request.body)
    const coupon = await getValidCoupon(code, orderAmount)

    return reply.send({
      valid: true,
      coupon: {
        id: coupon.id,
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        discountAmount: calculateCouponDiscount(coupon, orderAmount),
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
