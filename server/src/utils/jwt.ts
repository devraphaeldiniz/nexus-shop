import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface TokenPayload {
  userId: string
  email: string
  role: 'CUSTOMER' | 'ADMIN'
  /** Conta de demonstração (senha pública): admin só lê, cliente não troca e-mail/senha. */
  demo?: boolean
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: '15m',
    issuer: 'nexus-shop-api',
  })
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: '7d',
    issuer: 'nexus-shop-api',
    // jti único: cada rotação gera um token diferente, mesmo no mesmo segundo
    jwtid: crypto.randomUUID(),
  })
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_ACCESS_SECRET, {
    issuer: 'nexus-shop-api',
  }) as TokenPayload
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.JWT_REFRESH_SECRET, {
    issuer: 'nexus-shop-api',
  }) as TokenPayload
}
