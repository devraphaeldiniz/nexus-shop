'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Smartphone,
  ShoppingCart,
  User as UserIcon,
  Search,
  Menu,
  X,
  ShieldCheck,
  LogOut,
  Sliders,
} from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'

export function Navbar() {
  const router = useRouter()
  const { totalItems, setIsOpen } = useCartStore()
  const { user, isAuthenticated, logout } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
      setIsMobileMenuOpen(false)
    }
  }

  return (
    <>
      {/* Barra superior de avisos */}
      <div className="bg-slate-950 border-b border-slate-800 text-slate-300 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Smartphones 100% Originais · Garantia Nacional de 12 Meses</span>
          </div>
          <div className="hidden md:flex gap-4">
            <span className="text-emerald-400 font-medium">⚡ Frete Grátis acima de R$ 3.000</span>
            <span>Até 12x Sem Juros no Cartão ou 10% OFF no PIX</span>
          </div>
        </div>
      </div>

      {/* Header Principal */}
      <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform">
              <Smartphone className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-black tracking-tight text-white">
                NEXUS<span className="text-indigo-400">SHOP</span>
              </span>
              <span className="hidden sm:block text-[10px] text-slate-400 tracking-widest uppercase font-semibold">
                Smartphones Premium
              </span>
            </div>
          </Link>

          {/* Busca (Desktop) */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-md relative items-center"
          >
            <input
              type="text"
              placeholder="Buscar iPhone, Galaxy, Xiaomi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-800/80 border border-slate-700 rounded-full py-2.5 pl-11 pr-4 text-sm text-white placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-4" />
          </form>

          {/* Links e Ações */}
          <div className="flex items-center gap-3">
            <Link
              href="/products"
              className="hidden lg:inline-flex text-sm font-medium text-slate-300 hover:text-white transition-colors px-3 py-2 rounded-lg hover:bg-slate-800"
            >
              Catálogo Completo
            </Link>

            {/* Link Admin (se for admin) */}
            {mounted && user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className="hidden sm:inline-flex items-center gap-1.5 text-xs font-semibold bg-purple-900/60 text-purple-200 border border-purple-700/60 px-3 py-1.5 rounded-lg hover:bg-purple-800/80 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                Painel Admin
              </Link>
            )}

            {/* Menu Usuário */}
            {mounted && isAuthenticated ? (
              <div className="flex items-center gap-2 border-l border-slate-700 pl-3">
                <div className="hidden sm:block text-right">
                  <p className="text-xs font-semibold text-white truncate max-w-[120px]">
                    {user?.name.split(' ')[0]}
                  </p>
                  <p className="text-[10px] text-slate-400">Cliente Nexus</p>
                </div>
                <button
                  onClick={() => logout()}
                  title="Sair da conta"
                  className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-full transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="inline-flex items-center gap-2 text-sm font-medium text-slate-200 hover:text-white bg-slate-800 hover:bg-slate-700 px-3.5 py-2 rounded-full border border-slate-700 transition-colors"
              >
                <UserIcon className="w-4 h-4 text-indigo-400" />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
            )}

            {/* Botão Carrinho com Badge */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full transition-all shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-5 h-5" />
              {mounted && totalItems() > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-slate-900 shadow">
                  {totalItems()}
                </span>
              )}
            </button>

            {/* Botão Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile Expandido */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 px-4 pt-3 pb-6 bg-slate-900 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Buscar smartphones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg py-2 pl-10 pr-4 text-sm text-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>

            <div className="flex flex-col gap-2 font-medium text-slate-300">
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800"
              >
                📱 Todos os Smartphones
              </Link>
              <Link
                href="/products?brand=Apple"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800"
              >
                🍎 Linha Apple iPhone
              </Link>
              <Link
                href="/products?brand=Samsung"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-slate-800"
              >
                🌌 Linha Samsung Galaxy
              </Link>
              {mounted && user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 rounded-lg bg-purple-950 text-purple-200 border border-purple-800"
                >
                  ⚡ Painel de Administração
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
