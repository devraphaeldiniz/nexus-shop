import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { FastifyInstance } from 'fastify'
import { prisma } from '../../src/config/prisma.js'

/** Testes que gravam no banco só rodam com TEST_DATABASE_URL definido. */
export const hasTestDb = !!process.env.TEST_DATABASE_URL

/** Apaga todos os dados. Recusa qualquer banco cujo nome não contenha "test". */
export async function resetDb() {
  const dbName = new URL(process.env.DATABASE_URL || '').pathname
  if (!/test/i.test(dbName)) {
    throw new Error(`Recusando limpar o banco "${dbName}": use um banco de teste.`)
  }
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'`
  if (tables.length > 0) {
    await prisma.$executeRawUnsafe(
      `TRUNCATE ${tables.map((t) => `"${t.tablename}"`).join(', ')} RESTART IDENTITY CASCADE`
    )
  }
}

export const PASSWORD = 'SenhaForte123'

export async function seedStore(overrides: { stripeEnabled?: boolean; mercadoPagoEnabled?: boolean } = {}) {
  await prisma.storeSettings.create({
    data: {
      id: 'default',
      freeShippingThreshold: 3000,
      stripeEnabled: overrides.stripeEnabled ?? true,
      mercadoPagoEnabled: overrides.mercadoPagoEnabled ?? true,
      contactEmail: 'loja@teste.com',
    },
  })
}

export async function createProduct(data: { price: number; stock: number; name?: string }) {
  const id = crypto.randomBytes(4).toString('hex')
  return prisma.product.create({
    data: {
      name: data.name ?? `Celular ${id}`,
      slug: `celular-${id}`,
      sku: `SKU-${id}`,
      description: 'Smartphone de teste com descrição longa o suficiente.',
      price: data.price,
      brand: 'Teste',
      model: 'T1',
      stock: data.stock,
      specifications: { ram: 8, storage: 256, colors: ['Preto'] },
    },
  })
}

export async function createUser(email: string, role: 'CUSTOMER' | 'ADMIN' = 'CUSTOMER') {
  return prisma.user.create({
    data: { email, name: 'Pessoa Teste', role, passwordHash: await bcrypt.hash(PASSWORD, 4) },
  })
}

/** Faz login e devolve o header Cookie com a sessão. */
export async function login(app: FastifyInstance, email: string, password = PASSWORD): Promise<string> {
  const response = await app.inject({
    method: 'POST',
    url: '/api/v1/auth/login',
    payload: { email, password },
  })
  if (response.statusCode !== 200) {
    throw new Error(`Login falhou (${response.statusCode}): ${response.body}`)
  }
  return response.cookies.map((c) => `${c.name}=${c.value}`).join('; ')
}

export const ADDRESS = {
  street: 'Rua Teste',
  number: '10',
  neighborhood: 'Centro',
  city: 'Vespasiano',
  state: 'MG',
  zipCode: '33200000',
}

/** Assina um webhook do Mercado Pago como o painel faria. */
export function signMercadoPago(dataId: string, requestId = crypto.randomUUID()) {
  const ts = String(Date.now())
  const v1 = crypto
    .createHmac('sha256', process.env.MERCADOPAGO_WEBHOOK_SECRET!)
    .update(`id:${dataId};request-id:${requestId};ts:${ts};`)
    .digest('hex')
  return { 'x-signature': `ts=${ts},v1=${v1}`, 'x-request-id': requestId }
}
