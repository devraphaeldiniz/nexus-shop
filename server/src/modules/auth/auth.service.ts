import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import { prisma } from '../../config/prisma.js'
import { sendMail } from '../../config/mail.js'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/jwt.js'
import {
  ConflictError,
  ForbiddenError,
  UnauthorizedError,
  NotFoundError,
  BadRequestError,
} from '../../utils/errors.js'
import { RegisterInput, LoginInput, SetupInput } from './auth.schemas.js'
import { env } from '../../config/env.js'
import { escapeHtml } from '../../utils/html.js'
import { consumeSession, endSession, revokeAllSessions, saveSession } from './sessions.js'

type SessionUser = { id: string; email: string; role: 'CUSTOMER' | 'ADMIN'; isDemo: boolean }

/** Dados que vão dentro do JWT. `demo` só aparece nas contas de demonstração. */
function tokenPayload(user: SessionUser) {
  return { userId: user.id, email: user.email, role: user.role, ...(user.isDemo ? { demo: true } : {}) }
}

/** Gera access + refresh token e registra a sessão. */
async function startSession(user: SessionUser) {
  const payload = tokenPayload(user)
  const accessToken = generateAccessToken(payload)
  const refreshToken = generateRefreshToken(payload)
  await saveSession(user.id, refreshToken)
  return { accessToken, refreshToken }
}

function publicUser(user: SessionUser & { name: string; avatar: string | null }) {
  return { id: user.id, name: user.name, email: user.email, role: user.role, avatar: user.avatar, isDemo: user.isDemo }
}

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
        isDemo: true,
        createdAt: true,
      },
    })

    // Envio assíncrono de boas-vindas
    sendMail({
      to: user.email,
      subject: 'Bem-vindo à Nexus Shop! Confirme sua conta',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
          <h2 style="color: #6366f1;">Olá, ${escapeHtml(user.name)}! 🚀</h2>
          <p>Obrigado por criar sua conta na <strong>Nexus Shop</strong>, sua loja de smartphones premium.</p>
          <p>Seu cadastro foi realizado com sucesso.</p>
        </div>
      `,
    }).catch(console.error)

    const { accessToken, refreshToken } = await startSession(user)

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

    // Contas de demonstração só entram quando o modo demo está ligado (DEMO_ACCOUNTS)
    if (user.isDemo && !env.DEMO_ACCOUNTS) {
      throw new UnauthorizedError('Credenciais inválidas')
    }

    const isMatch = await bcrypt.compare(data.password, user.passwordHash)
    if (!isMatch) {
      throw new UnauthorizedError('Credenciais inválidas')
    }

    const { accessToken, refreshToken } = await startSession(user)

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    })

    return { user: publicUser(user), accessToken, refreshToken }
  }

  async refreshToken(token: string) {
    let payload
    try {
      payload = verifyRefreshToken(token)
    } catch {
      throw new UnauthorizedError('Refresh token expirado ou inválido')
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
    })

    const valid = await consumeSession(payload.userId, token)
    if (!valid) {
      // Reuso de um refresh já usado: sinal de roubo, derruba todas as sessões da conta.
      // Nas contas demo isso derrubaria outros visitantes, então só recusa este token.
      if (!user?.isDemo) await revokeAllSessions(payload.userId)
      throw new UnauthorizedError('Token revogado. Faça login novamente.')
    }

    if (!user || !user.isActive || (user.isDemo && !env.DEMO_ACCOUNTS)) {
      throw new UnauthorizedError('Usuário inexistente ou inativo')
    }

    // Rotação do refresh token
    const { accessToken, refreshToken } = await startSession(user)

    return { user: publicUser(user), accessToken, refreshToken }
  }

  /** Encerra só esta sessão; as outras (outros aparelhos) continuam. */
  async logout(userId: string, refreshToken: string) {
    await endSession(userId, refreshToken)
    return { success: true }
  }

  /**
   * Cria o primeiro administrador da loja. Só funciona enquanto não existir nenhum ADMIN.
   * Se SETUP_TOKEN estiver definido no ambiente, ele é obrigatório.
   */
  async setupFirstAdmin(data: SetupInput) {
    if (env.SETUP_TOKEN) {
      const given = Buffer.from(data.setupToken ?? '')
      const expected = Buffer.from(env.SETUP_TOKEN)
      if (given.length !== expected.length || !crypto.timingSafeEqual(given, expected)) {
        throw new ForbiddenError('Token de configuração inválido')
      }
    }

    const email = data.email.toLowerCase()
    const passwordHash = await bcrypt.hash(data.password, 12)

    const user = await prisma.$transaction(async (tx) => {
      // Trava global: duas requisições simultâneas não criam dois administradores
      await tx.$executeRaw`SELECT pg_advisory_xact_lock(724001)`

      const adminCount = await tx.user.count({ where: { role: 'ADMIN' } })
      if (adminCount > 0) {
        throw new ForbiddenError('A loja já possui um administrador')
      }

      const existing = await tx.user.findUnique({ where: { email } })
      if (existing) {
        throw new ConflictError('Este e-mail já está em uso. Use outro para o administrador.')
      }

      const admin = await tx.user.create({
        data: { name: data.name, email, passwordHash, role: 'ADMIN', emailVerified: true },
      })

      await tx.storeSettings.upsert({
        where: { id: 'default' },
        update: {},
        create: { id: 'default' },
      })

      return admin
    })

    const { accessToken, refreshToken } = await startSession(user)

    return { user: publicUser(user), accessToken, refreshToken }
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    })

    // Resposta idempotente para evitar enumeração de contas.
    // Contas demo têm senha pública e não recebem e-mail de troca.
    if (!user || user.isDemo) {
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

    const resetUrl = `${env.FRONTEND_URL.replace(/\/$/, '')}/reset-password?token=${rawToken}`

    sendMail({
      to: user.email,
      subject: 'Nexus Shop — Redefinição de Senha',
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px;">
          <h2>Redefinição de Senha</h2>
          <p>Olá, ${escapeHtml(user.name)}. Recebemos uma solicitação para redefinir sua senha.</p>
          <p><a href="${resetUrl}" style="display:inline-block;padding:10px 18px;background:#6366f1;color:#fff;border-radius:8px;text-decoration:none;">Criar nova senha</a></p>
          <p style="font-size:12px;color:#64748b;">Se o botão não funcionar, copie este endereço no navegador:<br>${resetUrl}</p>
          <p style="font-size:12px;color:#64748b;">Se você não pediu a troca, ignore este e-mail.</p>
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
    await revokeAllSessions(user.id)

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
        isDemo: true,
        emailVerified: true,
        createdAt: true,
        addresses: { where: { archivedAt: null }, orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }] },
      },
    })

    if (!user) throw new NotFoundError('Usuário não encontrado')
    return user
  }
}
