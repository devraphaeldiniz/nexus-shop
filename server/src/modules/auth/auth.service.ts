import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../../config/prisma.js'
import { redis } from '../../config/redis.js'
import { sendMail } from '../../config/mail.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js'
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../../utils/errors.js'
import { RegisterInput, LoginInput, GoogleLoginInput } from './auth.schemas.js'

export class AuthService {
  async register(data: RegisterInput) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (existing) {
      throw new ConflictError('Este e-mail já está em uso na Nexus Shop')
    }

    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email.toLowerCase(),
        passwordHash,
        phone: data.phone,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    })

    // Gerar token de verificação por email (24 horas de validade)
    const verificationToken = crypto.randomBytes(32).toString('hex')
    await redis.setex(`verify:${verificationToken}`, 86400, user.id)

    // Envio assíncrono de boas-vindas
    sendMail({
      to: user.email,
      subject: 'Bem-vindo à Nexus Shop! Confirme sua conta',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #6366f1;">Olá, ${user.name}! 🚀</h2>
          <p>Obrigado por criar sua conta na <strong>Nexus Shop</strong>, sua loja de smartphones premium.</p>
          <p>Seu cadastro foi realizado com sucesso.</p>
        </div>
      `,
    }).catch(console.error)

    const payload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    await redis.setex(`refresh:${user.id}`, 7 * 86400, refreshToken)

    return { user, accessToken, refreshToken }
  }

  async login(data: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (!user || !user.passwordHash) {
      throw new UnauthorizedError('Credenciais inválidas')
    }

    if (!user.isActive) {
      throw new UnauthorizedError('Esta conta foi desativada. Contate o suporte.')
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash)
    if (!isMatch) {
      throw new UnauthorizedError('Credenciais inválidas')
    }

    const payload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    // Salvar token ativo em cache
    await redis.setex(`refresh:${user.id}`, 7 * 86400, refreshToken)

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    }
  }

  async refreshToken(token: string) {
    let payload
    try {
      payload = verifyRefreshToken(token)
    } catch {
      throw new UnauthorizedError('Refresh token expirado ou inválido')
    }

    const savedToken = await redis.get(`refresh:${payload.userId}`)
    if (!savedToken || savedToken !== token) {
      // Reuso indevido detectado: invalidar imediatamente por segurança
      await redis.del(`refresh:${payload.userId}`)
      throw new UnauthorizedError('Token revogado. Faça login novamente.')
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    if (!user || !user.isActive) {
      throw new UnauthorizedError('Usuário inexistente ou inativo')
    }

    const newPayload = { userId: user.id, email: user.email, role: user.role }
    const newAccessToken = generateAccessToken(newPayload)
    const newRefreshToken = generateRefreshToken(newPayload)

    // Rotação do refresh token
    await redis.setex(`refresh:${user.id}`, 7 * 86400, newRefreshToken)

    return { accessToken: newAccessToken, refreshToken: newRefreshToken }
  }

  async logout(userId: string) {
    await redis.del(`refresh:${userId}`)
    return { success: true }
  }

  async googleAuth(data: GoogleLoginInput) {
    let user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    })

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: data.email.toLowerCase(),
          name: data.name,
          googleId: data.googleId,
          avatar: data.avatar,
          emailVerified: true,
        },
      })
    } else if (!user.googleId) {
      user = await prisma.user.update({
        where: { id: user.id },
        data: { googleId: data.googleId, emailVerified: true },
      })
    }

    const payload = { userId: user.id, email: user.email, role: user.role }
    const accessToken = generateAccessToken(payload)
    const refreshToken = generateRefreshToken(payload)

    await redis.setex(`refresh:${user.id}`, 7 * 86400, refreshToken)

    return {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
      },
      accessToken,
      refreshToken,
    }
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Resposta idempotente para evitar enumeração de contas
    if (!user) {
      return { message: 'Se o e-mail estiver cadastrado, você receberá instruções em breve.' }
    }

    const rawToken = crypto.randomBytes(32).toString('hex')
    const hashedToken = crypto.createHash('sha256').update(rawToken).digest('hex')

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: new Date(Date.now() + 3600000), // 1 hora
      },
    })

    sendMail({
      to: user.email,
      subject: 'Nexus Shop — Redefinição de Senha',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2>Redefinição de Senha</h2>
          <p>Olá, ${user.name}. Recebemos uma solicitação para redefinir sua senha.</p>
          <p>Código de recuperação: <strong>${rawToken}</strong></p>
          <p>Este código expira em 1 hora.</p>
        </div>
      `,
    }).catch(console.error)

    return { message: 'Se o e-mail estiver cadastrado, você receberá instruções em breve.' }
  }

  async resetPassword(token: string, newPassword: string) {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await prisma.user.findFirst({
      where: {
        passwordResetToken: hashedToken,
        passwordResetExpires: { gte: new Date() },
      },
    })

    if (!user) {
      throw new BadRequestError('Token inválido ou expirado')
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    })

    // Invalida sessões anteriores
    await redis.del(`refresh:${user.id}`)

    return { message: 'Senha atualizada com sucesso!' }
  }

  async getMe(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        avatar: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        addresses: true,
      },
    })

    if (!user) throw new NotFoundError('Usuário não encontrado')
    return user
  }
}
