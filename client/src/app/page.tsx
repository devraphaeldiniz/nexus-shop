import React from 'react'
import Link from 'next/link'
import {
  Smartphone,
  Zap,
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight,
  Flame,
  Sparkles,
} from 'lucide-react'
import { ProductCard } from '../components/products/ProductCard'
import { Product } from '../types'

// Mock de fallback para renderização instantânea caso a API esteja inicializando
const fallbackProducts: Product[] = [
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
    images: [
      {
        id: 'img-1',
        url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop',
        position: 0,
      },
    ],
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
    images: [
      {
        id: 'img-2',
        url: 'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=800&auto=format&fit=crop',
        position: 0,
      },
    ],
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
    images: [
      {
        id: 'img-3',
        url: 'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=800&auto=format&fit=crop',
        position: 0,
      },
    ],
  },
]

async function getFeaturedProducts(): Promise<Product[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    const res = await fetch(`${apiUrl}/products?featured=true&limit=6`, {
      next: { revalidate: 60 },
    })
    if (!res.ok) return fallbackProducts
    const data = await res.json()
    return data.products && data.products.length > 0 ? data.products : fallbackProducts
  } catch {
    return fallbackProducts
  }
}

export default async function HomePage() {
  const products = await getFeaturedProducts()

  const brands = [
    { name: 'Apple', icon: '🍎', desc: 'iPhone 15 Pro, Pro Max' },
    { name: 'Samsung', icon: '🌌', desc: 'Galaxy S24, Z Fold' },
    { name: 'Xiaomi', icon: '⚡', desc: '14 Ultra, Poco F6' },
    { name: 'Google', icon: '🔍', desc: 'Pixel 8 Pro AI' },
    { name: 'Motorola', icon: '🚀', desc: 'Edge 50 Ultra' },
  ]

  return (
    <div className="space-y-20 pb-20">
      {/* ==================== HERO SECTION ==================== */}
      <section className="relative overflow-hidden pt-12 pb-20 bg-gradient-to-b from-indigo-950/40 via-slate-950 to-slate-950 border-b border-slate-800">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(99,102,241,0.25),rgba(255,255,255,0))]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Texto Hero */}
            <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-xs font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nova Geração de Smartphones Flagship 2025</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-black text-white tracking-tight leading-[1.1]">
                O Futuro da Performance <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-indigo-200 bg-clip-text text-transparent">
                  Na Palma da Sua Mão.
                </span>
              </h1>

              <p className="text-slate-300 text-base sm:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed">
                Descubra os smartphones mais avançados do mundo. Câmeras com IA,
                processadores de 3nm, carregamento ultrarrápido e garantia nacional Nexus de 12 meses.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <Link
                  href="/products"
                  className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 hover:scale-105 transition-all text-sm"
                >
                  <span>Explorar Catálogo</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/products?featured=true"
                  className="px-8 py-4 bg-slate-900/80 hover:bg-slate-800 text-white font-semibold rounded-2xl border border-slate-700/80 flex items-center justify-center gap-2 transition-all text-sm"
                >
                  <Flame className="w-4 h-4 text-orange-400" />
                  <span>Ver Mais Vendidos</span>
                </Link>
              </div>

              {/* Métricas de Confiança */}
              <div className="pt-6 grid grid-cols-3 gap-4 border-t border-slate-800/80 text-center lg:text-left">
                <div>
                  <p className="text-2xl font-black text-white">100%</p>
                  <p className="text-xs text-slate-400">Originais com NF</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-indigo-400">12x</p>
                  <p className="text-xs text-slate-400">Sem Juros no Cartão</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-emerald-400">10% OFF</p>
                  <p className="text-xs text-slate-400">Pagamento no PIX</p>
                </div>
              </div>
            </div>

            {/* Imagem Hero Destaque */}
            <div className="lg:col-span-5 relative flex justify-center">
              <div className="relative w-full max-w-md aspect-square rounded-3xl bg-gradient-to-tr from-indigo-900/30 to-purple-900/30 border border-slate-800 p-4 shadow-2xl flex items-center justify-center">
                <img
                  src="https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800&auto=format&fit=crop"
                  alt="iPhone 15 Pro Max Destaque"
                  className="w-full h-full object-cover rounded-2xl shadow-2xl hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute -bottom-4 -right-4 bg-slate-900/95 border border-slate-700 p-4 rounded-2xl shadow-xl backdrop-blur-md">
                  <p className="text-[10px] text-slate-400 uppercase font-semibold">Oferta Especial</p>
                  <p className="text-sm font-bold text-white">Apple iPhone 15 Pro Max</p>
                  <p className="text-xs text-emerald-400 font-bold mt-0.5">R$ 8.999 à vista no PIX</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ==================== MARCAS EM DESTAQUE ==================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-2xl sm:text-3xl font-black text-white">
            Navegue por Marcas Líderes
          </h2>
          <p className="text-xs sm:text-sm text-slate-400 mt-2">
            Trabalhamos diretamente com as maiores fabricantes de tecnologia móvel do planeta.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {brands.map((brand) => (
            <Link
              key={brand.name}
              href={`/products?brand=${brand.name}`}
              className="p-5 bg-slate-900/60 border border-slate-800 rounded-2xl hover:border-indigo-500 hover:bg-slate-800/80 transition-all group text-center"
            >
              <span className="text-3xl block mb-2 group-hover:scale-110 transition-transform">
                {brand.icon}
              </span>
              <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors">
                {brand.name}
              </h3>
              <p className="text-[11px] text-slate-400 mt-1">{brand.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ==================== PRODUTOS FLAGSHIP ==================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-baseline mb-8 gap-4 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-500" />
              <h2 className="text-2xl sm:text-3xl font-black text-white">
                Smartphones em Alta
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Os modelos mais desejados com processadores de última geração e câmeras de cinema.
            </p>
          </div>

          <Link
            href="/products"
            className="text-xs sm:text-sm font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 group"
          >
            <span>Ver todo o catálogo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>

      {/* ==================== BANNER DE VANTAGENS ==================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-purple-950 border border-indigo-900/50 p-8 sm:p-12 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <span className="text-xs uppercase font-extrabold tracking-widest text-indigo-400">
              Pagamento 100% Flexível e Seguro
            </span>
            <h3 className="text-2xl sm:text-4xl font-black text-white">
              Pague com Stripe ou Mercado Pago: Você Escolhe.
            </h3>
            <p className="text-sm text-slate-300 leading-relaxed">
              Integração completa com as duas maiores plataformas globais de pagamento.
              Pague no <strong>PIX instantâneo com 10% de desconto</strong>, parcele em até 12x no cartão de crédito
              ou utilize boleto bancário com liquidação rápida.
            </p>
            <div className="pt-2 flex flex-wrap gap-4">
              <Link
                href="/products"
                className="px-6 py-3 bg-white text-slate-950 font-bold text-xs rounded-xl hover:bg-slate-200 transition-colors"
              >
                Comprar Agora
              </Link>
              <div className="flex items-center gap-2 text-xs text-slate-300">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Checkout Blindado com Proteção ao Comprador</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
