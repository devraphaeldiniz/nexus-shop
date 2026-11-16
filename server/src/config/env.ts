import { z } from 'zod'
import dotenv from 'dotenv'

dotenv.config()

const isProduction = process.env.NODE_ENV === 'production'

/** Trata variável vazia no .env (VAR=) como não definida. */
const optional = <T extends z.ZodTypeAny>(schema: T) =>
  z.preprocess((v) => (v === '' ? undefined : v), schema.optional())

/**
 * Valor padrão só fora de produção. Em produção a variável precisa vir do ambiente
 * (evita subir a loja com senhas e segredos de exemplo).
 */
const devDefault = (schema: z.ZodString, fallback: string) =>
  z.preprocess((v) => (v === '' ? undefined : v), isProduction ? schema : schema.default(fallback))

/** Segredo opcional: sem valor padrão em produção (a funcionalidade fica desativada). */
const devOnlyDefault = (fallback: string) =>
  z.preprocess((v) => (v === '' ? undefined : v), isProduction ? z.string().default('') : z.string().default(fallback))

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(3001),
  FRONTEND_URL: devDefault(z.string().url(), 'http://localhost:3000'),

  DATABASE_URL: devDefault(z.string().min(1), 'postgresql://nexus_user:nexus_password123@localhost:5433/nexus_shop?schema=public'),
  REDIS_URL: devDefault(z.string().min(1), 'redis://localhost:6379'),

  JWT_ACCESS_SECRET: devDefault(z.string().min(32, 'JWT_ACCESS_SECRET precisa de 32+ caracteres'), 'nexus-shop-access-secret-32-chars-at-least!'),
  JWT_REFRESH_SECRET: devDefault(z.string().min(32, 'JWT_REFRESH_SECRET precisa de 32+ caracteres'), 'nexus-shop-refresh-secret-32-chars-at-least!'),

  // Chave usada para criptografar as chaves de pagamento salvas pelo painel (AES-256-GCM).
  SETTINGS_ENCRYPTION_KEY: devDefault(z.string().min(32, 'SETTINGS_ENCRYPTION_KEY precisa de 32+ caracteres'), 'nexus-shop-dev-settings-encryption-key!!'),

  // Origens extras liberadas no CORS, separadas por vírgula (FRONTEND_URL já é liberada).
  CORS_ORIGIN: optional(z.string()),

  // URL pública da API (ex.: https://api.minhaloja.com). Usada para montar a notification_url do Mercado Pago.
  API_PUBLIC_URL: optional(z.string().url()),

  // Cookies de sessão: 'lax' quando front e API estão no mesmo site; 'none' (exige HTTPS) quando estão em domínios diferentes.
  COOKIE_SAME_SITE: z.enum(['lax', 'strict', 'none']).default('lax'),
  COOKIE_DOMAIN: optional(z.string()),

  // Requisições por minuto por IP. Fora de produção é folgado para os testes automatizados.
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(isProduction ? 120 : 1000),

  // Contas de demonstração (senha exibida na tela de login). Ligadas por padrão fora de produção;
  // em produção só com DEMO_ACCOUNTS=true. Desligadas, as contas demo não conseguem entrar.
  DEMO_ACCOUNTS: z
    .preprocess((v) => (v === '' || v === undefined ? undefined : String(v).toLowerCase() === 'true'), z.boolean().optional())
    .transform((v) => v ?? !isProduction),

  // Se definido, a criação do primeiro administrador (POST /auth/setup) exige este token.
  SETUP_TOKEN: optional(z.string().min(8)),

  // Chaves de pagamento: podem vir do painel admin; o .env é o fallback.
  STRIPE_SECRET_KEY: devOnlyDefault('sk_test_mock_stripe_key_nexus_shop'),
  STRIPE_WEBHOOK_SECRET: devOnlyDefault('whsec_mock_stripe_secret'),
  STRIPE_CURRENCY: z.string().default('brl'),
  STRIPE_PUBLISHABLE_KEY: optional(z.string()),

  MERCADOPAGO_ACCESS_TOKEN: devOnlyDefault('APP_USR_mock_mercadopago_token'),
  MERCADOPAGO_WEBHOOK_SECRET: devOnlyDefault('mock_mp_secret'),

  // E-mail é opcional: sem SMTP_HOST a loja funciona normalmente, só não envia e-mails
  SMTP_HOST: devOnlyDefault('smtp.mailtrap.io'),
  SMTP_PORT: z.coerce.number().default(2525),
  SMTP_USER: devOnlyDefault('mock_user'),
  SMTP_PASS: devOnlyDefault('mock_pass'),
  SMTP_FROM: z.string().default('Nexus Shop <nao-responda@nexusshop.com>'),
})

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  const problems = parsed.error.issues
    .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
    .join('\n')
  // Falha cedo e com mensagem clara em vez de subir com configuração insegura
  console.error(`❌ Variáveis de ambiente inválidas ou ausentes:\n${problems}`)
  process.exit(1)
}

export const env = parsed.data

/** Origens aceitas pelo CORS. Em desenvolvimento também libera localhost:3000. */
export const corsOrigins = [
  ...new Set(
    [
      env.FRONTEND_URL,
      ...(env.CORS_ORIGIN ? env.CORS_ORIGIN.split(',') : []),
      ...(env.NODE_ENV === 'production' ? [] : ['http://localhost:3000']),
    ]
      .map((origin) => origin.trim().replace(/\/$/, ''))
      .filter(Boolean)
  ),
]
