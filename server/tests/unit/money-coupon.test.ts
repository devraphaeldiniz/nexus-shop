import { describe, it, expect } from 'vitest'
import { Prisma, type Coupon } from '@prisma/client'
import { roundMoney, sameAmount } from '../../src/utils/money.js'
import { calculateCouponDiscount } from '../../src/modules/coupons/coupons.service.js'

function coupon(discountType: 'percentage' | 'fixed', value: number): Coupon {
  return {
    id: 'c1',
    code: 'TESTE',
    description: null,
    discountType,
    discountValue: new Prisma.Decimal(value),
    minOrderValue: null,
    maxUses: null,
    currentUses: 0,
    isActive: true,
    startsAt: new Date(),
    expiresAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}

describe('money', () => {
  it('arredonda para centavos', () => {
    expect(roundMoney(0.1 + 0.2)).toBe(0.3)
    expect(roundMoney(10.005)).toBe(10.01)
  })

  it('compara valores com tolerância de 1 centavo', () => {
    expect(sameAmount(100, 100.004)).toBe(true)
    expect(sameAmount(100, 100.02)).toBe(false)
  })
})

describe('calculateCouponDiscount', () => {
  it('aplica porcentagem sobre o subtotal', () => {
    expect(calculateCouponDiscount(coupon('percentage', 10), 2999.9)).toBe(299.99)
  })

  it('aplica valor fixo', () => {
    expect(calculateCouponDiscount(coupon('fixed', 150), 1000)).toBe(150)
  })

  it('nunca desconta mais que o subtotal', () => {
    expect(calculateCouponDiscount(coupon('fixed', 500), 200)).toBe(200)
    expect(calculateCouponDiscount(coupon('percentage', 150), 200)).toBe(200)
  })
})
