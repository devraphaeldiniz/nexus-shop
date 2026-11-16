// Roda a suíte completa contra um banco de teste separado (nunca o de desenvolvimento).
// Uso: npm run test:db   (TEST_DATABASE_URL opcional; padrão: nexus_shop_test no Postgres do docker-compose)
import { execSync } from 'node:child_process'

const url =
  process.env.TEST_DATABASE_URL ||
  'postgresql://nexus_user:nexus_password123@localhost:5433/nexus_shop_test?schema=public'

if (!/test/i.test(new URL(url).pathname)) {
  console.error('TEST_DATABASE_URL precisa apontar para um banco com "test" no nome.')
  process.exit(1)
}

const env = { ...process.env, DATABASE_URL: url, TEST_DATABASE_URL: url }
const run = (cmd) => execSync(cmd, { stdio: 'inherit', env })

// prisma migrate deploy cria o banco se ele não existir e aplica as migrações
run('npx prisma migrate deploy')
// Repassa opções extras para o vitest (ex.: npm run test:db -- --coverage)
run(['npx vitest run', ...process.argv.slice(2)].join(' '))
