import jwt from 'jsonwebtoken'
import { env } from '../config/env.js'

export interface TokenPayload {
  userId: string
  email: string
  role: 'CUSTOMER' | 'ADMIN'
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
