'use client'

import { FormEvent, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)

  async function submit(event: FormEvent) {
    event.preventDefault()
    const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    await fetch(`${api}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    }).catch(() => undefined)
    setSent(true)
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 space-y-6 animate-fade-up">
        <div>
          <Link href="/login" className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white">
            <ArrowLeft className="w-3.5 h-3.5" /> Voltar para o login
          </Link>
          <h1 className="mt-6 text-xl font-bold text-white">Recuperar senha</h1>
          <p className="mt-1 text-xs text-slate-400">Informe seu e-mail para receber as instruções.</p>
        </div>
        {sent ? (
          <p className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-3 text-xs text-emerald-300">
            Se o e-mail estiver cadastrado, enviaremos as instruções de recuperação.
          </p>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-500" />
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="seu@email.com" className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500" />
            </div>
            <button className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50" type="submit">Enviar instruções</button>
          </form>
        )}
      </div>
    </div>
  )
}
