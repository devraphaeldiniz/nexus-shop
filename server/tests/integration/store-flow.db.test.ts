import { describe, it, expect, beforeAll, afterAll, beforeEach, vi } from 'vitest'
import { FastifyInstance } from 'fastify'

// Mercado Pago falso: o teste controla o que "a API do MP" responde
const mp = vi.hoisted(() => ({
  get: vi.fn(),
  create: vi.fn(),
}))
vi.mock('mercadopago', () => ({
  MercadoPagoConfig: class {},
  Preference: class {},
  Payment: class {
    get = mp.get
    create = mp.create
  },
}))

import { buildApp } from '../../src/app.js'
import { prisma } from '../../src/config/prisma.js'
import { PaymentService } from '../../src/modules/payments/payments.service.js'
import {
  ADDRESS,
  createProduct,
  createUser,
  hasTestDb,
  login,
  resetDb,
  seedStore,
  signMercadoPago,
} from '../helpers/db.js'

describe.skipIf(!hasTestDb)('Fluxo da loja com banco real', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
    await prisma.$disconnect()
  })

  beforeEach(async () => {
    await resetDb()
    mp.get.mockReset()
    mp.create.mockReset()
  })

  async function placeOrder(cookie: string, body: Record<string, unknown>) {
    return app.inject({
      method: 'POST',
      url: '/api/v1/orders',
      headers: { cookie },
      payload: {
        shippingOptionId: 'standard',
        address: ADDRESS,
        paymentGateway: 'MERCADOPAGO',
        paymentMethod: 'PIX',
        ...body,
      },
    })
  }

  async function mpWebhook(paymentId: string) {
    return app.inject({
      method: 'POST',
      url: `/api/v1/payments/mercadopago/webhook?data.id=${paymentId}&type=payment`,
      headers: { 'content-type': 'application/json', ...signMercadoPago(paymentId) },
      payload: JSON.stringify({ type: 'payment', action: 'payment.updated', data: { id: paymentId } }),
    })
  }

  describe('autenticação', () => {
    it('login grava cookies httpOnly, /me funciona e o refresh rotaciona o token', async () => {
      await seedStore()
      await createUser('cliente@teste.com')

      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: 'cliente@teste.com', password: 'SenhaForte123' },
      })
      expect(res.statusCode).toBe(200)
      expect(res.json()).not.toHaveProperty('accessToken')
      const access = res.cookies.find((c) => c.name === 'access_token')!
      const refresh = res.cookies.find((c) => c.name === 'refresh_token')!
      expect(access.httpOnly).toBe(true)
      expect(refresh.path).toBe('/api/v1/auth')

      const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie: `access_token=${access.value}` } })
      expect(me.statusCode).toBe(200)

      const refreshed = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: { cookie: `refresh_token=${refresh.value}` },
      })
      expect(refreshed.statusCode).toBe(200)
      const newRefresh = refreshed.cookies.find((c) => c.name === 'refresh_token')!.value
      expect(newRefresh).not.toBe(refresh.value)

      // Reuso do refresh antigo é recusado e derruba a sessão
      const reused = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/refresh',
        headers: { cookie: `refresh_token=${refresh.value}` },
      })
      expect(reused.statusCode).toBe(401)
    })

    it('setup cria o primeiro admin uma única vez', async () => {
      const payload = { name: 'Dona da Loja', email: 'dona@teste.com', password: 'SenhaForte123' }
      const first = await app.inject({ method: 'POST', url: '/api/v1/auth/setup', payload })
      expect(first.statusCode).toBe(201)
      expect(first.json().user.role).toBe('ADMIN')

      const second = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/setup',
        payload: { ...payload, email: 'outra@teste.com' },
      })
      expect(second.statusCode).toBe(403)
    })
  })

  describe('pedido', () => {
    it('usa o preço do banco, aplica frete e baixa o estoque', async () => {
      await seedStore()
      await createUser('cliente@teste.com')
      const product = await createProduct({ price: 1000, stock: 5 })
      const cookie = await login(app, 'cliente@teste.com')

      const res = await placeOrder(cookie, {
        items: [{ productId: product.id, quantity: 2, price: 1 }],
      })
      expect(res.statusCode).toBe(201)
      const { order } = res.json()
      expect(Number(order.subtotal)).toBe(2000)
      expect(Number(order.shippingCost)).toBe(19.9)
      expect(Number(order.total)).toBe(2019.9)
      expect(order.shippingMethod).toBe('standard')

      const after = await prisma.product.findUniqueOrThrow({ where: { id: product.id } })
      expect(after.stock).toBe(3)
      expect(after.totalSold).toBe(2)
    })

    it('frete grátis quando o subtotal atinge o limite da loja', async () => {
      await seedStore()
      await createUser('cliente@teste.com')
      const product = await createProduct({ price: 3500, stock: 1 })
      const cookie = await login(app, 'cliente@teste.com')

      const res = await placeOrder(cookie, { items: [{ productId: product.id, quantity: 1 }], shippingOptionId: 'express' })
      expect(res.statusCode).toBe(201)
      expect(Number(res.json().order.shippingCost)).toBe(0)
    })

    it('recusa estoque insuficiente sem criar pedido', async () => {
      await seedStore()
      await createUser('cliente@teste.com')
      const product = await createProduct({ price: 1000, stock: 1 })
      const cookie = await login(app, 'cliente@teste.com')

      const res = await placeOrder(cookie, { items: [{ productId: product.id, quantity: 2 }] })
      expect(res.statusCode).toBe(400)
      expect(await prisma.order.count()).toBe(0)
      expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(1)
    })

    it('pedidos simultâneos não vendem mais que o estoque', async () => {
      await seedStore()
      await createUser('a@teste.com')
      await createUser('b@teste.com')
      const product = await createProduct({ price: 1000, stock: 1 })
      const [cookieA, cookieB] = [await login(app, 'a@teste.com'), await login(app, 'b@teste.com')]

      const results = await Promise.all([
        placeOrder(cookieA, { items: [{ productId: product.id, quantity: 1 }] }),
        placeOrder(cookieB, { items: [{ productId: product.id, quantity: 1 }] }),
      ])
      expect(results.map((r) => r.statusCode).sort()).toEqual([201, 400])
      expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(0)
    })

    it('cupom com limite de 1 uso não é usado duas vezes ao mesmo tempo', async () => {
      await seedStore()
      await createUser('a@teste.com')
      await createUser('b@teste.com')
      const product = await createProduct({ price: 1000, stock: 10 })
      await prisma.coupon.create({
        data: { code: 'UNICO', discountType: 'percentage', discountValue: 10, maxUses: 1 },
      })
      const [cookieA, cookieB] = [await login(app, 'a@teste.com'), await login(app, 'b@teste.com')]

      const results = await Promise.all([
        placeOrder(cookieA, { items: [{ productId: product.id, quantity: 1 }], couponCode: 'unico' }),
        placeOrder(cookieB, { items: [{ productId: product.id, quantity: 1 }], couponCode: 'unico' }),
      ])
      expect(results.map((r) => r.statusCode).sort()).toEqual([201, 400])
      const ok = results.find((r) => r.statusCode === 201)!.json().order
      expect(Number(ok.discount)).toBe(100)
      expect((await prisma.coupon.findUniqueOrThrow({ where: { code: 'UNICO' } })).currentUses).toBe(1)
    })

    it('recusa gateway desativado no painel', async () => {
      await seedStore({ stripeEnabled: false })
      await createUser('cliente@teste.com')
      const product = await createProduct({ price: 1000, stock: 1 })
      const cookie = await login(app, 'cliente@teste.com')

      const res = await placeOrder(cookie, {
        items: [{ productId: product.id, quantity: 1 }],
        paymentGateway: 'STRIPE',
        paymentMethod: 'CREDIT_CARD',
      })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('pagamento Mercado Pago', () => {
    async function pendingOrder() {
      await seedStore()
      await createUser('cliente@teste.com')
      const product = await createProduct({ price: 1000, stock: 3 })
      await prisma.coupon.create({ data: { code: 'DEZ', discountType: 'fixed', discountValue: 10 } })
      const cookie = await login(app, 'cliente@teste.com')
      const res = await placeOrder(cookie, { items: [{ productId: product.id, quantity: 1 }], couponCode: 'DEZ' })
      const order = res.json().order
      await prisma.order.update({ where: { id: order.id }, data: { externalReference: 'mp-123' } })
      return { order, product }
    }

    it('webhook aprovado confirma o pedido uma única vez', async () => {
      const { order } = await pendingOrder()
      mp.get.mockResolvedValue({ id: 'mp-123', status: 'approved', external_reference: order.id, transaction_amount: Number(order.total) })

      expect((await mpWebhook('mp-123')).statusCode).toBe(200)
      expect((await mpWebhook('mp-123')).statusCode).toBe(200)

      const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
      expect(saved.paymentStatus).toBe('PAID')
      expect(saved.status).toBe('CONFIRMED')
      expect(await prisma.paymentTransaction.count({ where: { orderId: order.id } })).toBe(1)
    })

    it('valor divergente não libera o pedido', async () => {
      const { order } = await pendingOrder()
      mp.get.mockResolvedValue({ id: 'mp-123', status: 'approved', external_reference: order.id, transaction_amount: 1 })

      await mpWebhook('mp-123')
      const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id }, include: { transactions: true } })
      expect(saved.paymentStatus).toBe('PENDING')
      expect(saved.transactions[0].status).toBe('FAILED')
    })

    it('PIX cancelado cancela o pedido e devolve estoque e cupom', async () => {
      const { order, product } = await pendingOrder()
      mp.get.mockResolvedValue({ id: 'mp-123', status: 'cancelled', external_reference: order.id, transaction_amount: Number(order.total) })

      await mpWebhook('mp-123')
      const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
      expect(saved.status).toBe('CANCELLED')
      expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(3)
      expect((await prisma.coupon.findUniqueOrThrow({ where: { code: 'DEZ' } })).currentUses).toBe(0)
    })

    it('pagamento que chega depois do cancelamento reserva o estoque de novo', async () => {
      const { order, product } = await pendingOrder()
      mp.get.mockResolvedValueOnce({ id: 'mp-123', status: 'cancelled', external_reference: order.id, transaction_amount: Number(order.total) })
      await mpWebhook('mp-123')

      mp.get.mockResolvedValueOnce({ id: 'mp-123', status: 'approved', external_reference: order.id, transaction_amount: Number(order.total) })
      await mpWebhook('mp-123')

      const saved = await prisma.order.findUniqueOrThrow({ where: { id: order.id } })
      expect(saved.paymentStatus).toBe('PAID')
      expect(saved.status).toBe('CONFIRMED')
      expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(2)
    })
  })

  describe('varredura de pedidos vencidos', () => {
    it('confirma o PIX aprovado que perdeu o webhook e cancela o vencido', async () => {
      await seedStore()
      await createUser('a@teste.com')
      await createUser('b@teste.com')
      const product = await createProduct({ price: 1000, stock: 5 })

      const paid = (await placeOrder(await login(app, 'a@teste.com'), { items: [{ productId: product.id, quantity: 1 }] })).json().order
      const expired = (await placeOrder(await login(app, 'b@teste.com'), { items: [{ productId: product.id, quantity: 2 }] })).json().order
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000)
      await prisma.order.update({ where: { id: paid.id }, data: { createdAt: oneHourAgo, externalReference: 'mp-pago' } })
      await prisma.order.update({ where: { id: expired.id }, data: { createdAt: oneHourAgo, externalReference: 'mp-vencido' } })

      mp.get.mockImplementation(async ({ id }: { id: string }) => {
        if (id === 'mp-pago') {
          return { id, status: 'approved', external_reference: paid.id, transaction_amount: Number(paid.total) }
        }
        throw new Error('API do Mercado Pago fora do ar')
      })

      const result = await new PaymentService().reconcileStaleOrders()
      expect(result).toEqual({ confirmed: 1, cancelled: 1 })

      expect((await prisma.order.findUniqueOrThrow({ where: { id: paid.id } })).paymentStatus).toBe('PAID')
      expect((await prisma.order.findUniqueOrThrow({ where: { id: expired.id } })).status).toBe('CANCELLED')
      // 5 - 1 (pago) - 2 (vencido) + 2 (devolvido) = 4
      expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(4)
    })
  })

  describe('admin', () => {
    it('não marca como enviado um pedido sem pagamento e cancelar devolve o estoque', async () => {
      await seedStore()
      await createUser('cliente@teste.com')
      await createUser('admin@teste.com', 'ADMIN')
      const product = await createProduct({ price: 500, stock: 2 })
      const order = (await placeOrder(await login(app, 'cliente@teste.com'), { items: [{ productId: product.id, quantity: 2 }] })).json().order
      const adminCookie = await login(app, 'admin@teste.com')

      const shipped = await app.inject({
        method: 'PATCH',
        url: `/api/v1/orders/${order.id}/status`,
        headers: { cookie: adminCookie },
        payload: { status: 'SHIPPED', trackingCode: 'BR123' },
      })
      expect(shipped.statusCode).toBe(400)

      const cancelled = await app.inject({
        method: 'PATCH',
        url: `/api/v1/orders/${order.id}/status`,
        headers: { cookie: adminCookie },
        payload: { status: 'CANCELLED' },
      })
      expect(cancelled.statusCode).toBe(200)
      expect((await prisma.product.findUniqueOrThrow({ where: { id: product.id } })).stock).toBe(2)
    })

    it('chaves de pagamento ficam criptografadas e voltam mascaradas', async () => {
      await seedStore()
      await createUser('admin@teste.com', 'ADMIN')
      const cookie = await login(app, 'admin@teste.com')

      const put = await app.inject({
        method: 'PUT',
        url: '/api/v1/settings',
        headers: { cookie },
        payload: { storeName: 'Loja', stripeEnabled: true, stripeSecretKey: 'sk_test_abcdef123456' },
      })
      expect(put.statusCode).toBe(200)
      expect(put.json().settings.stripeSecretKey).toBe('••••3456')

      const raw = await prisma.storeSettings.findUniqueOrThrow({ where: { id: 'default' } })
      expect(raw.stripeSecretKey).toMatch(/^enc:v1:/)

      // Reenviar a máscara mantém a chave salva
      await app.inject({
        method: 'PUT',
        url: '/api/v1/settings',
        headers: { cookie },
        payload: { storeName: 'Loja', stripeEnabled: true, stripeSecretKey: '••••3456' },
      })
      const again = await prisma.storeSettings.findUniqueOrThrow({ where: { id: 'default' } })
      expect(again.stripeSecretKey).toBe(raw.stripeSecretKey)
    })
  })
})
