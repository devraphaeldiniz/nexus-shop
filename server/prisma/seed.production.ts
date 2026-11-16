import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { upsertDemoAccounts } from './demo-accounts.js'

const prisma = new PrismaClient()

async function main() {
  console.log('🚀 Inicializando ambiente de produção do Nexus Shop...')

  // Garante a existência do registro de configurações da loja
  await prisma.storeSettings.upsert({
    where: { id: 'default' },
    update: {},
    create: {
      id: 'default',
      storeName: 'Nexus Shop',
      freeShippingThreshold: 0,
      stripeEnabled: false,
      mercadoPagoEnabled: false,
    },
  })
  console.log('⚙️ Tabela de configurações da loja inicializada.')

  // Administrador inicial: só é criado se ADMIN_EMAIL e ADMIN_PASSWORD vierem do ambiente.
  // Sem elas, o primeiro admin é criado pela tela /setup da loja.
  const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase()
  const adminPassword = process.env.ADMIN_PASSWORD
  if (adminEmail && adminPassword) {
    if (adminPassword.length < 12) {
      throw new Error('ADMIN_PASSWORD deve ter pelo menos 12 caracteres.')
    }
    const adminPasswordHash = await bcrypt.hash(adminPassword, 12)
    const admin = await prisma.user.upsert({
      where: { email: adminEmail },
      update: {},
      create: {
        email: adminEmail,
        name: process.env.ADMIN_NAME || 'Administrador',
        passwordHash: adminPasswordHash,
        role: Role.ADMIN,
        emailVerified: true,
      },
    })
    console.log(`👤 Administrador criado: ${admin.email}`)
  } else {
    console.log('ℹ️ ADMIN_EMAIL/ADMIN_PASSWORD não definidos: crie o primeiro administrador em /setup.')
  }
  // Contas de demonstração (somente se a loja for uma vitrine de portfólio)
  if (process.env.DEMO_ACCOUNTS === 'true') {
    await upsertDemoAccounts(prisma)
  }

  console.log('✅ Ambiente pronto para o lojista cadastrar produtos e configurar suas chaves de pagamento!')
}

main()
  .catch((e) => {
    console.error('Erro na inicialização:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
