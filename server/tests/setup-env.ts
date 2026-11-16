// Carregado antes de cada arquivo de teste (vitest.config.ts → setupFiles).
// Testes com banco usam TEST_DATABASE_URL, nunca o banco de desenvolvimento do .env.
if (process.env.TEST_DATABASE_URL) {
  process.env.DATABASE_URL = process.env.TEST_DATABASE_URL
}
process.env.NODE_ENV = 'test'
process.env.MERCADOPAGO_WEBHOOK_SECRET = process.env.MERCADOPAGO_WEBHOOK_SECRET || 'segredo-webhook-teste'
