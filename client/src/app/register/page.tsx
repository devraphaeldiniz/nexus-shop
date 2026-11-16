'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '../../store/useAuthStore'
import { apiFetch } from '../../lib/api'
import { getSafeNext } from '../../lib/navigation'
import { AuthShell } from '../../components/auth/AuthShell'
import type { User } from '../../types'

export default function RegisterPage() {
  const router = useRouter()
  const { setUser } = useAuthStore()

  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await apiFetch<{ user: User }>('/auth/register', {
        method: 'POST',
        body: { name, email, phone: phone || undefined, password },
      })
      setUser(data.user)
      router.push(getSafeNext('/'))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível criar a conta. Tente de novo.')
      setLoading(false)
    }
  }

  return (
    <AuthShell
      title="Criar conta"
      subtitle="Leva menos de um minuto."
      footer={
        <>
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold text-ink underline underline-offset-4">
            Entrar
          </Link>
        </>
      }
    >
      {error && <p className="notice-error mb-5">{error}</p>}
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="name" className="field-label">Nome completo</label>
          <input id="name" type="text" required autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex: Lucas Ferreira" className="field" />
        </div>
        <div>
          <label htmlFor="email" className="field-label">E-mail</label>
          <input id="email" type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu.email@exemplo.com" className="field" />
        </div>
        <div>
          <label htmlFor="phone" className="field-label">
            WhatsApp <span className="font-normal text-graphite">(opcional)</span>
          </label>
          <input id="phone" type="tel" autoComplete="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(31) 98765-4321" className="field" />
        </div>
        <div>
          <label htmlFor="password" className="field-label">Senha</label>
          <input id="password" type="password" required minLength={8} autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="8+ caracteres, maiúscula, minúscula e número" className="field" />
        </div>
        <button type="submit" disabled={loading} className="btn-primary w-full py-3">
          {loading ? 'Criando conta...' : 'Criar conta'}
        </button>
      </form>
    </AuthShell>
  )
}
