import { describe, it, expect } from 'vitest'
import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
} from '../../src/utils/jwt.js'

describe('JWT Utilities', () => {
  const mockPayload = {
    userId: 'user_123',
    email: 'teste@nexusshop.com',
    role: 'CUSTOMER' as const,
  }

  it('deve gerar e verificar um Access Token válido', () => {
    const token = generateAccessToken(mockPayload)
    expect(typeof token).toBe('string')
    expect(token.split('.')).toHaveLength(3)

    const decoded = verifyAccessToken(token)
    expect(decoded.userId).toBe(mockPayload.userId)
    expect(decoded.email).toBe(mockPayload.email)
    expect(decoded.role).toBe(mockPayload.role)
  })

  it('deve gerar e verificar um Refresh Token válido', () => {
    const token = generateRefreshToken(mockPayload)
    expect(typeof token).toBe('string')

    const decoded = verifyRefreshToken(token)
    expect(decoded.userId).toBe(mockPayload.userId)
  })

  it('deve falhar ao verificar token adulterado', () => {
    const token = generateAccessToken(mockPayload)
    const tampered = token.slice(0, -5) + 'abcde'

    expect(() => verifyAccessToken(tampered)).toThrow()
  })
})
