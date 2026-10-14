import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: z.string().default('http://localhost:3000'),

  DATABASE_URL: z.string().default('postgresql://nexus_user:nexus_password123@localhost:5432/nexus_shop?schema=public'),
  REDIS_URL: z.string().default('redis://localhost:6379'),

  JWT_ACCESS_SECRET: z.string().min(16).default('nexus-shop-access-secret-32-chars-at-least!'),
  JWT_REFRESH_SECRET: z.string().min(16).default('nexus-shop-refresh-secret-32-chars-at-least!'),

  CORS_ORIGIN: z.string().default('http://localhost:3000'),

  STRIPE_SECRET_KEY: z.string().default('sk_test_mock_stripe_key_nexus_shop'),
  STRIPE_WEBHOOK_SECRET: z.string().default('whsec_mock_stripe_secret'),
  STRIPE_CURRENCY: z.string().default('brl'),

  MERCADOPAGO_ACCESS_TOKEN: z.string().default('APP_USR_mock_mercadopago_token'),
  MERCADOPAGO_WEBHOOK_SECRET: z.string().default('mock_mp_secret'),

  SMTP_HOST: z.string().default('smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().default(2525),
  SMTP_USER: z.string().default('mock_user'),
  SMTP_PASS: z.string().default('mock_pass'),
  SMTP_FROM: z.string().default('Nexus Shop <nao-responda@nexusshop.com>'),
})

export const env = envSchema.parse(process.env)
