import fastify, { FastifyInstance } from 'fastify'
import cors from '@fastify/cors'
import helmet from '@fastify/helmet'
import rateLimit from '@fastify/rate-limit'
import cookie from '@fastify/cookie'
import multipart from '@fastify/multipart'
import swagger from '@fastify/swagger'
import swaggerUi from '@fastify/swagger-ui'
import { ZodError } from 'zod'

import { env } from './config/env.js'
import { prisma } from './config/prisma.js'
import { redis } from './config/redis.js'
import { AppError } from './utils/errors.js'

import { authRoutes } from './modules/auth/auth.routes.js'
import { productRoutes } from './modules/products/products.routes.js'
import { cartRoutes } from './modules/cart/cart.routes.js'
import { orderRoutes } from './modules/orders/orders.routes.js'
import { paymentRoutes } from './modules/payments/payments.routes.js'
import { couponRoutes } from './modules/coupons/coupons.routes.js'
import { reviewRoutes } from './modules/reviews/reviews.routes.js'
import { wishlistRoutes } from './modules/wishlist/wishlist.routes.js'
import { adminRoutes } from './modules/admin/admin.routes.js'
import { settingsRoutes } from './modules/settings/settings.routes.js'

export async function buildApp(): Promise<FastifyInstance> {
  const app = fastify({
    logger: env.NODE_ENV === 'development' ? {
      transport: {
        target: 'pino-pretty',
        options: { colorize: true },
      },
    } : true,
    trustProxy: true,
  })

  // 1. SEGURANÇA: Helmet (Headers HTTP)
  await app.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https://js.stripe.com', 'https://sdk.mercadopago.com'],
        imgSrc: ["'self'", 'data:', 'https:', 'blob:'],
        connectSrc: ["'self'", 'https://api.stripe.com', 'https://api.mercadopago.com'],
        frameSrc: ["'self'", 'https://js.stripe.com', 'https://sdk.mercadopago.com'],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    noSniff: true,
  })

  // 2. CORS
  await app.register(cors, {
    origin: [env.FRONTEND_URL, 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })

  // 3. RATE LIMITING
  await app.register(rateLimit, {
    max: 120,
    timeWindow: '1 minute',
    errorResponseBuilder: () => ({
      statusCode: 429,
      error: 'Too Many Requests',
      message: 'Limite de requisições excedido. Aguarde um minuto.',
    }),
  })

  // 4. COOKIES & MULTIPART
  await app.register(cookie)
  await app.register(multipart, {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
  })

  // 5. DOCUMENTAÇÃO SWAGGER / OPENAPI
  await app.register(swagger, {
    swagger: {
      info: {
        title: 'Nexus Shop API',
        description: 'API RESTful completa para plataforma de e-commerce de smartphones premium',
        version: '1.0.0',
      },
      host: `localhost:${env.PORT}`,
      schemes: ['http', 'https'],
      consumes: ['application/json'],
      produces: ['application/json'],
      securityDefinitions: {
        bearerAuth: {
          type: 'apiKey',
          name: 'Authorization',
          in: 'header',
        },
      },
    },
  })

  await app.register(swaggerUi, {
    routePrefix: '/documentation',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: false,
    },
  })

  // 6. HEALTH CHECK
  app.get('/health', async () => {
    let dbStatus = 'ok'
    let redisStatus = 'ok'

    try {
      await prisma.$queryRaw`SELECT 1`
    } catch {
      dbStatus = 'unreachable'
    }

    try {
      redisStatus = redis.isConnected ? 'ok' : 'memory_fallback'
    } catch {
      redisStatus = 'error'
    }

    return {
      status: dbStatus === 'ok' ? 'healthy' : 'degraded',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        database: dbStatus,
        cache: redisStatus,
      },
    }
  })

  // 7. REGISTRO DE ROTAS VERSIONADAS (/api/v1)
  app.register(
    async (apiV1) => {
      apiV1.register(authRoutes, { prefix: '/auth' })
      apiV1.register(productRoutes, { prefix: '/products' })
      apiV1.register(cartRoutes, { prefix: '/cart' })
      apiV1.register(orderRoutes, { prefix: '/orders' })
      apiV1.register(paymentRoutes, { prefix: '/payments' })
      apiV1.register(couponRoutes, { prefix: '/coupons' })
      apiV1.register(reviewRoutes, { prefix: '/reviews' })
      apiV1.register(wishlistRoutes, { prefix: '/wishlist' })
      apiV1.register(adminRoutes, { prefix: '/admin' })
      apiV1.register(settingsRoutes, { prefix: '/settings' })
    },
    { prefix: '/api/v1' }
  )

  // 8. ERROR HANDLER GLOBAL ESTRUTURADO
  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.status(400).send({
        statusCode: 400,
        error: 'Validation Error',
        message: 'Dados da requisição inválidos',
        issues: error.issues.map((i) => ({
          field: i.path.join('.'),
          message: i.message,
        })),
      })
    }

    if (error instanceof AppError) {
      return reply.status(error.statusCode).send({
        statusCode: error.statusCode,
        error: error.name,
        message: error.message,
      })
    }

    // Erros não tratados
    app.log.error(error)
    return reply.status(500).send({
      statusCode: 500,
      error: 'Internal Server Error',
      message: env.NODE_ENV === 'production'
        ? 'Ocorreu um erro interno no servidor.'
        : error.message,
    })
  })

  return app
}
