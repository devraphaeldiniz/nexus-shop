import { FastifyInstance } from 'fastify'
import { AuthService } from './auth.service.js'
import {
  RegisterSchema,
  LoginSchema,
  RefreshTokenSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
  GoogleLoginSchema,
} from './auth.schemas.js'
import { authenticate } from '../../middlewares/auth.middleware.js'

export async function authRoutes(app: FastifyInstance) {
  const authService = new AuthService()

  app.post('/register', async (request, reply) => {
    const data = RegisterSchema.parse(request.body)
    const result = await authService.register(data)
    return reply.status(201).send(result)
  })

  app.post('/login', async (request, reply) => {
    const data = LoginSchema.parse(request.body)
    const result = await authService.login(data)
    return reply.send(result)
  })

  app.post('/refresh', async (request, reply) => {
    const { refreshToken } = RefreshTokenSchema.parse(request.body)
    const result = await authService.refreshToken(refreshToken)
    return reply.send(result)
  })

  app.post('/logout', { preHandler: [authenticate] }, async (request, reply) => {
    const result = await authService.logout(request.user!.userId)
    return reply.send(result)
  })

  app.post('/google', async (request, reply) => {
    const data = GoogleLoginSchema.parse(request.body)
    const result = await authService.googleAuth(data)
    return reply.send(result)
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

  app.get('/me', { preHandler: [authenticate] }, async (request, reply) => {
    const user = await authService.getMe(request.user!.userId)
    return reply.send({ user })
  })
}
