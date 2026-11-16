import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js'
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload
  }
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  let token: string | undefined

  // 1. Prioriza Cookie httpOnly seguro
  const cookieToken = request.cookies?.access_token
  if (cookieToken) {
    token = cookieToken
  } else {
    // 2. Fallback para header Authorization se fornecido
    const authHeader = request.headers.authorization
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7)
    }
  }

  if (!token) {
    throw new UnauthorizedError('Sessão expirada ou não autenticada')
  }

  try {
    const payload = verifyAccessToken(token)
    request.user = payload
  } catch {
    throw new UnauthorizedError('Sessão inválida ou expirada. Faça login novamente.')
  }
}

export function authorize(...allowedRoles: Array<'CUSTOMER' | 'ADMIN'>) {
  return async (request: FastifyRequest, _reply: FastifyReply) => {
    if (!request.user) {
      throw new UnauthorizedError('Autenticação necessária')
    }

    if (!allowedRoles.includes(request.user.role)) {
      throw new ForbiddenError('Acesso negado: privilégios insuficientes')
    }

    // Admin de demonstração vê o painel inteiro, mas não altera nada
    if (request.user.demo && allowedRoles.includes('ADMIN') && !['GET', 'HEAD'].includes(request.method)) {
      throw new ForbiddenError('Conta de demonstração: o painel é somente leitura.')
    }
  }
}
