'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/useAuthStore'
import { apiFetch } from '../../lib/api'
import { getSafeNext } from '../../lib/navigation'
import { AuthShell } from '../../components/auth/AuthShell'
import { User } from '../../types'

type DemoAccount = { role: 'CUSTOMER' | 'ADMIN'; label: string; email: string; password: string }

export default function LoginPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [needsSetup, setNeedsSetup] = useState(false)
  const [demoAccounts, setDemoAccounts] = useState<DemoAccount[]>([])

  useEffect(() => {
    apiFetch<{ needsSetup: boolean }>('/auth/setup-status')
      .then((data) => setNeedsSetup(data.needsSetup))
      .catch(() => undefined)
    apiFetch<{ accounts: DemoAccount[] }>('/auth/demo-accounts')
      .then((data) => setDemoAccounts(data.accounts || []))
      .catch(() => undefined)
  }, [])

  const signIn = async (credentials: { email: string; password: string }) => {
    setError('')
    setLoading(true)
    try {
      const data = await apiFetch<{ user: User }>('/auth/login', { method: 'POST', body: credentials })
      setUser(data.user)
      router.push(getSafeNext(data.user.role === 'ADMIN' ? '/admin' : '/'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível conectar. Tente de novo.')
      setLoading(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    signIn({ email, password })
  }

  return (
    <AuthShell
      title="Entrar"
      subtitle="Acompanhe pedidos e finalize compras mais rápido."
      footer={
        <>
          Primeira vez aqui?{' '}
          <Link href="/register" className="font-semibold text-ink underline underline-offset-4">
            Criar conta
          </Link>
        </>
      }
    >
      {needsSetup && (
        <p className="notice-warn mb-5">
          Esta loja ainda não tem administrador. <Link href="/setup" className="font-semibold underline">Configurar a loja</Link>
        </p>
      )}
      {error && <p className="notice-error mb-5">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="email" className="field-label">E-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.email@exemplo.com" className="field" />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium">Senha</label>
            <Link href="/forgot-password" className="text-sm text-graphite underline-offset-4 hover:text-ink hover:underline">
              Esqueci a senha
            </Link>
          </div>
          <input id="password" type="password" required autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="field" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      {demoAccounts.length > 0 && (
        <section aria-labelledby="demo-title" className="mt-8 rounded-2xl border border-line bg-paper/70 p-5">
          <h2 id="demo-title" className="font-display text-lg font-bold">Quer só conhecer a loja?</h2>
          <p className="mt-1 text-sm text-graphite">
            Use uma conta de demonstração. O painel do administrador é somente leitura.
          </p>
          <ul className="mt-4 space-y-3">
            {demoAccounts.map((account) => (
              <li key={account.email} className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0 text-sm">
                  <p className="font-semibold">{account.label}</p>
                  <p className="truncate text-graphite">{account.email}</p>
                  <p className="text-graphite">
                    Senha: <span className="font-medium text-ink">{account.password}</span>
                  </p>
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => signIn({ email: account.email, password: account.password })}
                  className="btn-ghost shrink-0"
                >
                  Entrar como {account.role === 'ADMIN' ? 'admin' : 'cliente'}
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </AuthShell>
  )
}
