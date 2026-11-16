'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { LogOut, Menu, Search, ShoppingBag, User as UserIcon, X } from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'
import { logout } from '../../lib/api'
import { Logo } from './Logo'

const NAV_LINKS = [
  { href: '/products', label: 'Smartphones' },
  { href: '/products?brand=Apple', label: 'iPhone' },
  { href: '/products?brand=Samsung', label: 'Samsung' },
  { href: '/orders', label: 'Meus pedidos' },
]

export function Navbar() {
  const router = useRouter()
  const pathname = usePathname()
  const { totalItems, setIsOpen } = useCartStore()
  const { user, isAuthenticated } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => setMounted(true), [])
  useEffect(() => setMenuOpen(false), [pathname])

  const count = mounted ? totalItems() : 0
  const firstName = user?.name?.split(' ')[0]

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchTerm.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchTerm.trim())}`)
    }
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/60 bg-white/60 backdrop-blur-xl">
      <div className="container flex h-16 items-center gap-4 md:h-[72px] md:gap-8">
        <button
          className="-ml-2 rounded-full p-2 text-ink md:hidden"
          onClick={() => setMenuOpen((v) => !v)}
          aria-label={menuOpen ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuOpen}
        >
          {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>

        <Logo />

        <nav className="hidden items-center gap-6 text-sm font-medium text-graphite lg:flex">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="transition-colors hover:text-ink">
              {link.label}
            </Link>
          ))}
        </nav>

        <form onSubmit={handleSearch} className="relative ml-auto hidden max-w-sm flex-1 md:block">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar modelo ou marca"
            aria-label="Buscar smartphones"
            className="w-full rounded-full border border-white/70 bg-white/70 py-2.5 pl-10 pr-4 text-sm placeholder:text-graphite/70 focus:border-ink focus:bg-white focus:outline-none"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 md:ml-0">
          {mounted && isAuthenticated ? (
            <>
              {user?.role === 'ADMIN' && (
                <Link href="/admin" className="hidden rounded-full px-3 py-2 text-sm font-medium text-graphite hover:text-ink sm:inline-block">
                  Painel
                </Link>
              )}
              <Link
                href="/account"
                title="Minha conta"
                className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-paper"
              >
                <UserIcon className="h-4 w-4" />
                <span className="hidden sm:inline">{firstName}</span>
              </Link>
              <button
                onClick={() => logout().then(() => router.push('/'))}
                title="Sair"
                className="rounded-full p-2 text-graphite hover:bg-paper hover:text-ink"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </>
          ) : (
            <Link href="/login" className="flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium text-ink hover:bg-paper">
              <UserIcon className="h-4 w-4" />
              <span>Entrar</span>
            </Link>
          )}

          <button
            onClick={() => setIsOpen(true)}
            className="relative ml-1 flex items-center gap-2 rounded-full bg-ink px-4 py-2 text-sm font-semibold text-white hover:bg-ink-soft"
            aria-label={`Carrinho com ${count} ${count === 1 ? 'item' : 'itens'}`}
          >
            <ShoppingBag className="h-4 w-4" />
            <span className="tabular-nums">{count}</span>
            {count > 0 && <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-signal ring-2 ring-white" />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="border-t border-line bg-white md:hidden">
          <div className="container space-y-4 py-4">
            <form onSubmit={handleSearch} className="relative">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-graphite" />
              <input
                type="search"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar modelo ou marca"
                aria-label="Buscar smartphones"
                className="field rounded-full pl-10"
              />
            </form>
            <nav className="grid gap-1 text-base font-medium">
              {NAV_LINKS.map((link) => (
                <Link key={link.href} href={link.href} className="rounded-xl px-3 py-2.5 hover:bg-paper">
                  {link.label}
                </Link>
              ))}
              {mounted && isAuthenticated && (
                <Link href="/account" className="rounded-xl px-3 py-2.5 hover:bg-paper">Minha conta</Link>
              )}
              {mounted && user?.role === 'ADMIN' && (
                <Link href="/admin" className="rounded-xl px-3 py-2.5 hover:bg-paper">Painel da loja</Link>
              )}
            </nav>
          </div>
        </div>
      )}
    </header>
  )
}
