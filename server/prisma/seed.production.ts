import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'

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

  // Criação do Administrador Master para entrega
  const adminPasswordHash = await bcrypt.hash('Admin@Nexus2025!', 12)
  const admin = await prisma.user.upsert({
    where: { email: 'admin@nexusshop.com' },
    update: {},
    create: {
      email: 'admin@nexusshop.com',
      name: 'Administrador Master',
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      emailVerified: true,
    },
  })
  console.log(`👤 Administrador Master criado: ${admin.email}`)
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
