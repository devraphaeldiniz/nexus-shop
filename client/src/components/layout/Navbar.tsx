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
  LogOut,
  Shield,
  Truck,
  Settings,
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
      {/* Top Banner Institucional */}
      <div className="bg-slate-900 border-b border-slate-800 text-slate-300 text-xs py-2 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium text-slate-300">
              <Shield className="w-3.5 h-3.5 text-slate-400" />
              Aparelhos com Garantia Nacional de 12 Meses
            </span>
            <span className="hidden sm:inline-block text-slate-600">|</span>
            <span className="hidden sm:flex items-center gap-1.5 text-slate-400">
              <Truck className="w-3.5 h-3.5" />
              Envio com seguro para todo o território nacional
            </span>
          </div>

          <div className="flex items-center gap-4">
            {mounted && user?.role === 'ADMIN' ? (
              <Link
                href="/admin"
                className="text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 text-xs"
              >
                <Settings className="w-3.5 h-3.5" />
                Painel do Lojista
              </Link>
            ) : (
              <span className="text-slate-400">Suporte ao Cliente & Pedidos</span>
            )}
          </div>
        </div>
      </div>

      {/* Header Principal */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-sm border-b border-slate-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6 py-4">
          {/* Logo Comercial */}
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xl font-bold tracking-tight text-white">
                NEXUS<span className="text-indigo-400">SHOP</span>
              </span>
              <span className="block text-[9px] uppercase tracking-wider text-slate-400 font-medium">
                Smartphones & Acessórios
              </span>
            </div>
          </Link>

          {/* Busca Comercial */}
          <form
            onSubmit={handleSearch}
            className="hidden md:flex flex-1 max-w-lg relative items-center"
          >
            <input
              type="text"
              placeholder="Pesquisar por smartphone, marca ou modelo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-10 pr-4 text-xs text-white placeholder-slate-400 focus:outline-none focus:border-slate-600 transition-colors"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
          </form>

          {/* Links e Ações */}
          <div className="flex items-center gap-4">
            <Link
              href="/products"
              className="hidden lg:inline-block text-xs font-semibold text-slate-300 hover:text-white transition-colors"
            >
              Catálogo
            </Link>

            {mounted && isAuthenticated ? (
              <div className="flex items-center gap-3 border-l border-slate-800 pl-4">
                <div className="text-right hidden sm:block">
                  <p className="text-xs font-semibold text-white">{user?.name}</p>
                  <p className="text-[10px] text-slate-400">{user?.role === 'ADMIN' ? 'Administrador' : 'Cliente'}</p>
                </div>
                <button
                  onClick={() => logout()}
                  title="Sair"
                  className="p-2 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-900 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 hover:text-white py-2 px-3 rounded-lg border border-slate-800 hover:bg-slate-900 transition-colors"
              >
                <UserIcon className="w-3.5 h-3.5 text-indigo-400" />
                <span>Entrar</span>
              </Link>
            )}

            {/* Carrinho */}
            <button
              onClick={() => setIsOpen(true)}
              className="relative p-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg transition-colors flex items-center justify-center"
              aria-label="Carrinho"
            >
              <ShoppingCart className="w-4 h-4" />
              {mounted && totalItems() > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-rose-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {totalItems()}
                </span>
              )}
            </button>

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-slate-400 hover:text-white"
            >
              {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Menu Mobile */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-slate-800 p-4 bg-slate-950 space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                placeholder="Pesquisar smartphones..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg py-2 pl-9 pr-3 text-xs text-white"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            </form>

            <div className="flex flex-col gap-2 text-xs font-medium text-slate-300">
              <Link
                href="/products"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-900 rounded"
              >
                Todos os Smartphones
              </Link>
              <Link
                href="/products?brand=Apple"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-900 rounded"
              >
                Apple iPhone
              </Link>
              <Link
                href="/products?brand=Samsung"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-2 hover:bg-slate-900 rounded"
              >
                Samsung Galaxy
              </Link>
              {mounted && user?.role === 'ADMIN' && (
                <Link
                  href="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="p-2 text-indigo-400 font-semibold bg-slate-900 rounded"
                >
                  Painel de Gestão da Loja
                </Link>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  )
}
