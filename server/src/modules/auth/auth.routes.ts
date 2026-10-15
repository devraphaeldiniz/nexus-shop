import { FastifyInstance } from 'fastify'
import { AuthService } from './auth.service.js'
import {
  RegisterSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  GoogleLoginSchema,
} from './auth.schemas.js'
import { authenticate } from '../../middlewares/auth.middleware.js'
import { prisma } from '../../config/prisma.js'

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService()

  // Status de Setup Inicial da Loja (verifica se o primeiro admin precisa ser criado)
  app.get('/setup-status', async (_request, reply) => {
    const adminCount = await prisma.user.count({ where: { role: 'ADMIN' } })
    return reply.send({ needsSetup: adminCount === 0 })
  })

  app.post('/register', async (request, reply) => {
    const data = RegisterSchema.parse(request.body)
    const result = await authService.register(data)

    // Configurar cookies httpOnly seguros
    reply.setCookie('access_token', result.accessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60, // 15 minutos
    })

    reply.setCookie('refresh_token', result.refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60, // 7 dias
    })

    return reply.status(201).send({ user: result.user })
  })

  app.post('/login', async (request, reply) => {
    const data = LoginSchema.parse(request.body)
    const result = await authService.login(data)

    reply.setCookie('access_token', result.accessToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 15 * 60,
    })

    reply.setCookie('refresh_token', result.refreshToken, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60,
    })

    return reply.send({ user: result.user, accessToken: result.accessToken })
  })

  app.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    await authService.logout(request.user!.userId)

    reply.clearCookie('access_token', { path: '/' })
    reply.clearCookie('refresh_token', { path: '/' })

    return reply.send({ success: true, message: 'Sessão encerrada com segurança' })
  })

  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await authService.getMe(request.user!.userId)
    return reply.send({ user })
  })

  app.post('/forgot-password', async (request, reply) => {
    const { email } = ForgotPasswordSchema.parse(request.body)
    const result = await authService.forgotPassword(email)
    return reply.send(result)
  })

  app.post('/reset-password', async (request, reply) => {
    const { token, newPassword } = ResetPasswordSchema.parse(request.body)
    const result = await authService.resetPassword(token, newPassword)
    return reply.send(result)
  })
}
