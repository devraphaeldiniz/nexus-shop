import jwt from 'jsonwebtoken'
import { redis } from '../../config/redis.js'

/**
 * Sessões de refresh token: uma chave por sessão (refresh:<userId>:<jti>).
 * Assim a mesma conta pode estar aberta em vários aparelhos — e várias pessoas
 * podem usar as contas de demonstração ao mesmo tempo sem derrubar umas às outras.
 */
const SESSION_TTL_SECONDS = 7 * 86400

function sessionKey(userId: string, token: string) {
  const decoded = jwt.decode(token) as { jti?: string } | null
  if (!decoded?.jti) throw new Error('Refresh token sem identificador (jti)')
  return `refresh:${userId}:${decoded.jti}`
}

export async function saveSession(userId: string, refreshToken: string) {
  await redis.setex(sessionKey(userId, refreshToken), SESSION_TTL_SECONDS, refreshToken)
}

/** Usa a sessão uma única vez (rotação). Devolve false se ela não existe mais. */
export async function consumeSession(userId: string, refreshToken: string): Promise<boolean> {
  const key = sessionKey(userId, refreshToken)
  const saved = await redis.get(key)
  if (saved !== refreshToken) return false
  await redis.del(key)
  return true
}

export async function endSession(userId: string, refreshToken: string) {
  await redis.del(sessionKey(userId, refreshToken))
}

/** Derruba todas as sessões da conta (troca de senha, reuso de token). */
export async function revokeAllSessions(userId: string) {
  await redis.delByPrefix(`refresh:${userId}:`)
  await redis.del(`refresh:${userId}`) // formato antigo, de antes das sessões múltiplas
}
