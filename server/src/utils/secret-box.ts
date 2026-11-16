import crypto from 'crypto'
import { env } from '../config/env.js'

const PREFIX = 'enc:v1:'
const MASK = '••••'

function key() {
  // Deriva 32 bytes de qualquer string forte
  return crypto.createHash('sha256').update(env.SETTINGS_ENCRYPTION_KEY).digest()
}

/** Criptografa um segredo para guardar no banco (AES-256-GCM, IV aleatório). */
export function encryptSecret(plain: string): string {
  const iv = crypto.randomBytes(12)
  const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv)
  const encrypted = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return PREFIX + Buffer.concat([iv, tag, encrypted]).toString('base64')
}

/**
 * Descriptografa um segredo do banco. Valores antigos em texto puro são devolvidos como estão
 * (passam a ser criptografados na próxima vez que o admin salvar as configurações).
 */
export function decryptSecret(stored: string | null | undefined): string | null {
  if (!stored) return null
  if (!stored.startsWith(PREFIX)) return stored

  try {
    const data = Buffer.from(stored.slice(PREFIX.length), 'base64')
    const iv = data.subarray(0, 12)
    const tag = data.subarray(12, 28)
    const encrypted = data.subarray(28)
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv)
    decipher.setAuthTag(tag)
    return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
  } catch {
    console.error('[settings] Não foi possível descriptografar um segredo. SETTINGS_ENCRYPTION_KEY mudou?')
    return null
  }
}

/** Mostra só o final do segredo (ex.: "••••a1b2") para o painel saber que há valor salvo. */
export function maskSecret(stored: string | null | undefined): string | null {
  const plain = decryptSecret(stored)
  if (!plain) return null
  return `${MASK}${plain.slice(-4)}`
}

/** true quando o valor recebido do painel é a máscara devolvida pelo GET (ou seja, não mudou). */
export function isMaskedValue(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.startsWith(MASK)
}
