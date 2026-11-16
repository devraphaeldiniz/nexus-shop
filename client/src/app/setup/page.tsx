'use client'

import { FormEvent, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { apiFetch } from '../../lib/api'
import { useAuthStore } from '../../store/useAuthStore'
import { AuthShell } from '../../components/auth/AuthShell'
import { User } from '../../types'

/** Criação do primeiro administrador. Só funciona enquanto a loja não tiver nenhum admin. */
export default function SetupPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()

  const [status, setStatus] = useState<{ needsSetup: boolean; requiresToken: boolean } | null>(null)
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', setupToken: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    apiFetch<{ needsSetup: boolean; requiresToken: boolean }>('/auth/setup-status')
      .then(setStatus)
      .catch(() => setError('A API não respondeu. Confira se ela está no ar.'))
  }, [])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      setError('As duas senhas precisam ser iguais.')
      return
    }
    setLoading(true)
    try {
      const data = await apiFetch<{ user: User }>('/auth/setup', {
        method: 'POST',
        body: { name: form.name, email: form.email, password: form.password, setupToken: form.setupToken || undefined },
      })
      setUser(data.user)
      router.push('/admin')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar o administrador.')
      setLoading(false)
    }
  }

  const input = (key: keyof typeof form, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={key} className="field-label">{label}</label>
      <input id={key} required className="field" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} {...props} />
    </div>
  )

  return (
    <AuthShell title="Configurar a loja" subtitle="Crie a conta de quem vai administrar a Nexus Shop.">
      {error && <p className="notice-error mb-5">{error}</p>}
      {status && !status.needsSetup ? (
        <p className="text-graphite">
          A loja já está configurada. <Link href="/login" className="font-semibold text-ink underline">Entrar</Link>
        </p>
      ) : (
        <form onSubmit={submit} className="space-y-5">
          {input('name', 'Seu nome', { autoComplete: 'name' })}
          {input('email', 'E-mail', { type: 'email', autoComplete: 'email' })}
          {input('password', 'Senha', { type: 'password', autoComplete: 'new-password', minLength: 8 })}
          {input('confirm', 'Repita a senha', { type: 'password', autoComplete: 'new-password', minLength: 8 })}
          {status?.requiresToken && input('setupToken', 'Token de configuração')}
          <p className="text-xs text-graphite">Senha com 8+ caracteres, maiúscula, minúscula e número.</p>
          <button disabled={loading || !status} className="btn-primary w-full py-3" type="submit">
            {loading ? 'Criando...' : 'Criar administrador'}
          </button>
        </form>
      )}
    </AuthShell>
  )
}
