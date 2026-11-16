import { Coupon, Prisma } from '@prisma/client'
import { prisma } from '../../config/prisma.js'
import { BadRequestError, NotFoundError } from '../../utils/errors.js'
import { roundMoney } from '../../utils/money.js'

type Db = Prisma.TransactionClient | typeof prisma

/** Desconto do cupom, nunca maior que o subtotal. */
export function calculateCouponDiscount(coupon: Coupon, subtotal: number): number {
  const value = Number(coupon.discountValue)
  const discount = coupon.discountType === 'percentage' ? (subtotal * value) / 100 : value
  return roundMoney(Math.min(Math.max(discount, 0), subtotal))
}

/**
 * Busca e valida um cupom. Lança erro com a mensagem exibida ao cliente.
 * Usada no POST /coupons/validate e na criação do pedido, para que as duas regras sejam idênticas.
 */
export async function getValidCoupon(code: string, subtotal: number, db: Db = prisma): Promise<Coupon> {
  const coupon = await db.coupon.findUnique({ where: { code: code.trim().toUpperCase() } })

  if (!coupon || !coupon.isActive) {
    throw new NotFoundError('Cupom inválido ou inativo')
  }
  const now = new Date()
  if (coupon.startsAt && coupon.startsAt > now) {
    throw new BadRequestError('Este cupom ainda não está válido')
  }
  if (coupon.expiresAt && coupon.expiresAt < now) {
    throw new BadRequestError('Este cupom já expirou')
  }
  if (coupon.maxUses && coupon.currentUses >= coupon.maxUses) {
    throw new BadRequestError('Este cupom atingiu o limite de utilizações')
  }
  if (coupon.minOrderValue && subtotal < Number(coupon.minOrderValue)) {
    throw new BadRequestError(
      `Valor mínimo para este cupom é de R$ ${Number(coupon.minOrderValue).toFixed(2)}`
    )
  }
  return coupon
}

/**
 * Consome um uso do cupom de forma atômica (respeita maxUses mesmo com pedidos simultâneos).
 */
export async function consumeCoupon(tx: Prisma.TransactionClient, coupon: Coupon): Promise<void> {
  const where: Prisma.CouponWhereInput = { id: coupon.id, isActive: true }
  if (coupon.maxUses) where.currentUses = { lt: coupon.maxUses }

  const { count } = await tx.coupon.updateMany({
    where,
    data: { currentUses: { increment: 1 } },
  })
  if (count === 0) {
    throw new BadRequestError('Este cupom atingiu o limite de utilizações')
  }
}
