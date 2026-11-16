import { FastifyReply } from 'fastify'
import { CookieSerializeOptions } from '@fastify/cookie'
import { env } from '../config/env.js'

export const ACCESS_COOKIE = 'access_token'
export const REFRESH_COOKIE = 'refresh_token'

const ACCESS_MAX_AGE = 15 * 60 // 15 minutos (igual ao expiresIn do access token)
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 // 7 dias
/** O refresh token só trafega nas rotas de auth (refresh/logout). */
const REFRESH_PATH = '/api/v1/auth'

function baseOptions(): CookieSerializeOptions {
  const sameSite = env.COOKIE_SAME_SITE
  return {
    httpOnly: true,
    // SameSite=None exige Secure; em produção sempre Secure
    secure: env.NODE_ENV === 'production' || sameSite === 'none',
    sameSite,
    ...(env.COOKIE_DOMAIN ? { domain: env.COOKIE_DOMAIN } : {}),
  }
}

export function setAuthCookies(reply: FastifyReply, accessToken: string, refreshToken: string) {
  reply.setCookie(ACCESS_COOKIE, accessToken, { ...baseOptions(), path: '/', maxAge: ACCESS_MAX_AGE })
  reply.setCookie(REFRESH_COOKIE, refreshToken, { ...baseOptions(), path: REFRESH_PATH, maxAge: REFRESH_MAX_AGE })
}

export function clearAuthCookies(reply: FastifyReply) {
  reply.clearCookie(ACCESS_COOKIE, { ...baseOptions(), path: '/' })
  reply.clearCookie(REFRESH_COOKIE, { ...baseOptions(), path: REFRESH_PATH })
  // Remove também o refresh antigo, que era gravado com path "/"
  reply.clearCookie(REFRESH_COOKIE, { ...baseOptions(), path: '/' })
}
