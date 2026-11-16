import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildApp } from '../../src/app.js'
import { prisma } from '../../src/config/prisma.js'
import { env } from '../../src/config/env.js'
import { DEMO_PASSWORD } from '../../src/config/demo.js'
import { upsertDemoAccounts } from '../../prisma/demo-accounts.js'
import { createProduct, createUser, hasTestDb, login, resetDb, seedStore } from '../helpers/db.js'

const DEMO_CUSTOMER = 'cliente.demo@nexusshop.com'
const DEMO_ADMIN = 'admin.demo@nexusshop.com'

describe.skipIf(!hasTestDb)('Contas de demonstração', () => {
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
    await seedStore()
    await upsertDemoAccounts(prisma)
  })

  function refreshCookie(cookie: string) {
    return cookie.split('; ').find((c) => c.startsWith('refresh_token='))!
  }

  it('a tela de login recebe as duas contas com a senha pública', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/v1/auth/demo-accounts' })
    expect(res.statusCode).toBe(200)
    const accounts = res.json().accounts
    expect(accounts.map((a: { email: string }) => a.email).sort()).toEqual([DEMO_ADMIN, DEMO_CUSTOMER])
    expect(accounts.every((a: { password: string }) => a.password === DEMO_PASSWORD)).toBe(true)
  })

  it('com DEMO_ACCOUNTS desligado, as contas somem e não conseguem entrar', async () => {
    const original = env.DEMO_ACCOUNTS
    env.DEMO_ACCOUNTS = false
    try {
      const list = await app.inject({ method: 'GET', url: '/api/v1/auth/demo-accounts' })
      expect(list.json().accounts).toEqual([])
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/auth/login',
        payload: { email: DEMO_ADMIN, password: DEMO_PASSWORD },
      })
      expect(res.statusCode).toBe(401)
    } finally {
      env.DEMO_ACCOUNTS = original
    }
  })

  describe('admin de demonstração', () => {
    it('vê o painel, mas não altera produto, pedido, cupom nem configurações', async () => {
      const product = await createProduct({ price: 1000, stock: 5 })
      const cookie = await login(app, DEMO_ADMIN, DEMO_PASSWORD)

      const me = await app.inject({ method: 'GET', url: '/api/v1/auth/me', headers: { cookie } })
      expect(me.json().user.isDemo).toBe(true)

      for (const url of ['/api/v1/admin/metrics', '/api/v1/admin/products', '/api/v1/admin/users', '/api/v1/settings', '/api/v1/orders/admin/all']) {
        const res = await app.inject({ method: 'GET', url, headers: { cookie } })
        expect(res.statusCode, url).toBe(200)
      }

      const attempts = [
        { method: 'PATCH' as const, url: `/api/v1/products/${product.id}`, payload: { isActive: false } },
        { method: 'DELETE' as const, url: `/api/v1/products/${product.id}` },
        { method: 'PUT' as const, url: '/api/v1/settings', payload: { storeName: 'Invadida' } },
        { method: 'POST' as const, url: '/api/v1/coupons', payload: { code: 'HACK', discountType: 'PERCENTAGE', discountValue: 90 } },
        { method: 'PATCH' as const, url: '/api/v1/orders/qualquer/status', payload: { status: 'CANCELLED' } },
      ]
      for (const attempt of attempts) {
        const res = await app.inject({ ...attempt, headers: { cookie } })
        expect(res.statusCode, `${attempt.method} ${attempt.url}`).toBe(403)
        expect(res.json().message).toMatch(/somente leitura/)
      }

      const stillActive = await prisma.product.findUnique({ where: { id: product.id } })
      expect(stillActive?.isActive).toBe(true)
    })

    it('não vê e-mail, telefone nem endereço de clientes reais', async () => {
      const real = await createUser('maria.souza@gmail.com')
      await prisma.user.update({ where: { id: real.id }, data: { name: 'Maria Souza', phone: '(31) 99999-0000' } })

      const demoCookie = await login(app, DEMO_ADMIN, DEMO_PASSWORD)
      const demoView = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: { cookie: demoCookie } })
      const masked = demoView.json().users.find((u: { name: string }) => u.name.startsWith('Maria'))
      expect(masked.email).not.toContain('maria.souza')
      expect(masked.name).toBe('Maria S.')
      expect(demoView.body).not.toContain('maria.souza@gmail.com')

      // O admin de verdade continua vendo tudo
      await createUser('dono@teste.com', 'ADMIN')
      const adminCookie = await login(app, 'dono@teste.com')
      const realView = await app.inject({ method: 'GET', url: '/api/v1/admin/users', headers: { cookie: adminCookie } })
      expect(realView.body).toContain('maria.souza@gmail.com')
    })
  })

  describe('cliente de demonstração', () => {
    it('não troca nome nem senha, mas usa o carrinho normalmente', async () => {
      const cookie = await login(app, DEMO_CUSTOMER, DEMO_PASSWORD)

      const profile = await app.inject({
        method: 'PATCH',
        url: '/api/v1/account/profile',
        headers: { cookie },
        payload: { name: 'Outro Nome' },
      })
      expect(profile.statusCode).toBe(403)

      const password = await app.inject({
        method: 'POST',
        url: '/api/v1/account/password',
        headers: { cookie },
        payload: { currentPassword: DEMO_PASSWORD, newPassword: 'NovaSenha123' },
      })
      expect(password.statusCode).toBe(403)

      // A senha pública continua valendo
      await expect(login(app, DEMO_CUSTOMER, DEMO_PASSWORD)).resolves.toContain('access_token=')

      const product = await createProduct({ price: 500, stock: 3 })
      const cart = await app.inject({
        method: 'POST',
        url: '/api/v1/cart/items',
        headers: { cookie },
        payload: { productId: product.id, quantity: 1 },
      })
      expect(cart.statusCode).toBeLessThan(300)
    })

    it('já vem com endereço para o checkout', async () => {
      const cookie = await login(app, DEMO_CUSTOMER, DEMO_PASSWORD)
      const res = await app.inject({ method: 'GET', url: '/api/v1/account/addresses', headers: { cookie } })
      expect(res.statusCode).toBe(200)
      expect(JSON.stringify(res.json())).toContain('Rua da Demonstração')
    })
  })

  describe('várias sessões ao mesmo tempo', () => {
    it('dois visitantes na mesma conta demo não derrubam um ao outro', async () => {
      const visitorA = await login(app, DEMO_CUSTOMER, DEMO_PASSWORD)
      const visitorB = await login(app, DEMO_CUSTOMER, DEMO_PASSWORD)

      const refreshA = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: refreshCookie(visitorA) } })
      expect(refreshA.statusCode).toBe(200)
      const refreshB = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: refreshCookie(visitorB) } })
      expect(refreshB.statusCode).toBe(200)

      // A sai; B continua conseguindo renovar
      const newA = refreshA.cookies.find((c) => c.name === 'refresh_token')!.value
      await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie: `refresh_token=${newA}` } })
      const newB = refreshB.cookies.find((c) => c.name === 'refresh_token')!.value
      const again = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: `refresh_token=${newB}` } })
      expect(again.statusCode).toBe(200)

      // Reuso de token na conta demo recusa só aquele token, sem derrubar os outros visitantes
      const reused = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: refreshCookie(visitorB) } })
      expect(reused.statusCode).toBe(401)
      const latestB = again.cookies.find((c) => c.name === 'refresh_token')!.value
      const stillWorks = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: `refresh_token=${latestB}` } })
      expect(stillWorks.statusCode).toBe(200)
    })

    it('em conta normal, reusar um refresh token derruba todas as sessões', async () => {
      await createUser('normal@teste.com')
      const phone = await login(app, 'normal@teste.com')
      const laptop = await login(app, 'normal@teste.com')

      const rotated = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: refreshCookie(phone) } })
      expect(rotated.statusCode).toBe(200)

      // Token antigo do celular reaparece (roubo): tudo cai, inclusive o notebook
      const stolen = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: refreshCookie(phone) } })
      expect(stolen.statusCode).toBe(401)
      const laptopRefresh = await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: refreshCookie(laptop) } })
      expect(laptopRefresh.statusCode).toBe(401)
    })
  })
})
