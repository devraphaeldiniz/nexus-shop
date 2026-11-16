import { FastifyInstance, FastifyRequest } from 'fastify'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '../../config/prisma.js'
import { revokeAllSessions } from '../auth/sessions.js'
import { authenticate } from '../../middlewares/auth.middleware.js'
import { BadRequestError, ForbiddenError, NotFoundError, UnauthorizedError } from '../../utils/errors.js'

const ProfileSchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().nullable(),
})

const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Informe a senha atual'),
  newPassword: z
    .string()
    .min(8, 'A senha deve conter no mínimo 8 caracteres')
    .max(128)
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número'),
})

const AddressSchema = z.object({
  label: z.string().trim().min(1).max(40).default('Principal'),
  street: z.string().trim().min(1),
  number: z.string().trim().min(1),
  complement: z.string().trim().optional().nullable(),
  neighborhood: z.string().trim().min(1),
  city: z.string().trim().min(1),
  state: z.string().trim().length(2).transform((s) => s.toUpperCase()),
  zipCode: z.string().regex(/^\d{5}-?\d{3}$/, 'CEP inválido').transform((s) => s.replace(/\D/g, '')),
  isDefault: z.boolean().optional(),
})

const profileSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  avatar: true,
  role: true,
  emailVerified: true,
  createdAt: true,
} as const

export async function accountRoutes(app: FastifyInstance) {
  app.addHook('preHandler', authenticate)

  // Contas de demonstração são compartilhadas: ninguém troca nome, e-mail ou senha delas
  const blockDemo = async (request: FastifyRequest) => {
    if (request.user?.demo) {
      throw new ForbiddenError('Conta de demonstração: nome, e-mail e senha não podem ser alterados.')
    }
  }

  app.patch('/profile', { preHandler: blockDemo }, async (request, reply) => {
    const data = ProfileSchema.parse(request.body)
    const user = await prisma.user.update({
      where: { id: request.user!.userId },
      data: { name: data.name, phone: data.phone || null },
      select: profileSelect,
    })
    return reply.send({ user })
  })

  app.post('/password', { preHandler: blockDemo, config: { rateLimit: { max: 5, timeWindow: '1 minute' } } }, async (request, reply) => {
    const { currentPassword, newPassword } = ChangePasswordSchema.parse(request.body)
    const user = await prisma.user.findUnique({ where: { id: request.user!.userId } })
    if (!user?.passwordHash || !(await bcrypt.compare(currentPassword, user.passwordHash))) {
      throw new UnauthorizedError('Senha atual incorreta')
    }
    if (await bcrypt.compare(newPassword, user.passwordHash)) {
      throw new BadRequestError('A nova senha precisa ser diferente da atual')
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: await bcrypt.hash(newPassword, 12) },
    })
    // Derruba as outras sessões (o refresh token atual deixa de valer)
    await revokeAllSessions(user.id)
    return reply.send({ success: true, message: 'Senha alterada. Faça login novamente nos outros dispositivos.' })
  })

  app.get('/addresses', async (request, reply) => {
    const addresses = await prisma.address.findMany({
      where: { userId: request.user!.userId, archivedAt: null },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })
    return reply.send({ addresses })
  })

  app.post('/addresses', async (request, reply) => {
    const data = AddressSchema.parse(request.body)
    const userId = request.user!.userId

    const address = await prisma.$transaction(async (tx) => {
      const count = await tx.address.count({ where: { userId, archivedAt: null } })
      if (count >= 10) throw new BadRequestError('Limite de 10 endereços atingido')

      const makeDefault = data.isDefault || count === 0
      if (makeDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } })
      }
      return tx.address.create({
        data: { ...data, complement: data.complement || null, userId, isDefault: makeDefault },
      })
    })
    return reply.status(201).send({ address })
  })

  app.patch('/addresses/:id/default', async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user!.userId

    const address = await prisma.address.findFirst({ where: { id, userId, archivedAt: null } })
    if (!address) throw new NotFoundError('Endereço não encontrado')

    await prisma.$transaction([
      prisma.address.updateMany({ where: { userId }, data: { isDefault: false } }),
      prisma.address.update({ where: { id }, data: { isDefault: true } }),
    ])
    return reply.send({ success: true })
  })

  // Remove da lista do cliente; o registro fica para o histórico dos pedidos
  app.delete('/addresses/:id', async (request, reply) => {
    const { id } = request.params as { id: string }
    const userId = request.user!.userId

    const address = await prisma.address.findFirst({ where: { id, userId, archivedAt: null } })
    if (!address) throw new NotFoundError('Endereço não encontrado')

    await prisma.address.update({ where: { id }, data: { archivedAt: new Date(), isDefault: false } })

    if (address.isDefault) {
      const next = await prisma.address.findFirst({
        where: { userId, archivedAt: null },
        orderBy: { createdAt: 'desc' },
      })
      if (next) await prisma.address.update({ where: { id: next.id }, data: { isDefault: true } })
    }
    return reply.send({ success: true })
  })
}
