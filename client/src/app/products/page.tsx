'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { SlidersHorizontal, ArrowUpDown, Smartphone } from 'lucide-react'
import { ProductCard } from '../../components/products/ProductCard'
import { Product } from '../../types'

function ProductsContent() {
  const searchParams = useSearchParams()
  const initialBrand = searchParams.get('brand') || ''
  const initialSearch = searchParams.get('search') || ''

  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand)
  const [sortBy, setSortBy] = useState<string>('newest')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')

  const brands = ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Motorola']
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (selectedBrand) params.append('brand', selectedBrand)
        if (initialSearch) params.append('search', initialSearch)
        if (sortBy) params.append('sort', sortBy)
        if (minPrice) params.append('minPrice', minPrice)
        if (maxPrice) params.append('maxPrice', maxPrice)

        const res = await fetch(`${apiUrl}/products?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          setProducts(data.products || [])
        } else {
          setProducts([])
        }
      } catch {
        setProducts([])
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [selectedBrand, initialSearch, sortBy, minPrice, maxPrice])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Título e Ordenação */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Catálogo de Smartphones</h1>
          <p className="text-xs text-slate-400 mt-0.5">
            {initialSearch ? `Filtrando por "${initialSearch}"` : 'Modelos originais com nota fiscal e garantia'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-xs text-slate-400 flex items-center gap-1">
            <ArrowUpDown className="w-3.5 h-3.5" />
            Ordenar por:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-800 text-slate-200 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-slate-600"
          >
            <option value="newest">Lançamentos Recentes</option>
            <option value="price_asc">Menor Preço</option>
            <option value="price_desc">Maior Preço</option>
            <option value="rating">Melhor Avaliados</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-6">
        {/* Filtros */}
        <aside className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-3.5 h-3.5 text-indigo-400" />
                Filtros
              </h3>
              {(selectedBrand || minPrice || maxPrice) && (
                <button
                  onClick={() => {
                    setSelectedBrand('')
                    setMinPrice('')
                    setMaxPrice('')
                  }}
                  className="text-[11px] text-indigo-400 hover:underline"
                >
                  Limpar
                </button>
              )}
            </div>

            {/* Marcas */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-300 uppercase mb-2">Fabricante</h4>
              <div className="space-y-1">
                <button
                  onClick={() => setSelectedBrand('')}
                  className={`w-full text-left text-xs px-2.5 py-1.5 rounded transition-colors ${
                    selectedBrand === ''
                      ? 'bg-indigo-600 text-white font-medium'
                      : 'text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  Todas as Marcas
                </button>
                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(b)}
                    className={`w-full text-left text-xs px-2.5 py-1.5 rounded transition-colors ${
                      selectedBrand === b
                        ? 'bg-indigo-600 text-white font-medium'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Faixa de Preço */}
            <div>
              <h4 className="text-[11px] font-semibold text-slate-300 uppercase mb-2">Faixa de Preço (R$)</h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mín"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white placeholder-slate-500"
                />
                <input
                  type="number"
                  placeholder="Máx"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded p-1.5 text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* Lista de Produtos */}
        <section className="lg:col-span-3">
          {loading ? (
            <div className="text-center py-20 text-xs text-slate-400">
              Carregando catálogo de smartphones...
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
              <Smartphone className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <p className="text-xs font-semibold text-white">Nenhum smartphone encontrado com os filtros aplicados.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tente limpar os filtros para ver mais produtos.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-slate-400">Carregando...</div>}>
      <ProductsContent />
    </Suspense>
  )
}
