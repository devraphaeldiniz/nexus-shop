import crypto from 'crypto'
import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach, vi } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildApp } from '../../src/app.js'
import { prisma } from '../../src/config/prisma.js'
import { redis } from '../../src/config/redis.js'
import { createProduct, createUser, hasTestDb, login, resetDb, seedStore, ADDRESS, PASSWORD } from '../helpers/db.js'

const SPECS = {
  screenSize: '6.1"',
  resolution: '2400 x 1080',
  processor: 'Chip Teste',
  ram: 8,
  storage: 256,
  battery: 4000,
  mainCamera: '50 MP',
  frontCamera: '12 MP',
  os: 'Android',
  colors: ['Preto'],
}

describe.skipIf(!hasTestDb)('Catálogo, conta e serviços da loja', () => {
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
    // O banco é limpo entre testes, mas o cache não: começa sem a lista de marcas guardada
    await redis.del('products:brands')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  async function adminCookie() {
    await createUser('dono@teste.com', 'ADMIN')
    return login(app, 'dono@teste.com')
  }

  async function customerCookie(email = 'cliente@teste.com') {
    const user = await createUser(email)
    return { user, cookie: await login(app, email) }
  }

  async function makeProduct(data: { name: string; brand: string; price: number; ram?: number; storage?: number; featured?: boolean; sold?: number }) {
    const product = await createProduct({ price: data.price, stock: 10, name: data.name })
    return prisma.product.update({
      where: { id: product.id },
      data: {
        brand: data.brand,
        isFeatured: data.featured ?? false,
        totalSold: data.sold ?? 0,
        specifications: { ...SPECS, ram: data.ram ?? 8, storage: data.storage ?? 256 },
      },
    })
  }

  describe('vitrine', () => {
    it('filtra por marca, preço, RAM, armazenamento, destaque e busca', async () => {
      await makeProduct({ name: 'Galaxy Barato', brand: 'Samsung', price: 1000, ram: 4, storage: 128 })
      await makeProduct({ name: 'Galaxy Caro', brand: 'Samsung', price: 5000, ram: 12, storage: 512, featured: true })
      await makeProduct({ name: 'iPhone Médio', brand: 'Apple', price: 3000, ram: 8, storage: 256 })

      const get = async (query: string) =>
        (await app.inject({ method: 'GET', url: `/api/v1/products?${query}` })).json().products.map((p: { name: string }) => p.name)

      expect(await get('brand=samsung')).toHaveLength(2)
      expect(await get('brand=Apple,Samsung')).toHaveLength(3)
      expect(await get('minPrice=2000&maxPrice=4000')).toEqual(['iPhone Médio'])
      expect(await get('ram=12')).toEqual(['Galaxy Caro'])
      expect(await get('storage=128')).toEqual(['Galaxy Barato'])
      expect(await get('featured=true')).toEqual(['Galaxy Caro'])
      expect((await get('featured=false')).sort()).toEqual(['Galaxy Barato', 'iPhone Médio'])
      expect(await get('search=iphone')).toEqual(['iPhone Médio'])
    })

    it('ordena e pagina', async () => {
      await makeProduct({ name: 'Preço Médio', brand: 'A', price: 3000, sold: 5 })
      await makeProduct({ name: 'Preço Baixo', brand: 'B', price: 1000, sold: 50 })
      await makeProduct({ name: 'Preço Alto', brand: 'C', price: 9000, sold: 1 })

      const names = async (query: string) =>
        (await app.inject({ method: 'GET', url: `/api/v1/products?${query}` })).json().products.map((p: { name: string }) => p.name)

      expect(await names('sort=price_asc')).toEqual(['Preço Baixo', 'Preço Médio', 'Preço Alto'])
      expect(await names('sort=price_desc')).toEqual(['Preço Alto', 'Preço Médio', 'Preço Baixo'])
      expect((await names('sort=popular'))[0]).toBe('Preço Baixo')
      expect(await names('sort=rating')).toHaveLength(3)
      expect(await names('sort=newest')).toHaveLength(3)

      const page2 = await app.inject({ method: 'GET', url: '/api/v1/products?limit=2&page=2' })
      expect(page2.json().products).toHaveLength(1)
      expect(page2.json().pagination).toMatchObject({ page: 2, total: 3, totalPages: 2 })
    })

    it('marcas ativas, sem duplicar e em ordem', async () => {
      await makeProduct({ name: 'Um', brand: 'Xiaomi', price: 1000 })
      await makeProduct({ name: 'Dois', brand: 'Apple', price: 1000 })
      await makeProduct({ name: 'Três', brand: 'Apple', price: 1000 })
      const res = await app.inject({ method: 'GET', url: '/api/v1/products/brands' })
      expect(res.json().brands).toEqual(['Apple', 'Xiaomi'])
    })

    it('detalhe do produto e 404 para inexistente ou pausado', async () => {
      const product = await makeProduct({ name: 'Detalhe', brand: 'Teste', price: 1500 })
      const ok = await app.inject({ method: 'GET', url: `/api/v1/products/${product.slug}` })
      expect(ok.statusCode).toBe(200)
      expect(ok.json().product.name).toBe('Detalhe')

      expect((await app.inject({ method: 'GET', url: '/api/v1/products/nao-existe' })).statusCode).toBe(404)

      await prisma.product.update({ where: { id: product.id }, data: { isActive: false } })
      await redis.del(`product:${product.slug}`)
      expect((await app.inject({ method: 'GET', url: `/api/v1/products/${product.slug}` })).statusCode).toBe(404)
    })
  })

  describe('produtos no painel', () => {
    const body = {
      name: 'Nexus One',
      description: 'Smartphone de teste do painel com descrição longa.',
      price: 2500,
      brand: 'Nexus',
      model: 'One',
      sku: 'NEXUS-ONE-1',
      stock: 7,
      specifications: SPECS,
      images: ['https://example.com/a.jpg', 'https://example.com/b.jpg'],
    }

    it('cria, edita, troca fotos e desativa', async () => {
      const cookie = await adminCookie()

      const created = await app.inject({ method: 'POST', url: '/api/v1/products', headers: { cookie }, payload: body })
      expect(created.statusCode).toBe(201)
      const product = created.json().product
      expect(product.slug).toBe('nexus-nexus-one')
      expect(product.images).toHaveLength(2)

      const edited = await app.inject({
        method: 'PATCH',
        url: `/api/v1/products/${product.id}`,
        headers: { cookie },
        payload: { name: 'Nexus Two', price: 2700, images: ['https://example.com/c.jpg'] },
      })
      expect(edited.statusCode).toBe(200)
      expect(edited.json().product).toMatchObject({ slug: 'nexus-nexus-two', price: '2700' })
      expect(edited.json().product.images).toHaveLength(1)

      const removed = await app.inject({ method: 'DELETE', url: `/api/v1/products/${product.id}`, headers: { cookie } })
      expect(removed.statusCode).toBe(200)
      const list = await app.inject({ method: 'GET', url: '/api/v1/products' })
      expect(list.json().products).toHaveLength(0)

      // Continua no painel, pausado
      const panel = await app.inject({ method: 'GET', url: '/api/v1/admin/products?search=Nexus', headers: { cookie } })
      expect(panel.json().products[0].isActive).toBe(false)
    })

    it('recusa SKU ou nome repetido e produto inexistente', async () => {
      const cookie = await adminCookie()
      await app.inject({ method: 'POST', url: '/api/v1/products', headers: { cookie }, payload: body })

      const sameSku = await app.inject({ method: 'POST', url: '/api/v1/products', headers: { cookie }, payload: { ...body, name: 'Outro Nome' } })
      expect(sameSku.statusCode).toBe(409)
      const sameName = await app.inject({ method: 'POST', url: '/api/v1/products', headers: { cookie }, payload: { ...body, sku: 'NEXUS-ONE-2' } })
      expect(sameName.statusCode).toBe(409)

      const other = await app.inject({ method: 'POST', url: '/api/v1/products', headers: { cookie }, payload: { ...body, name: 'Nexus Três', sku: 'NEXUS-3' } })
      const clash = await app.inject({ method: 'PATCH', url: `/api/v1/products/${other.json().product.id}`, headers: { cookie }, payload: { sku: 'NEXUS-ONE-1' } })
      expect(clash.statusCode).toBe(409)
      const nameClash = await app.inject({ method: 'PATCH', url: `/api/v1/products/${other.json().product.id}`, headers: { cookie }, payload: { name: 'Nexus One' } })
      expect(nameClash.statusCode).toBe(409)

      expect((await app.inject({ method: 'PATCH', url: '/api/v1/products/nada', headers: { cookie }, payload: { price: 10 } })).statusCode).toBe(404)
      expect((await app.inject({ method: 'DELETE', url: '/api/v1/products/nada', headers: { cookie } })).statusCode).toBe(404)
    })

    it('cliente não mexe em produtos', async () => {
      const { cookie } = await customerCookie()
      const res = await app.inject({ method: 'POST', url: '/api/v1/products', headers: { cookie }, payload: body })
      expect(res.statusCode).toBe(403)
    })
  })

  describe('avaliações', () => {
    it('cria, marca compra verificada, recalcula a média e não deixa avaliar duas vezes', async () => {
      const product = await makeProduct({ name: 'Avaliado', brand: 'Teste', price: 1000 })
      const { user, cookie } = await customerCookie()

      // Pedido entregue deste produto: avaliação verificada
      const address = await prisma.address.create({ data: { ...ADDRESS, userId: user.id } })
      await prisma.order.create({
        data: {
          userId: user.id,
          addressId: address.id,
          status: 'DELIVERED',
          paymentStatus: 'PAID',
          subtotal: 1000,
          total: 1000,
          items: { create: { productId: product.id, name: product.name, price: 1000, quantity: 1 } },
        },
      })

      const review = await app.inject({
        method: 'POST',
        url: '/api/v1/reviews',
        headers: { cookie },
        payload: { productId: product.id, rating: 4, title: 'Bom', comment: 'Gostei <script>alert(1)</script>' },
      })
      expect(review.statusCode).toBeLessThan(300)

      const other = await customerCookie('outra@teste.com')
      await app.inject({ method: 'POST', url: '/api/v1/reviews', headers: { cookie: other.cookie }, payload: { productId: product.id, rating: 2 } })

      const again = await app.inject({ method: 'POST', url: '/api/v1/reviews', headers: { cookie }, payload: { productId: product.id, rating: 5 } })
      expect(again.statusCode).toBe(400)

      const list = await app.inject({ method: 'GET', url: `/api/v1/reviews/product/${product.id}` })
      const reviews = list.json().reviews
      expect(reviews).toHaveLength(2)
      const mine = reviews.find((r: { rating: number }) => r.rating === 4)
      expect(mine.isVerified).toBe(true)
      expect(mine.comment).not.toContain('<script>')

      const updated = await prisma.product.findUnique({ where: { id: product.id } })
      expect(updated).toMatchObject({ avgRating: 3, totalReviews: 2 })
    })

    it('produto inexistente e visitante sem login', async () => {
      const { cookie } = await customerCookie()
      expect((await app.inject({ method: 'POST', url: '/api/v1/reviews', headers: { cookie }, payload: { productId: 'nada', rating: 5 } })).statusCode).toBe(404)
      expect((await app.inject({ method: 'POST', url: '/api/v1/reviews', payload: { productId: 'nada', rating: 5 } })).statusCode).toBe(401)
    })
  })

  describe('favoritos', () => {
    it('adiciona, lista e remove', async () => {
      const product = await makeProduct({ name: 'Favorito', brand: 'Teste', price: 1200 })
      const { cookie } = await customerCookie()

      const on = await app.inject({ method: 'POST', url: '/api/v1/wishlist/toggle', headers: { cookie }, payload: { productId: product.id } })
      expect(on.json().favorited).toBe(true)

      const list = await app.inject({ method: 'GET', url: '/api/v1/wishlist', headers: { cookie } })
      expect(list.json().items).toHaveLength(1)
      expect(list.json().items[0].product).toMatchObject({ name: 'Favorito', price: 1200 })

      const off = await app.inject({ method: 'POST', url: '/api/v1/wishlist/toggle', headers: { cookie }, payload: { productId: product.id } })
      expect(off.json().favorited).toBe(false)

      expect((await app.inject({ method: 'POST', url: '/api/v1/wishlist/toggle', headers: { cookie }, payload: { productId: 'nada' } })).statusCode).toBe(404)
    })
  })

  describe('carrinho', () => {
    it('adiciona, soma, altera, remove e esvazia', async () => {
      const product = await makeProduct({ name: 'No Carrinho', brand: 'Teste', price: 800 })
      const { cookie } = await customerCookie()

      const added = await app.inject({ method: 'POST', url: '/api/v1/cart/items', headers: { cookie }, payload: { productId: product.id, quantity: 2 } })
      expect(added.statusCode).toBe(200)

      const cart = (await app.inject({ method: 'GET', url: '/api/v1/cart', headers: { cookie } })).json()
      expect(cart).toMatchObject({ totalItems: 2, subtotal: 1600 })
      const itemId = cart.items[0].id

      await app.inject({ method: 'PATCH', url: `/api/v1/cart/items/${itemId}`, headers: { cookie }, payload: { quantity: 3 } })
      expect((await app.inject({ method: 'GET', url: '/api/v1/cart', headers: { cookie } })).json().totalItems).toBe(3)

      await app.inject({ method: 'DELETE', url: `/api/v1/cart/items/${itemId}`, headers: { cookie } })
      expect((await app.inject({ method: 'GET', url: '/api/v1/cart', headers: { cookie } })).json().items).toHaveLength(0)

      await app.inject({ method: 'POST', url: '/api/v1/cart/items', headers: { cookie }, payload: { productId: product.id } })
      const cleared = await app.inject({ method: 'DELETE', url: '/api/v1/cart', headers: { cookie } })
      expect(cleared.json()).toMatchObject({ items: [], totalItems: 0, subtotal: 0 })
    })

    it('não passa do estoque', async () => {
      const product = await makeProduct({ name: 'Pouco Estoque', brand: 'Teste', price: 800 })
      const { cookie } = await customerCookie()
      const res = await app.inject({ method: 'POST', url: '/api/v1/cart/items', headers: { cookie }, payload: { productId: product.id, quantity: 999 } })
      expect(res.statusCode).toBeGreaterThanOrEqual(400)
    })
  })

  describe('frete', () => {
    it('usa o endereço do ViaCEP e devolve as opções', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ localidade: 'Vespasiano', uf: 'MG', bairro: 'Centro', logradouro: 'Rua A' }))))
      const res = await app.inject({ method: 'POST', url: '/api/v1/shipping/calculate', payload: { zipCode: '33200-000', subtotal: 500 } })
      expect(res.statusCode).toBe(200)
      expect(res.json().address).toMatchObject({ city: 'Vespasiano', state: 'MG' })
      expect(res.json().options.length).toBeGreaterThan(0)
    })

    it('segue calculando se o ViaCEP cair ou não achar o CEP', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('fora do ar') }))
      const down = await app.inject({ method: 'POST', url: '/api/v1/shipping/calculate', payload: { zipCode: '33200000', subtotal: 500 } })
      expect(down.statusCode).toBe(200)
      expect(down.json().address.city).toBe('')

      vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ erro: true }))))
      const notFound = await app.inject({ method: 'POST', url: '/api/v1/shipping/calculate', payload: { zipCode: '99999999', subtotal: 500 } })
      expect(notFound.json().address.city).toBe('')
    })

    it('frete grátis acima do limite e CEP inválido', async () => {
      vi.stubGlobal('fetch', vi.fn(async () => new Response('{}')))
      const free = await app.inject({ method: 'POST', url: '/api/v1/shipping/calculate', payload: { zipCode: '33200000', subtotal: 5000 } })
      expect(free.json().options.some((o: { price: number }) => o.price === 0)).toBe(true)

      const bad = await app.inject({ method: 'POST', url: '/api/v1/shipping/calculate', payload: { zipCode: 'abc-defgh', subtotal: 10 } })
      expect(bad.statusCode).toBe(400)
    })
  })

  describe('contato', () => {
    const message = { name: 'Maria', email: 'maria@teste.com', message: 'Quero saber do prazo de entrega.' }

    it('envia para o e-mail da loja e ignora robôs', async () => {
      expect((await app.inject({ method: 'POST', url: '/api/v1/contact', payload: { ...message, orderId: 'abc123' } })).json()).toEqual({ success: true })
      expect((await app.inject({ method: 'POST', url: '/api/v1/contact', payload: { ...message, website: 'spam.com' } })).json()).toEqual({ success: true })
    })

    it('avisa quando a loja não configurou o e-mail e valida a mensagem', async () => {
      await prisma.storeSettings.update({ where: { id: 'default' }, data: { contactEmail: null } })
      expect((await app.inject({ method: 'POST', url: '/api/v1/contact', payload: message })).statusCode).toBe(400)
      expect((await app.inject({ method: 'POST', url: '/api/v1/contact', payload: { ...message, message: 'curta' } })).statusCode).toBe(400)
    })
  })

  describe('cupons', () => {
    it('admin cria e lista; cliente valida o desconto', async () => {
      const admin = await adminCookie()
      const created = await app.inject({
        method: 'POST',
        url: '/api/v1/coupons',
        headers: { cookie: admin },
        payload: { code: 'bemvindo', discountType: 'percentage', discountValue: 10, minOrderValue: 100, maxUses: 5 },
      })
      expect(created.statusCode).toBe(201)
      expect(created.json().coupon.code).toBe('BEMVINDO')

      const list = await app.inject({ method: 'GET', url: '/api/v1/coupons', headers: { cookie: admin } })
      expect(list.json().coupons).toHaveLength(1)

      const { cookie } = await customerCookie()
      const valid = await app.inject({ method: 'POST', url: '/api/v1/coupons/validate', headers: { cookie }, payload: { code: 'BEMVINDO', orderAmount: 500 } })
      expect(valid.json().coupon.discountAmount).toBe(50)

      const tooSmall = await app.inject({ method: 'POST', url: '/api/v1/coupons/validate', headers: { cookie }, payload: { code: 'BEMVINDO', orderAmount: 50 } })
      expect(tooSmall.statusCode).toBe(400)
      const unknown = await app.inject({ method: 'POST', url: '/api/v1/coupons/validate', headers: { cookie }, payload: { code: 'NAOEXISTE', orderAmount: 500 } })
      expect(unknown.statusCode).toBeGreaterThanOrEqual(400)
    })

    it('cupom fixo, vencido e esgotado', async () => {
      await prisma.coupon.createMany({
        data: [
          { code: 'FIXO50', discountType: 'fixed', discountValue: 50 },
          { code: 'VENCIDO', discountType: 'fixed', discountValue: 50, expiresAt: new Date(Date.now() - 60_000) },
          { code: 'ESGOTADO', discountType: 'fixed', discountValue: 50, maxUses: 1, currentUses: 1 },
        ],
      })
      const { cookie } = await customerCookie()
      const check = (code: string) => app.inject({ method: 'POST', url: '/api/v1/coupons/validate', headers: { cookie }, payload: { code, orderAmount: 300 } })
      expect((await check('FIXO50')).json().coupon.discountAmount).toBe(50)
      expect((await check('VENCIDO')).statusCode).toBe(400)
      expect((await check('ESGOTADO')).statusCode).toBe(400)
    })
  })

  describe('minha conta', () => {
    it('atualiza o perfil e troca a senha', async () => {
      const { cookie } = await customerCookie()

      const profile = await app.inject({ method: 'PATCH', url: '/api/v1/account/profile', headers: { cookie }, payload: { name: 'Nome Novo', phone: '(31) 90000-0000' } })
      expect(profile.json().user).toMatchObject({ name: 'Nome Novo', phone: '(31) 90000-0000' })

      const wrong = await app.inject({ method: 'POST', url: '/api/v1/account/password', headers: { cookie }, payload: { currentPassword: 'Errada123', newPassword: 'NovaSenha123' } })
      expect(wrong.statusCode).toBe(401)
      const same = await app.inject({ method: 'POST', url: '/api/v1/account/password', headers: { cookie }, payload: { currentPassword: PASSWORD, newPassword: PASSWORD } })
      expect(same.statusCode).toBe(400)
      const ok = await app.inject({ method: 'POST', url: '/api/v1/account/password', headers: { cookie }, payload: { currentPassword: PASSWORD, newPassword: 'NovaSenha123' } })
      expect(ok.statusCode).toBe(200)

      await expect(login(app, 'cliente@teste.com', 'NovaSenha123')).resolves.toContain('access_token=')
    })

    it('endereços: primeiro vira padrão, troca o padrão e arquiva', async () => {
      const { cookie } = await customerCookie()
      const add = (label: string) => app.inject({ method: 'POST', url: '/api/v1/account/addresses', headers: { cookie }, payload: { ...ADDRESS, label } })

      const casa = (await add('Casa')).json().address
      expect(casa.isDefault).toBe(true)
      const trabalho = (await add('Trabalho')).json().address
      expect(trabalho.isDefault).toBe(false)

      await app.inject({ method: 'PATCH', url: `/api/v1/account/addresses/${trabalho.id}/default`, headers: { cookie } })
      await app.inject({ method: 'DELETE', url: `/api/v1/account/addresses/${trabalho.id}`, headers: { cookie } })

      const list = await app.inject({ method: 'GET', url: '/api/v1/account/addresses', headers: { cookie } })
      const addresses = list.json().addresses
      expect(addresses).toHaveLength(1)
      expect(addresses[0]).toMatchObject({ label: 'Casa', isDefault: true })

      expect((await app.inject({ method: 'DELETE', url: '/api/v1/account/addresses/nada', headers: { cookie } })).statusCode).toBe(404)
      expect((await app.inject({ method: 'PATCH', url: '/api/v1/account/addresses/nada/default', headers: { cookie } })).statusCode).toBe(404)
    })

    it('limite de 10 endereços', async () => {
      const { user, cookie } = await customerCookie()
      await prisma.address.createMany({ data: Array.from({ length: 10 }, () => ({ ...ADDRESS, userId: user.id })) })
      const res = await app.inject({ method: 'POST', url: '/api/v1/account/addresses', headers: { cookie }, payload: ADDRESS })
      expect(res.statusCode).toBe(400)
    })
  })

  describe('cadastro e recuperação de senha', () => {
    it('cadastra, recusa e-mail repetido e senha fraca', async () => {
      const payload = { name: 'Pessoa Nova', email: 'nova@teste.com', password: 'SenhaForte123' }
      const created = await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload })
      expect(created.statusCode).toBe(201)
      expect(created.cookies.map((c) => c.name)).toContain('access_token')

      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload })).statusCode).toBe(409)
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/register', payload: { ...payload, email: 'x@teste.com', password: 'fraca' } })).statusCode).toBe(400)
    })

    it('senha errada, conta desativada e logout', async () => {
      const user = await createUser('cliente@teste.com')
      const wrong = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'cliente@teste.com', password: 'Errada123' } })
      expect(wrong.statusCode).toBe(401)

      const cookie = await login(app, 'cliente@teste.com')
      const out = await app.inject({ method: 'POST', url: '/api/v1/auth/logout', headers: { cookie } })
      expect(out.statusCode).toBe(200)
      const refresh = cookie.split('; ').find((c) => c.startsWith('refresh_token='))!
      expect((await app.inject({ method: 'POST', url: '/api/v1/auth/refresh', headers: { cookie: refresh } })).statusCode).toBe(401)

      await prisma.user.update({ where: { id: user.id }, data: { isActive: false } })
      const blocked = await app.inject({ method: 'POST', url: '/api/v1/auth/login', payload: { email: 'cliente@teste.com', password: PASSWORD } })
      expect(blocked.statusCode).toBe(401)
    })

    it('esqueci a senha: mesma resposta para quem existe e quem não existe; token troca a senha uma vez', async () => {
      const user = await createUser('cliente@teste.com')
      const known = await app.inject({ method: 'POST', url: '/api/v1/auth/forgot-password', payload: { email: 'cliente@teste.com' } })
      const unknown = await app.inject({ method: 'POST', url: '/api/v1/auth/forgot-password', payload: { email: 'ninguem@teste.com' } })
      expect(known.json()).toEqual(unknown.json())

      const saved = await prisma.user.findUnique({ where: { id: user.id } })
      expect(saved?.passwordResetToken).toBeTruthy()

      // O e-mail leva o token cru; o banco guarda só o hash. Simula o link com um token conhecido.
      const raw = crypto.randomBytes(32).toString('hex')
      await prisma.user.update({
        where: { id: user.id },
        data: { passwordResetToken: crypto.createHash('sha256').update(raw).digest('hex'), passwordResetExpires: new Date(Date.now() + 60_000) },
      })
      const reset = await app.inject({ method: 'POST', url: '/api/v1/auth/reset-password', payload: { token: raw, newPassword: 'Recuperada123' } })
      expect(reset.statusCode).toBe(200)
      await expect(login(app, 'cliente@teste.com', 'Recuperada123')).resolves.toContain('access_token=')

      const reused = await app.inject({ method: 'POST', url: '/api/v1/auth/reset-password', payload: { token: raw, newPassword: 'OutraSenha123' } })
      expect(reused.statusCode).toBe(400)
    })

    it('status do setup', async () => {
      const before = await app.inject({ method: 'GET', url: '/api/v1/auth/setup-status' })
      expect(before.json().needsSetup).toBe(true)
      await createUser('dono@teste.com', 'ADMIN')
      const after = await app.inject({ method: 'GET', url: '/api/v1/auth/setup-status' })
      expect(after.json().needsSetup).toBe(false)
    })
  })
})
