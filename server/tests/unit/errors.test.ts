import { describe, it, expect } from 'vitest'
import {
  AppError,
  NotFoundError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  ConflictError,
} from '../../src/utils/errors.js'

describe('Custom Error Classes', () => {
  it('NotFoundError deve ter status 404', () => {
    const error = new NotFoundError('Smartphone não encontrado')
    expect(error.statusCode).toBe(404)
    expect(error.message).toBe('Smartphone não encontrado')
    expect(error).toBeInstanceOf(AppError)
  })

  it('UnauthorizedError deve ter status 401', () => {
    const error = new UnauthorizedError()
    expect(error.statusCode).toBe(401)
  })

  it('ForbiddenError deve ter status 403', () => {
    const error = new ForbiddenError()
    expect(error.statusCode).toBe(403)
  })

  it('ConflictError deve ter status 409', () => {
    const error = new ConflictError()
    expect(error.statusCode).toBe(409)
  })

  it('BadRequestError deve ter status 400', () => {
    const error = new BadRequestError()
    expect(error.statusCode).toBe(400)
  })
})
