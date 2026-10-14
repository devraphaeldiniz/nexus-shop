import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { FastifyInstance } from 'fastify'
import { buildApp } from '../../src/app.js'

describe('Integration: Health Check', () => {
  let app: FastifyInstance

  beforeAll(async () => {
    app = await buildApp()
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  it('GET /health deve responder com status HTTP 200 e informações de serviços', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/health',
    })

    expect(response.statusCode).toBe(200)
    const json = JSON.parse(response.payload)
    expect(json).toHaveProperty('status')
    expect(json).toHaveProperty('timestamp')
    expect(json).toHaveProperty('services')
  })
})
