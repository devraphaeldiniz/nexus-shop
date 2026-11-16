import crypto from 'crypto'
import { UnauthorizedError } from './errors.js'

/**
 * Valida o header x-signature do Mercado Pago (HMAC-SHA256).
 * Manifesto oficial: "id:<data.id>;request-id:<x-request-id>;ts:<ts>;"
 * (data.id alfanumérico vai em minúsculas). Comparação em tempo constante.
 */
export function verifyMercadoPagoSignature(
  secret: string,
  dataId: string,
  xSignature?: string,
  xRequestId?: string
): void {
  if (!xSignature || !xRequestId) {
    throw new UnauthorizedError('Assinatura do webhook Mercado Pago ausente.')
  }

  let ts = ''
  let hash = ''
  for (const part of xSignature.split(',')) {
    const [key, value] = part.split('=').map((s) => s?.trim())
    if (key === 'ts') ts = value ?? ''
    if (key === 'v1') hash = value ?? ''
  }
  if (!ts || !hash) {
    throw new UnauthorizedError('Assinatura do webhook Mercado Pago malformada.')
  }

  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId
  const manifest = `id:${id};request-id:${xRequestId};ts:${ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  const received = Buffer.from(hash, 'hex')
  const wanted = Buffer.from(expected, 'hex')
  if (received.length !== wanted.length || !crypto.timingSafeEqual(received, wanted)) {
    throw new UnauthorizedError('Assinatura do webhook Mercado Pago inválida.')
  }
}
