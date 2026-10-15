'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Smartphone, Lock, Mail, ArrowRight } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'

export default function LoginPage() {
  const router = useRouter()
  const { setAuth } = useAuthStore()

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include', // Envia e armazena cookies httpOnly
        body: JSON.stringify({ email, password }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || 'Credenciais inválidas. Verifique seu e-mail e senha.')
        setLoading(false)
        return
      }

      setAuth(data.user, data.accessToken || '', '')
      router.push(data.user.role === 'ADMIN' ? '/admin' : '/')
    } catch {
      setError('Falha na conexão com o servidor. Tente novamente mais tarde.')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center mx-auto text-white">
            <Smartphone className="w-5 h-5" />
          </div>
          <h1 className="text-xl font-bold text-white tracking-tight">Acessar Conta</h1>
          <p className="text-xs text-slate-400">Entre com seu e-mail e senha para continuar</p>
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-medium mb-1 block">E-mail</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-medium">Senha</label>
              <Link href="/forgot-password" className="text-indigo-400 hover:underline text-[11px]">Esqueceu a senha?</Link>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2.5 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-slate-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
          >
            <span>{loading ? 'Entrando...' : 'Entrar na Loja'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <p className="text-center text-xs text-slate-400 pt-2 border-t border-slate-800">
          Ainda não possui conta?{' '}
          <Link href="/register" className="text-indigo-400 font-semibold hover:underline">
            Criar conta
          </Link>
        </p>
      </div>
    </div>
  )
}
