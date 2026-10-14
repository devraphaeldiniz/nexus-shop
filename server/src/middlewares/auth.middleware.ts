import { FastifyRequest, FastifyReply } from 'fastify'
import { verifyAccessToken, TokenPayload } from '../utils/jwt.js'
import { UnauthorizedError, ForbiddenError } from '../utils/errors.js'

declare module 'fastify' {
  interface FastifyRequest {
    user?: TokenPayload
  }
}

export async function authenticate(request: FastifyRequest, _reply: FastifyReply) {
  const authHeader = request.headers.authorization

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new UnauthorizedError('Token de autenticação não fornecido')
  }

  const token = authHeader.substring(7)

  try {
    const payload = verifyAccessToken(token)
    request.user = payload
  } catch (error) {
    throw new UnauthorizedError('Token de autenticação inválido ou expirado')
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
  }
}
