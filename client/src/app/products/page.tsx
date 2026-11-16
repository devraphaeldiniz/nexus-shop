'use client'

import React, { Suspense, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { SlidersHorizontal, X } from 'lucide-react'
import { ProductCard } from '../../components/products/ProductCard'
import { Product } from '../../types'
import { apiFetch } from '../../lib/api'
import { formatStorage } from '../../lib/utils'

const RAM_OPTIONS = [4, 6, 8, 12, 16]
const STORAGE_OPTIONS = [64, 128, 256, 512, 1024]
const SORT_OPTIONS = [
  { value: 'popular', label: 'Mais vendidos' },
  { value: 'newest', label: 'Lançamentos' },
  { value: 'price_asc', label: 'Menor preço' },
  { value: 'price_desc', label: 'Maior preço' },
  { value: 'rating', label: 'Melhor avaliados' },
]

function Chip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
        active ? 'border-ink bg-ink text-white' : 'border-line bg-white text-ink hover:border-ink'
      }`}
    >
      {children}
    </button>
  )
}

function ProductsContent() {
  const searchParams = useSearchParams()
  const search = searchParams.get('search') || ''

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)
  const [brands, setBrands] = useState<string[]>([])
  const [brand, setBrand] = useState(searchParams.get('brand') || '')
  const [sortBy, setSortBy] = useState(searchParams.get('sort') || 'popular')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [ram, setRam] = useState('')
  const [storage, setStorage] = useState('')
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Mudanças na URL (links do menu) atualizam a marca
  useEffect(() => {
    setBrand(searchParams.get('brand') || '')
  }, [searchParams])

  useEffect(() => {
    apiFetch<{ brands: string[] }>('/products/brands')
      .then((data) => setBrands(data.brands || []))
      .catch(() => setBrands([]))
  }, [])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setLoadError('')
    apiFetch<{ products: Product[] }>('/products', {
      params: { brand, search, sort: sortBy, minPrice, maxPrice, ram, storage, limit: 50 },
    })
      .then((data) => !cancelled && setProducts(data.products || []))
      .catch((err) => {
        if (cancelled) return
        setProducts([])
        setLoadError(err instanceof Error ? err.message : 'Não foi possível carregar os smartphones.')
      })
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [brand, search, sortBy, minPrice, maxPrice, ram, storage, retryKey])

  const hasFilters = !!(brand || minPrice || maxPrice || ram || storage)
  const clearFilters = () => {
    setBrand('')
    setMinPrice('')
    setMaxPrice('')
    setRam('')
    setStorage('')
  }

  const title = search ? `Resultados para "${search}"` : brand ? brand : 'Smartphones'

  const filters = (
    <div className="space-y-7">
      <div>
        <h3 className="mb-3 font-sans text-sm font-semibold">Marca</h3>
        <div className="flex flex-wrap gap-2">
          <Chip active={brand === ''} onClick={() => setBrand('')}>Todas</Chip>
          {brands.map((b) => (
            <Chip key={b} active={brand === b} onClick={() => setBrand(b)}>{b}</Chip>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-sans text-sm font-semibold">Armazenamento</h3>
        <div className="flex flex-wrap gap-2">
          {STORAGE_OPTIONS.map((gb) => (
            <Chip key={gb} active={storage === String(gb)} onClick={() => setStorage(storage === String(gb) ? '' : String(gb))}>
              {formatStorage(gb)}
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-sans text-sm font-semibold">Memória RAM</h3>
        <div className="flex flex-wrap gap-2">
          {RAM_OPTIONS.map((gb) => (
            <Chip key={gb} active={ram === String(gb)} onClick={() => setRam(ram === String(gb) ? '' : String(gb))}>
              {gb} GB
            </Chip>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 font-sans text-sm font-semibold">Preço</h3>
        <div className="grid grid-cols-2 gap-2">
          <input type="number" min={0} inputMode="numeric" placeholder="De R$" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} className="field" aria-label="Preço mínimo" />
          <input type="number" min={0} inputMode="numeric" placeholder="Até R$" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} className="field" aria-label="Preço máximo" />
        </div>
      </div>

      {hasFilters && (
        <button onClick={clearFilters} className="text-sm font-semibold underline underline-offset-4">
          Limpar filtros
        </button>
      )}
    </div>
  )

  return (
    <div className="container pt-8 md:pt-12">
      <div className="flex flex-col gap-5 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">{title}</h1>
          <p className="mt-2 text-graphite">
            {loading ? 'Carregando...' : `${products.length} ${products.length === 1 ? 'aparelho' : 'aparelhos'}`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setFiltersOpen(true)} className="btn-ghost lg:hidden">
            <SlidersHorizontal className="h-4 w-4" /> Filtros{hasFilters ? ' ativos' : ''}
          </button>
          <label htmlFor="sort" className="sr-only">Ordenar por</label>
          <select id="sort" value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="field w-auto rounded-full pr-8">
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-10 pt-8 lg:grid-cols-[240px_1fr]">
        <aside className="hidden lg:block">{filters}</aside>

        <section>
          {!loading && loadError ? (
            <div className="stage px-6 py-16 text-center" role="alert">
              <p className="font-display text-xl font-semibold">Não conseguimos carregar os smartphones</p>
              <p className="mt-2 text-graphite">{loadError}</p>
              <button onClick={() => setRetryKey((k) => k + 1)} className="btn-primary mt-6">Tentar de novo</button>
            </div>
          ) : !loading && products.length === 0 ? (
            <div className="stage px-6 py-16 text-center">
              <p className="font-display text-xl font-semibold">Nenhum aparelho com esses filtros</p>
              <p className="mt-2 text-graphite">Tente outra marca ou uma faixa de preço maior.</p>
              {hasFilters && (
                <button onClick={clearFilters} className="btn-primary mt-6">Limpar filtros</button>
              )}
              {search && !hasFilters && (
                <Link href="/products" className="btn-primary mt-6">Ver todos os smartphones</Link>
              )}
            </div>
          ) : (
            <div className={`grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 ${loading ? 'opacity-50' : ''}`}>
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>

      {filtersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="absolute inset-0 bg-ink/40" onClick={() => setFiltersOpen(false)} />
          <div className="animate-drawer absolute inset-y-0 right-0 w-full max-w-sm overflow-y-auto bg-white p-6">
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-xl font-bold">Filtros</h2>
              <button onClick={() => setFiltersOpen(false)} className="rounded-full p-2 hover:bg-paper" aria-label="Fechar filtros">
                <X className="h-5 w-5" />
              </button>
            </div>
            {filters}
            <button onClick={() => setFiltersOpen(false)} className="btn-primary mt-8 w-full">
              Ver {products.length} {products.length === 1 ? 'aparelho' : 'aparelhos'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="container py-20 text-graphite">Carregando...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
