'use client'

import React, { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  Star,
  ShieldCheck,
  Truck,
  CreditCard,
  Cpu,
  Layers,
  BatteryCharging,
  Camera,
  Check,
  ShoppingBag,
  Zap,
} from 'lucide-react'
import { formatCurrency } from '../../../lib/utils'
import { useCartStore } from '../../../store/useCartStore'
import { Product } from '../../../types'

// Mock de detalhes
const sampleProducts: Record<string, Product> = {
  'apple-iphone-15-pro-max': {
    id: 'prod-1',
    name: 'Apple iPhone 15 Pro Max',
    slug: 'apple-iphone-15-pro-max',
    description:
      'Forjado em titânio aeroespacial premium. Equipado com o chip inovador A17 Pro com GPU de 6 núcleos para Ray Tracing acelerado por hardware. O sistema de câmeras traz a lente teleobjetiva de 5x com design tetraprisma exclusiva da Apple.',
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
      screenSize: '6.7 polegadas Super Retina XDR OLED (120Hz ProMotion)',
      resolution: '2796 x 1290 a 460 ppp',
      processor: 'Apple A17 Pro (3nm de última geração)',
      ram: 8,
      storage: 256,
      battery: 4422,
      mainCamera: '48 MP (Principal com sensor quadri-pixel) + 12 MP (Ultra-angular) + 12 MP (Telefoto 5x)',
      frontCamera: '12 MP TrueDepth com autofoco',
      os: 'iOS 17',
      weight: 221,
      charging: 'USB-C com suporte a USB 3 (10Gb/s), MagSafe 15W',
      colors: ['Titânio Natural', 'Titânio Azul', 'Titânio Branco', 'Titânio Preto'],
    },
    images: [
      { id: '1', url: 'https://images.unsplash.com/photo-1695048133142-1a20484d2569?w=800', position: 0 },
      { id: '2', url: 'https://images.unsplash.com/photo-1592750475338-74b7b21085ab?w=800', position: 1 },
    ],
    reviews: [
      {
        id: 'rev-1',
        userId: 'u1',
        rating: 5,
        title: 'Smartphone absurdo! Vale cada centavo',
        comment: 'A leveza do titânio impressiona logo que você tira da caixa. A câmera com zoom de 5x é inacreditável em shows e viagens.',
        isVerified: true,
        createdAt: '2025-01-15T10:00:00Z',
        user: { name: 'Matheus Siqueira' },
      },
      {
        id: 'rev-2',
        userId: 'u2',
        rating: 5,
        title: 'Bateria dura muito mais',
        comment: 'Chego ao final do dia tranquilamente com mais de 35% de bateria. O conector USB-C facilita a vida.',
        isVerified: true,
        createdAt: '2025-01-20T14:30:00Z',
        user: { name: 'Camila Duarte' },
      },
    ],
  },
}

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { addItem, setIsOpen } = useCartStore()

  // Buscar produto específico ou usar o sample default
  const product = sampleProducts[slug] || sampleProducts['apple-iphone-15-pro-max']

  const [selectedColor, setSelectedColor] = useState(
    product.specifications.colors[0] || 'Padrão'
  )
  const [selectedStorage, setSelectedStorage] = useState(
    `${product.specifications.storage}GB`
  )
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const handleAddToCart = () => {
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      price: Number(product.price),
      quantity: 1,
      image: product.images[activeImageIndex]?.url || product.images[0]?.url || '',
      stock: product.stock,
      color: selectedColor,
      storage: selectedStorage,
    })
  }

  const handleBuyNow = () => {
    handleAddToCart()
    setIsOpen(false)
    router.push('/checkout')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16">
      {/* ==================== PRODUTO TOPO ==================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
        {/* Galeria de Fotos */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative aspect-square sm:aspect-[4/3] rounded-3xl bg-slate-900 border border-slate-800 overflow-hidden shadow-2xl flex items-center justify-center">
            {product.images[activeImageIndex]?.url && (
              <img
                src={product.images[activeImageIndex].url}
                alt={product.name}
                className="w-full h-full object-cover transition-all duration-300"
              />
            )}
            <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-white text-xs font-bold px-3 py-1.5 rounded-full">
              {product.brand}
            </div>
          </div>

          {/* Miniaturas */}
          <div className="flex gap-3">
            {product.images.map((img, idx) => (
              <button
                key={img.id}
                onClick={() => setActiveImageIndex(idx)}
                className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                  activeImageIndex === idx
                    ? 'border-indigo-500 scale-105'
                    : 'border-slate-800 opacity-60 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt="thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>

        {/* Informações e Compra */}
        <div className="lg:col-span-5 space-y-6 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="bg-indigo-950 border border-indigo-800 text-indigo-300 text-xs font-bold uppercase px-2.5 py-0.5 rounded-full">
                Em Estoque
              </span>
              <div className="flex items-center text-amber-400 text-xs font-semibold gap-1">
                <Star className="w-4 h-4 fill-amber-400" />
                <span>{product.avgRating.toFixed(1)}</span>
                <span className="text-slate-400">({product.totalReviews} avaliações)</span>
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight">
              {product.name}
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {product.description}
            </p>

            {/* Seleção de Cores */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Cor: <span className="text-indigo-400 normal-case font-bold">{selectedColor}</span>
              </label>
              <div className="flex flex-wrap gap-2">
                {product.specifications.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      selectedColor === color
                        ? 'border-indigo-500 bg-indigo-600/20 text-white'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>

            {/* Armazenamento */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Armazenamento Interno
              </label>
              <div className="flex gap-2">
                {['256GB', '512GB', '1TB'].map((st) => (
                  <button
                    key={st}
                    onClick={() => setSelectedStorage(st)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all ${
                      selectedStorage === st
                        ? 'border-indigo-500 bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                        : 'border-slate-800 bg-slate-900 text-slate-400 hover:border-slate-700'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>
            </div>

            {/* Preço */}
            <div className="pt-4 border-t border-slate-800 space-y-1">
              {product.compareAtPrice && (
                <span className="text-xs text-slate-500 line-through">
                  De {formatCurrency(Number(product.compareAtPrice))} por:
                </span>
              )}
              <div className="flex items-baseline gap-3">
                <span className="text-3xl font-black text-white">
                  {formatCurrency(Number(product.price))}
                </span>
                <span className="text-xs text-emerald-400 font-bold bg-emerald-950/60 border border-emerald-800/80 px-2 py-0.5 rounded-md">
                  10% OFF no PIX
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ou em até 12x de{' '}
                <strong className="text-slate-200">
                  {formatCurrency(Number(product.price) / 12)}
                </strong>{' '}
                sem juros no cartão
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3 pt-6 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleAddToCart}
                className="py-3.5 px-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 transition-colors"
              >
                <ShoppingBag className="w-4 h-4 text-indigo-400" />
                <span>Adicionar ao Carrinho</span>
              </button>

              <button
                onClick={handleBuyNow}
                className="py-3.5 px-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <Zap className="w-4 h-4" />
                <span>Comprar Agora</span>
              </button>
            </div>

            {/* Selos de Garantia */}
            <div className="grid grid-cols-3 gap-2 pt-2 text-center text-[10px] text-slate-400">
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <ShieldCheck className="w-4 h-4 text-indigo-400 mx-auto mb-1" />
                <span>Garantia 12 Meses</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <Truck className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <span>Frete Grátis</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                <CreditCard className="w-4 h-4 text-purple-400 mx-auto mb-1" />
                <span>12x Sem Juros</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ==================== ESPECIFICAÇÕES TÉCNICAS ==================== */}
      <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 sm:p-10 space-y-6">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Cpu className="w-5 h-5 text-indigo-400" />
          Ficha Técnica & Especificações
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Processador</span>
            <p className="text-sm font-bold text-white mt-1">{product.specifications.processor}</p>
          </div>
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Memória RAM</span>
            <p className="text-sm font-bold text-white mt-1">{product.specifications.ram} GB LPDDR5X</p>
          </div>
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Tela & Display</span>
            <p className="text-sm font-bold text-white mt-1">{product.specifications.screenSize}</p>
          </div>
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Bateria</span>
            <p className="text-sm font-bold text-white mt-1">{product.specifications.battery} mAh</p>
          </div>
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl sm:col-span-2">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Câmera Traseira</span>
            <p className="text-sm font-bold text-white mt-1">{product.specifications.mainCamera}</p>
          </div>
          <div className="p-4 bg-slate-950/80 border border-slate-800 rounded-2xl sm:col-span-2">
            <span className="text-[10px] text-slate-500 uppercase font-semibold">Sistema Operacional</span>
            <p className="text-sm font-bold text-white mt-1">{product.specifications.os}</p>
          </div>
        </div>
      </section>

      {/* ==================== AVALIAÇÕES DE CLIENTES ==================== */}
      <section className="space-y-6">
        <h2 className="text-xl font-bold text-white">Opiniões de Compradores Verificados</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {product.reviews?.map((rev) => (
            <div key={rev.id} className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-xs font-bold text-white">{rev.user.name}</span>
                <span className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                  <Check className="w-3 h-3" /> Compra Verificada
                </span>
              </div>
              <div className="flex gap-1 text-amber-400">
                {Array.from({ length: rev.rating }).map((_, i) => (
                  <Star key={i} className="w-3 h-3 fill-amber-400" />
                ))}
              </div>
              <h4 className="text-xs font-bold text-slate-200">{rev.title}</h4>
              <p className="text-xs text-slate-400 leading-relaxed">{rev.comment}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
