import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildApp } from '../../src/app.js'

describe('Integration: webhooks de pagamento (sem banco)', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('Stripe: recusa webhook sem o header stripe-signature', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/stripe/webhook',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ type: 'payment_intent.succeeded' }),
    })
    expect(response.statusCode).toBe(400)
  })

  it('Stripe: recusa JSON inválido', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/stripe/webhook',
      headers: { 'content-type': 'application/json', 'stripe-signature': 't=1,v1=abc' },
      payload: '{"quebrado":',
    })
    expect(response.statusCode).toBe(400)
  })

  it('Mercado Pago: recusa webhook sem assinatura', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/mercadopago/webhook?data.id=123&type=payment',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ type: 'payment', action: 'payment.updated', data: { id: '123' } }),
    })
    expect(response.statusCode).toBe(401)
  })

  it('Mercado Pago: recusa assinatura falsa', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/payments/mercadopago/webhook?data.id=123&type=payment',
      headers: {
        'content-type': 'application/json',
        'x-signature': `ts=1700000000,v1=${'0'.repeat(64)}`,
        'x-request-id': 'req-1',
      },
      payload: JSON.stringify({ type: 'payment', data: { id: '123' } }),
    })
    expect(response.statusCode).toBe(401)
  })

  it('JSON das demais rotas continua funcionando (parser só muda no escopo de pagamentos)', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'content-type': 'application/json' },
      payload: JSON.stringify({ email: 'nao-e-email', password: 'x' }),
    })
    // 400 = Zod leu o corpo normalmente e rejeitou o e-mail
    expect(response.statusCode).toBe(400)
  })
})
