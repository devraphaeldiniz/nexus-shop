import crypto from 'crypto'
import { describe, it, expect } from 'vitest'
import { verifyMercadoPagoSignature } from '../../src/utils/mercadopago-signature.js'

const SECRET = 'segredo-de-teste'

function sign(dataId: string, requestId: string, ts: string) {
  const v1 = crypto
    .createHmac('sha256', SECRET)
    .update(`id:${dataId};request-id:${requestId};ts:${ts};`)
    .digest('hex')
  return `ts=${ts},v1=${v1}`
}

describe('verifyMercadoPagoSignature', () => {
  it('aceita assinatura válida', () => {
    expect(() =>
      verifyMercadoPagoSignature(SECRET, '123456', sign('123456', 'req-1', '1700000000'), 'req-1')
    ).not.toThrow()
  })

  it('usa o data.id alfanumérico em minúsculas', () => {
    expect(() =>
      verifyMercadoPagoSignature(SECRET, 'ABC123', sign('abc123', 'req-1', '1700000000'), 'req-1')
    ).not.toThrow()
  })

  it('rejeita assinatura de outro pagamento', () => {
    expect(() =>
      verifyMercadoPagoSignature(SECRET, '999', sign('123456', 'req-1', '1700000000'), 'req-1')
    ).toThrow('inválida')
  })

  it('rejeita quando os headers não vêm', () => {
    expect(() => verifyMercadoPagoSignature(SECRET, '123', undefined, undefined)).toThrow('ausente')
  })

  it('rejeita header malformado', () => {
    expect(() => verifyMercadoPagoSignature(SECRET, '123', 'lixo', 'req-1')).toThrow('malformada')
  })
})
