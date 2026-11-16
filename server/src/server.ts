import { buildApp } from './app.js'
import { env } from './config/env.js'
import { prisma } from './config/prisma.js'
import { PaymentService } from './modules/payments/payments.service.js'

/** Intervalo da varredura que cancela pedidos sem pagamento e devolve o estoque. */
const RECONCILE_INTERVAL_MS = 5 * 60 * 1000

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

  // Varredura periódica de pedidos pendentes (PIX expirado, cartão abandonado, webhook perdido)
  const paymentService = new PaymentService()
  const reconcile = async () => {
    try {
      const result = await paymentService.reconcileStaleOrders()
      if (result.confirmed || result.cancelled) {
        app.log.info(result, 'Pedidos pendentes reconciliados')
      }
    } catch (error) {
      app.log.error(error, 'Falha na varredura de pedidos pendentes')
    }
  }
  const reconcileTimer = env.NODE_ENV === 'test' ? null : setInterval(reconcile, RECONCILE_INTERVAL_MS)
  reconcileTimer?.unref()

  // Graceful shutdown
  const signals: NodeJS.Signals[] = ['SIGINT', 'SIGTERM']
  for (const signal of signals) {
    process.on(signal, async () => {
      console.log(`\n🛑 Recebido sinal ${signal}. Encerrando servidor de forma segura...`)
      if (reconcileTimer) clearInterval(reconcileTimer)
      await app.close()
      await prisma.$disconnect()
      console.log('✅ Nexus Shop API encerrada com sucesso.')
      process.exit(0)
    })
  }
}

bootstrap()
