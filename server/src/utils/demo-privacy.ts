import { DEMO_EMAILS } from '../config/demo.js'

/**
 * O admin de demonstração tem senha pública. Para não expor dados de clientes reais,
 * as respostas que ele recebe passam por esta máscara: e-mail, telefone, sobrenome e
 * endereço de quem não é conta demo aparecem ocultos. Produtos, valores e status seguem normais.
 */
const HIDDEN = '•••'

function maskEmail(email: string) {
  const [user, domain = ''] = email.split('@')
  return `${user.slice(0, 1)}${HIDDEN}@${domain.slice(0, 1)}${HIDDEN}`
}

function firstName(name: string) {
  const [first, ...rest] = name.trim().split(/\s+/)
  return rest.length > 0 ? `${first} ${rest[rest.length - 1].slice(0, 1)}.` : first
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object') return false
  const proto = Object.getPrototypeOf(value)
  return proto === Object.prototype || proto === null
}

export function maskPersonalData<T>(value: T): T {
  if (Array.isArray(value)) return value.map(maskPersonalData) as T
  if (!isPlainObject(value)) return value // Date, Decimal etc. seguem como estão

  const source = value as Record<string, unknown>
  const out: Record<string, unknown> = {}
  for (const [key, item] of Object.entries(source)) out[key] = maskPersonalData(item)

  // Pessoa: objeto com e-mail que não é de conta demo
  if (typeof source.email === 'string' && !DEMO_EMAILS.has(source.email)) {
    out.email = maskEmail(source.email)
    if (typeof source.name === 'string') out.name = firstName(source.name)
  }
  if (typeof source.phone === 'string' && source.phone) out.phone = HIDDEN

  // Endereço: objeto com CEP
  if (typeof source.zipCode === 'string') {
    for (const field of ['street', 'number', 'complement']) {
      if (typeof source[field] === 'string' && source[field]) out[field] = HIDDEN
    }
    out.zipCode = `${source.zipCode.slice(0, 2)}${HIDDEN}`
  }
  return out as T
}
