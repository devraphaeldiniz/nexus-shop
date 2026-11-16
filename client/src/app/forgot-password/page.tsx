'use client'

import { FormEvent, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { AuthShell } from '../../components/auth/AuthShell'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSending(true)
    // A resposta é sempre a mesma (não revela se o e-mail existe)
    await apiFetch('/auth/forgot-password', { method: 'POST', body: { email } }).catch(() => undefined)
    setSent(true)
    setSending(false)
  }

  return (
    <AuthShell
      title="Recuperar senha"
      subtitle="Enviamos um link para você criar uma senha nova."
      back={{ href: '/login', label: 'Voltar para Entrar' }}
    >
      {sent ? (
        <p className="notice-ok">
          Se {email} tiver conta aqui, o link chega em alguns minutos. Ele vale por 1 hora. Confira também o spam.
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          <div>
            <label htmlFor="email" className="field-label">E-mail da conta</label>
            <input id="email" required type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.email@exemplo.com" className="field" />
          </div>
          <button disabled={sending} className="btn-primary w-full py-3" type="submit">
            {sending ? 'Enviando...' : 'Enviar link'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
