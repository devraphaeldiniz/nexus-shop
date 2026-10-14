import { buildApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'

async function bootstrap() {
  const app = await buildApp()

  try {
    const address = await app.listen({
      port: env.PORT,
      host: '0.0.0.0',
    })

    console.log(`
  🚀 ========================================================
     NEXUS SHOP API - ONLINE
  ========================================================
  📡 Servidor:      ${address}
  📚 Documentação:  ${address}/documentation
  🩺 Health check:  ${address}/health
  🛡️ Ambiente:      ${env.NODE_ENV}
  ========================================================
    `)
  } catch (err) {
    app.log.error(err)
    process.exit(1)
  }

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n🛑 Recebido sinal ${signal}. Encerrando servidor de forma segura...`)
      await app.close()
      await prisma.$disconnect()
      console.log('✅ Nexus Shop API encerrada com sucesso.')
      process.exit(0)
    })
  }
}

bootstrap()
