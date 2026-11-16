import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildApp } from '../../src/app.js'

describe('Erros HTTP mantêm o status certo', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
    app.get('/test/too-many', async () => {
      // Mesmo formato que o @fastify/rate-limit lança
      throw Object.assign(new Error('Limite de requisições excedido. Aguarde um minuto.'), {
        statusCode: 429,
        error: 'Too Many Requests',
      })
    })
    app.get('/test/crash', async () => {
      throw new Error('falha inesperada')
    })
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('limite de requisições responde 429, não 500', async () => {
    const res = await app.inject({ method: 'GET', url: '/test/too-many' })
    expect(res.statusCode).toBe(429)
    expect(res.json().message).toMatch(/Aguarde um minuto/)
  })

  it('corpo em formato não suportado responde 415', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/auth/login',
      headers: { 'content-type': 'text/xml' },
      payload: '<login/>',
    })
    expect(res.statusCode).toBe(415)
  })

  it('erro inesperado continua sendo 500', async () => {
    const res = await app.inject({ method: 'GET', url: '/test/crash' })
    expect(res.statusCode).toBe(500)
  })
})
