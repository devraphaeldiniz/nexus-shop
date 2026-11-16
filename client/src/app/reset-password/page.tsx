'use client'

import { FormEvent, Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { apiFetch } from '../../lib/api'
import { AuthShell } from '../../components/auth/AuthShell'

function ResetPasswordForm() {
  const router = useRouter()
  const token = useSearchParams().get('token') || ''

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('As duas senhas precisam ser iguais.')
      return
    }
    setLoading(true)
    try {
      await apiFetch('/auth/reset-password', { method: 'POST', body: { token, newPassword: password } })
      setDone(true)
      setTimeout(() => router.push('/login'), 2500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar a senha.')
    } finally {
      setLoading(false)
    }
  }

  if (!token) {
    return (
      <p className="notice-warn">
        Este link está incompleto. <Link href="/forgot-password" className="font-semibold underline">Peça um novo link</Link>.
      </p>
    )
  }

  if (done) {
    return <p className="notice-ok">Senha salva. Levando você para Entrar...</p>
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      {error && <p className="notice-error">{error}</p>}
      <div>
        <label htmlFor="password" className="field-label">Nova senha</label>
        <input id="password" required type="password" autoComplete="new-password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="field" />
        <p className="mt-1.5 text-xs text-graphite">8+ caracteres, com maiúscula, minúscula e número.</p>
      </div>
      <div>
        <label htmlFor="confirm" className="field-label">Repita a nova senha</label>
        <input id="confirm" required type="password" autoComplete="new-password" minLength={8} value={confirm} onChange={(e) => setConfirm(e.target.value)} className="field" />
      </div>
      <button disabled={loading} className="btn-primary w-full py-3" type="submit">
        {loading ? 'Salvando...' : 'Salvar nova senha'}
      </button>
    </form>
  )
}

export default function ResetPasswordPage() {
  return (
    <AuthShell title="Nova senha" back={{ href: '/login', label: 'Voltar para Entrar' }}>
      <Suspense fallback={<p className="text-graphite">Carregando...</p>}>
        <ResetPasswordForm />
      </Suspense>
    </AuthShell>
  )
}
