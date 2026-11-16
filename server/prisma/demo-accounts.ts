import { PrismaClient, Role } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../src/config/demo.js'

/**
 * Cria (ou restaura) as contas de demonstração da tela de login.
 * Rodar de novo volta a senha para a padrão e reativa as contas.
 */
export async function upsertDemoAccounts(prisma: PrismaClient) {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, 12)

  for (const account of DEMO_ACCOUNTS) {
    const user = await prisma.user.upsert({
      where: { email: account.email },
      update: { passwordHash, name: account.name, role: account.role as Role, isDemo: true, isActive: true },
      create: {
        email: account.email,
        name: account.name,
        passwordHash,
        role: account.role as Role,
        isDemo: true,
        emailVerified: true,
      },
    })

    // O cliente demo já começa com um endereço, para o checkout ser rápido
    if (account.role === 'CUSTOMER') {
      const hasAddress = await prisma.address.count({ where: { userId: user.id, archivedAt: null } })
      if (!hasAddress) {
        await prisma.address.create({
          data: {
            userId: user.id,
            label: 'Casa',
            street: 'Rua da Demonstração',
            number: '100',
            neighborhood: 'Centro',
            city: 'Belo Horizonte',
            state: 'MG',
            zipCode: '30130000',
            isDefault: true,
          },
        })
      }
    }
    console.log(`🧪 Conta de demonstração pronta: ${account.email} (${account.label})`)
  }
}
