'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Star,
  ShieldCheck,
  Truck,
  CreditCard,
  Cpu,
  ShoppingBag,
  Zap,
  ArrowLeft,
  Smartphone,
} from 'lucide-react'
import { formatCurrency } from '../../../lib/utils'
import { useCartStore } from '../../../store/useCartStore'
import { Product } from '../../../types'

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string
  const { addItem, setIsOpen } = useCartStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState<string>('')
  const [selectedStorage, setSelectedStorage] = useState<string>('')
  const [activeImageIndex, setActiveImageIndex] = useState(0)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

  useEffect(() => {
    async function fetchProduct() {
      setLoading(true)
      try {
        const res = await fetch(`${apiUrl}/products/${slug}`)
        if (res.ok) {
          const data = await res.json()
          if (data.product) {
            setProduct(data.product)
            if (data.product.specifications?.colors?.length > 0) {
              setSelectedColor(data.product.specifications.colors[0])
            }
            if (data.product.specifications?.storage) {
              setSelectedStorage(`${data.product.specifications.storage}GB`)
            }
          }
        }
      } catch (err) {
        console.error('Falha ao carregar produto:', err)
      } finally {
        setLoading(false)
      }
    }

    if (slug) {
      fetchProduct()
    }
  }, [slug])

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-slate-400 text-xs">
        Carregando informações do smartphone...
      </div>
    )
  }

  if (!product) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <Smartphone className="w-12 h-12 text-slate-600 mx-auto" />
        <h2 className="text-base font-bold text-white">Smartphone não localizado</h2>
        <p className="text-xs text-slate-400">O produto pode ter sido pausado ou o link está incorreto.</p>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Catálogo</span>
        </Link>
      </div>
    )
  }

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
      {/* Botão Voltar */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
      >
        <ArrowLeft className="w-3.5 h-3.5" />
        <span>Voltar ao catálogo</span>
      </Link>

      {/* Grid Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Galeria de Fotos */}
        <div className="lg:col-span-7 space-y-3">
          <div className="relative aspect-square sm:aspect-[4/3] rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden flex items-center justify-center">
            {product.images[activeImageIndex]?.url ? (
              <img
                src={product.images[activeImageIndex].url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-slate-500 text-xs">Sem foto cadastrada</div>
            )}
            <div className="absolute top-3 left-3 bg-slate-950/80 border border-slate-800 text-white text-[10px] font-semibold uppercase px-2 py-0.5 rounded">
              {product.brand}
            </div>
          </div>

          {/* Miniaturas */}
          {product.images.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-lg overflow-hidden border transition-colors ${
                    activeImageIndex === idx ? 'border-indigo-500' : 'border-slate-800 opacity-60'
                  }`}
                >
                  <img src={img.url} alt="miniatura" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Informações e Compra */}
        <div className="lg:col-span-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span
                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                  product.stock > 0
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    : 'bg-rose-950 text-rose-400 border border-rose-800'
                }`}
              >
                {product.stock > 0 ? 'Em Estoque' : 'Esgotado'}
              </span>
              <div className="flex items-center text-amber-400 text-xs font-semibold gap-1">
                <Star className="w-3.5 h-3.5 fill-amber-400" />
                <span>{product.avgRating ? product.avgRating.toFixed(1) : '5.0'}</span>
              </div>
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight leading-snug">
              {product.name}
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              {product.description}
            </p>

            {/* Variações de Cores */}
            {product.specifications?.colors?.length > 0 && (
              <div className="space-y-1.5 pt-1">
                <label className="text-[11px] font-semibold text-slate-300 block">
                  Cor Selecionada: <span className="text-indigo-400">{selectedColor}</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {product.specifications.colors.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedColor(c)}
                      className={`px-3 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        selectedColor === c
                          ? 'border-indigo-500 bg-indigo-950/40 text-white'
                          : 'border-slate-800 bg-slate-900 text-slate-400'
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Preço e Pagamento */}
            <div className="pt-3 border-t border-slate-800 space-y-1">
              <span className="text-2xl font-bold text-white block">
                {formatCurrency(Number(product.price))}
              </span>
              <p className="text-xs text-slate-400">
                Ou até 12x de {formatCurrency(Number(product.price) / 12)} sem juros no cartão
              </p>
            </div>
          </div>

          {/* Botões de Ação */}
          <div className="space-y-3 pt-4 border-t border-slate-800">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="py-3 px-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 border border-slate-700 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <ShoppingBag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Adicionar</span>
              </button>

              <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="py-3 px-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-1.5 transition-colors"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Comprar Agora</span>
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1 text-center text-[10px] text-slate-400">
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-0.5" />
                <span>Garantia 12m</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <Truck className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-0.5" />
                <span>Envio Seguro</span>
              </div>
              <div className="p-2 rounded bg-slate-900 border border-slate-800">
                <CreditCard className="w-3.5 h-3.5 text-indigo-400 mx-auto mb-0.5" />
                <span>Até 12x</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Ficha Técnica */}
      {product.specifications && (
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-indigo-400" />
            Especificações Técnicas
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
            {product.specifications.processor && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Processador</span>
                <p className="font-semibold text-white mt-0.5">{product.specifications.processor}</p>
              </div>
            )}
            {product.specifications.ram && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Memória RAM</span>
                <p className="font-semibold text-white mt-0.5">{product.specifications.ram} GB</p>
              </div>
            )}
            {product.specifications.storage && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Armazenamento</span>
                <p className="font-semibold text-white mt-0.5">{product.specifications.storage} GB</p>
              </div>
            )}
            {product.specifications.screenSize && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-lg">
                <span className="text-[10px] text-slate-400 uppercase font-semibold">Tela</span>
                <p className="font-semibold text-white mt-0.5">{product.specifications.screenSize}</p>
              </div>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
