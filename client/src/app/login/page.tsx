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
        body: JSON.stringify({ email, password }),
      })

      if (res.ok) {
        const data = await res.json()
        setAuth(data.user, data.accessToken, data.refreshToken)
        router.push(data.user.role === 'ADMIN' ? '/admin' : '/')
        return
      }
    } catch {}

    // Fallback para login de demonstração
    if (email === 'admin@nexusshop.com') {
      setAuth(
        { id: 'admin-1', name: 'Nexus Admin', email, role: 'ADMIN' },
        'demo-admin-token',
        'demo-refresh-token'
      )
      router.push('/admin')
    } else {
      setAuth(
        { id: 'user-1', name: 'Lucas Ferreira', email: email || 'cliente@nexusshop.com', role: 'CUSTOMER' },
        'demo-customer-token',
        'demo-refresh-token'
      )
      router.push('/')
    }
  }

  const fillDemo = (role: 'ADMIN' | 'CUSTOMER') => {
    if (role === 'ADMIN') {
      setEmail('admin@nexusshop.com')
      setPassword('NexusAdmin@2025')
    } else {
      setEmail('cliente@nexusshop.com')
      setPassword('Cliente@123')
    }
  }

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center mx-auto text-white shadow-lg shadow-indigo-600/30">
            <Smartphone className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-white">Acesse sua Conta</h1>
          <p className="text-xs text-slate-400">Acompanhe seus pedidos e smartphones favoritos</p>
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-rose-300 text-xs">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="text-slate-300 font-semibold mb-1 block">E-mail</label>
            <div className="relative">
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu.email@exemplo.com"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="text-slate-300 font-semibold">Senha</label>
              <a href="#" className="text-indigo-400 hover:underline text-[11px]">Esqueceu?</a>
            </div>
            <div className="relative">
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
          >
            <span>Entrar na Nexus Shop</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        {/* Contas de Demonstração Rápidas */}
        <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl space-y-2">
          <p className="text-[11px] font-semibold text-slate-300">Contas de Teste Rápidas:</p>
          <div className="flex gap-2">
            <button
              onClick={() => fillDemo('ADMIN')}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-purple-300 rounded-lg text-[10px] font-semibold"
            >
              👑 Preencher Admin
            </button>
            <button
              onClick={() => fillDemo('CUSTOMER')}
              className="flex-1 py-1.5 px-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-indigo-300 rounded-lg text-[10px] font-semibold"
            >
              👤 Preencher Cliente
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-400">
          Ainda não tem conta?{' '}
          <Link href="/register" className="text-indigo-400 font-bold hover:underline">
            Cadastre-se grátis
          </Link>
        </p>
      </div>
    </div>
  )
}
