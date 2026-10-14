'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { Filter, SlidersHorizontal, ArrowUpDown, Smartphone } from 'lucide-react'
import { ProductCard } from '../../components/products/ProductCard'
import { Product } from '../../types'

const fallbackCatalog: Product[] = [
  {
    id: 'prod-1',
    name: 'Apple iPhone 15 Pro Max',
    slug: 'apple-iphone-15-pro-max',
    description: 'Titânio aeroespacial, chip A17 Pro e zoom ótico 5x.',
    price: 8999,
    compareAtPrice: 9999,
    brand: 'Apple',
    model: 'iPhone 15 Pro Max',
    sku: 'NEXUS-IP15PM-256',
    stock: 45,
    isFeatured: true,
    isActive: true,
    avgRating: 4.9,
    totalReviews: 28,
    totalSold: 142,
    specifications: {
      screenSize: '6.7"',
      resolution: '2796 x 1290 OLED 120Hz',
      processor: 'A17 Pro 3nm',
      ram: 8,
      storage: 256,
      battery: 4422,
      mainCamera: '48 MP + 12 MP + 12 MP',
      frontCamera: '12 MP',
      os: 'iOS 17',
      colors: ['Titânio Natural', 'Titânio Azul', 'Titânio Preto'],
    },
    images: [{ id: '1', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', position: 0 }],
  },
  {
    id: 'prod-2',
    name: 'Samsung Galaxy S24 Ultra 5G',
    slug: 'samsung-galaxy-s24-ultra',
    description: 'Galaxy AI, tela plana antirreflexo e câmera de 200MP.',
    price: 7999,
    compareAtPrice: 8999,
    brand: 'Samsung',
    model: 'Galaxy S24 Ultra',
    sku: 'NEXUS-GS24U-512',
    stock: 60,
    isFeatured: true,
    isActive: true,
    avgRating: 4.8,
    totalReviews: 35,
    totalSold: 210,
    specifications: {
      screenSize: '6.8"',
      resolution: '3120 x 1440 AMOLED 120Hz',
      processor: 'Snapdragon 8 Gen 3',
      ram: 12,
      storage: 512,
      battery: 5000,
      mainCamera: '200 MP + 50 MP + 12 MP + 10 MP',
      frontCamera: '12 MP',
      os: 'Android 14 (One UI 6.1)',
      colors: ['Titanium Gray', 'Titanium Black'],
    },
    images: [{ id: '2', url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800', position: 0 }],
  },
  {
    id: 'prod-3',
    name: 'Xiaomi 14 Ultra Leica',
    slug: 'xiaomi-14-ultra-leica',
    description: 'Ótica Leica com sensor de 1 polegada e abertura contínua.',
    price: 6499,
    compareAtPrice: 7299,
    brand: 'Xiaomi',
    model: '14 Ultra',
    sku: 'NEXUS-XIA14U-512',
    stock: 25,
    isFeatured: true,
    isActive: true,
    avgRating: 4.9,
    totalReviews: 19,
    totalSold: 88,
    specifications: {
      screenSize: '6.73"',
      resolution: '3200 x 1440 AMOLED 120Hz',
      processor: 'Snapdragon 8 Gen 3',
      ram: 16,
      storage: 512,
      battery: 5000,
      mainCamera: 'Quad 50 MP Leica Summilux',
      frontCamera: '32 MP',
      os: 'Xiaomi HyperOS',
      colors: ['Black Leather', 'White Leather'],
    },
    images: [{ id: '3', url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800', position: 0 }],
  },
  {
    id: 'prod-4',
    name: 'Google Pixel 8 Pro',
    slug: 'google-pixel-8-pro',
    description: 'Inteligência do Google Tensor G3 e fotografia computacional.',
    price: 5799,
    brand: 'Google',
    model: 'Pixel 8 Pro',
    sku: 'NEXUS-PIX8P-128',
    stock: 30,
    isFeatured: false,
    isActive: true,
    avgRating: 4.7,
    totalReviews: 22,
    totalSold: 94,
    specifications: {
      screenSize: '6.7"',
      resolution: '2992 x 1344 LTPO OLED',
      processor: 'Google Tensor G3',
      ram: 12,
      storage: 128,
      battery: 5050,
      mainCamera: '50 MP + 48 MP + 48 MP',
      frontCamera: '10.5 MP',
      os: 'Android 14 Puro',
      colors: ['Azul-baía', 'Obsidiana'],
    },
    images: [{ id: '4', url: 'https://images.unsplash.com/photo-1511707171634-5f897ff02597?w=800', position: 0 }],
  },
]

function ProductsContent() {
  const searchParams = useSearchParams()
  const initialBrand = searchParams.get('brand') || ''
  const initialSearch = searchParams.get('search') || ''

  const [products, setProducts] = useState<Product[]>(fallbackCatalog)
  const [loading, setLoading] = useState(true)
  const [selectedBrand, setSelectedBrand] = useState<string>(initialBrand)
  const [sortBy, setSortBy] = useState<string>('newest')
  const [minPrice, setMinPrice] = useState<string>('')
  const [maxPrice, setMaxPrice] = useState<string>('')

  const brands = ['Apple', 'Samsung', 'Xiaomi', 'Google', 'Motorola']

  useEffect(() => {
    async function fetchProducts() {
      setLoading(true)
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
        const params = new URLSearchParams()
        if (selectedBrand) params.append('brand', selectedBrand)
        if (initialSearch) params.append('search', initialSearch)
        if (sortBy) params.append('sort', sortBy)
        if (minPrice) params.append('minPrice', minPrice)
        if (maxPrice) params.append('maxPrice', maxPrice)

        const res = await fetch(`${apiUrl}/products?${params.toString()}`)
        if (res.ok) {
          const data = await res.json()
          if (data.products && data.products.length > 0) {
            setProducts(data.products)
            setLoading(false)
            return
          }
        }
      } catch {
        // Fallback filter
      }

      // Filtragem local sobre o fallbackCatalog caso backend não esteja respondendo
      let filtered = [...fallbackCatalog]
      if (selectedBrand) {
        filtered = filtered.filter((p) => p.brand.toLowerCase() === selectedBrand.toLowerCase())
      }
      if (initialSearch) {
        filtered = filtered.filter(
          (p) =>
            p.name.toLowerCase().includes(initialSearch.toLowerCase()) ||
            p.brand.toLowerCase().includes(initialSearch.toLowerCase())
        )
      }
      setProducts(filtered)
      setLoading(false)
    }

    fetchProducts()
  }, [selectedBrand, initialSearch, sortBy, minPrice, maxPrice])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Título e Controles */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-8 border-b border-slate-800 gap-4">
        <div>
          <h1 className="text-3xl font-black text-white">Catálogo de Smartphones</h1>
          <p className="text-sm text-slate-400 mt-1">
            {initialSearch ? `Resultados para "${initialSearch}"` : 'Todos os flagships disponíveis com garantia'}
          </p>
        </div>

        {/* Ordenação */}
        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-400 flex items-center gap-1.5 font-medium">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            Ordenar por:
          </label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="bg-slate-900 border border-slate-700 text-slate-200 text-xs rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500"
          >
            <option value="newest">Lançamentos Recentes</option>
            <option value="price_asc">Menor Preço</option>
            <option value="price_desc">Maior Preço</option>
            <option value="rating">Melhor Avaliados</option>
            <option value="popular">Mais Vendidos</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 pt-8">
        {/* ==================== FILTROS LATERAIS ==================== */}
        <aside className="space-y-6">
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-indigo-400" />
                Filtros
              </h3>
              {(selectedBrand || minPrice || maxPrice) && (
                <button
                  onClick={() => {
                    setSelectedBrand('')
                    setMinPrice('')
                    setMaxPrice('')
                  }}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Limpar todos
                </button>
              )}
            </div>

            {/* Filtro por Marca */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Fabricante
              </h4>
              <div className="space-y-2">
                <button
                  onClick={() => setSelectedBrand('')}
                  className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-colors ${
                    selectedBrand === ''
                      ? 'bg-indigo-600 text-white font-bold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  Todas as Marcas
                </button>
                {brands.map((b) => (
                  <button
                    key={b}
                    onClick={() => setSelectedBrand(b)}
                    className={`w-full text-left text-xs px-3 py-2 rounded-xl transition-colors ${
                      selectedBrand === b
                        ? 'bg-indigo-600 text-white font-bold'
                        : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>

            {/* Filtro por Faixa de Preço */}
            <div>
              <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider mb-3">
                Faixa de Preço (R$)
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  placeholder="Mínimo"
                  value={minPrice}
                  onChange={(e) => setMinPrice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500"
                />
                <input
                  type="number"
                  placeholder="Máximo"
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-white placeholder-slate-500"
                />
              </div>
            </div>
          </div>
        </aside>

        {/* ==================== GRID DE PRODUTOS ==================== */}
        <section className="lg:col-span-3">
          {products.length === 0 ? (
            <div className="text-center py-20 bg-slate-900/40 rounded-2xl border border-slate-800">
              <Smartphone className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Nenhum smartphone encontrado</h3>
              <p className="text-xs text-slate-400 mt-1">Tente remover alguns filtros ou buscar por outro termo.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
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
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400">
          Carregando catálogo de smartphones...
        </div>
      }
    >
      <ProductsContent />
    </Suspense>
  )
}
