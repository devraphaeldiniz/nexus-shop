import { FastifyInstance } from 'fastify'
import { AuthService } from './auth.service.js'
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  SetupSchema,
} from './auth.schemas.js'
import { authenticate } from '../../middlewares/auth.middleware.js'
import { prisma } from '../../config/prisma.js'
import { env } from '../../config/env.js'
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from '../../config/demo.js'
import { verifyRefreshToken } from '../../utils/jwt.js'
import { UnauthorizedError } from '../../utils/errors.js'
import { REFRESH_COOKIE, clearAuthCookies, setAuthCookies } from '../../utils/cookies.js'

/** Limite mais rígido para rotas sensíveis a força bruta (folgado nos testes automatizados). */
const strictLimit = { rateLimit: { max: env.NODE_ENV === 'test' ? 1000 : 10, timeWindow: '1 minute' } }

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService()

  // Status de Setup Inicial da Loja (verifica se o primeiro admin precisa ser criado)
  app.get('/setup-status', async (_request, reply) => {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    return reply.send({ needsSetup: adminCount === 0, requiresToken: !!env.SETUP_TOKEN })
  })

  // Criação do primeiro administrador (bloqueada depois que existir um)
  app.post('/setup', { config: strictLimit }, async (request, reply) => {
    const data = SetupSchema.parse(request.body)
    const result = await authService.setupFirstAdmin(data)
    setAuthCookies(reply, result.accessToken, result.refreshToken)
    return reply.status(201).send({ user: result.user })
  })

  app.post('/register', { config: strictLimit }, async (request, reply) => {
    const data = RegisterSchema.parse(request.body)
    const result = await authService.register(data)
    setAuthCookies(reply, result.accessToken, result.refreshToken)
    return reply.status(201).send({ user: result.user })
  })

  app.post('/login', { config: strictLimit }, async (request, reply) => {
    const data = LoginSchema.parse(request.body)
    const result = await authService.login(data)
    setAuthCookies(reply, result.accessToken, result.refreshToken)
    return reply.send({ user: result.user })
  })

  // Renova a sessão a partir do cookie refresh_token (com rotação)
  app.post('/refresh', async (request, reply) => {
    const token = request.cookies?.[REFRESH_COOKIE]
    if (!token) {
      clearAuthCookies(reply)
      throw new UnauthorizedError('Sessão expirada. Faça login novamente.')
    }

    try {
      const result = await authService.refreshToken(token)
      setAuthCookies(reply, result.accessToken, result.refreshToken)
      return reply.send({ user: result.user })
    } catch (error) {
      clearAuthCookies(reply)
      throw error
    }
  })

  // Logout funciona mesmo com o access token expirado
  app.post('/logout', async (request, reply) => {
    const token = request.cookies?.[REFRESH_COOKIE]
    if (token) {
      try {
        const payload = verifyRefreshToken(token)
        await authService.logout(payload.userId, token)
      } catch {
        // Token inválido/expirado: só limpa os cookies
      }
    }

    clearAuthCookies(reply)
    return reply.send({ success: true, message: 'Sessão encerrada com segurança' })
  })

  // Contas de demonstração para a tela de login (só quando DEMO_ACCOUNTS está ligado e as contas existem)
  app.get('/demo-accounts', async (_request, reply) => {
    if (!env.DEMO_ACCOUNTS) return reply.send({ accounts: [] })
    const existing = await prisma.user.findMany({
      where: { email: { in: DEMO_ACCOUNTS.map((a) => a.email) }, isDemo: true, isActive: true },
      select: { email: true },
    })
    const found = new Set(existing.map((u) => u.email))
    return reply.send({
      accounts: DEMO_ACCOUNTS.filter((a) => found.has(a.email)).map((a) => ({
        role: a.role,
        label: a.label,
        email: a.email,
        password: DEMO_PASSWORD,
      })),
    })
  })

  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await authService.getMe(request.user!.userId)
    return reply.send({ user })
  })

  app.post('/forgot-password', { config: strictLimit }, async (request, reply) => {
    const { email } = ForgotPasswordSchema.parse(request.body)
    const result = await authService.forgotPassword(email)
    return reply.send(result)
  })

  app.post('/reset-password', { config: strictLimit }, async (request, reply) => {
    const { token, newPassword } = ResetPasswordSchema.parse(request.body)
    const result = await authService.resetPassword(token, newPassword)
    return reply.send(result)
  })
}
