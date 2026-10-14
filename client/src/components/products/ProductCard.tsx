'use client'

import React from 'react'
import Link from 'next/link'
import { Star, ShoppingCart, Zap, Check } from 'lucide-react'
import { Product } from '../../types'
import { formatCurrency } from '../../lib/utils'
import { useCartStore } from '../../store/useCartStore'

interface ProductCardProps {
  product: Product
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore()

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      price: Number(product.price),
      quantity: 1,
      image: product.images[0]?.url || '',
      stock: product.stock,
      color: product.specifications?.colors?.[0],
      storage: `${product.specifications?.storage}GB`,
    })
  }

  const installmentValue = Number(product.price) / 12

  return (
    <div className="group relative bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden hover:border-indigo-500/50 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all duration-300 flex flex-col justify-between">
      {/* Imagem do Produto com Badges */}
      <Link href={`/products/${product.slug}`} className="block relative pt-[90%] bg-slate-950/50 overflow-hidden">
        {product.images[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-600 text-sm">
            Sem Imagem
          </div>
        )}

        {/* Badges superiores */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5">
          {product.isFeatured && (
            <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow">
              <Zap className="w-3 h-3 fill-white" /> Flagship
            </span>
          )}
          {product.compareAtPrice && (
            <span className="bg-rose-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow">
              Oferta Especial
            </span>
          )}
        </div>

        {/* Marca */}
        <div className="absolute top-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-700/60 text-slate-200 text-[10px] font-bold uppercase px-2.5 py-1 rounded-full">
          {product.brand}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Avaliação e Vendas */}
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1 text-amber-400 font-semibold">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{product.avgRating.toFixed(1)}</span>
              <span className="text-slate-500 text-[11px]">({product.totalReviews})</span>
            </div>
            <span className="text-[11px] text-slate-500">
              {product.totalSold} vendidos
            </span>
          </div>

          {/* Nome */}
          <Link href={`/products/${product.slug}`}>
            <h3 className="text-sm font-bold text-white group-hover:text-indigo-400 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Chips de Especificações */}
          <div className="flex flex-wrap gap-1.5 my-3">
            <span className="text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/50 px-2 py-0.5 rounded-md">
              {product.specifications?.ram}GB RAM
            </span>
            <span className="text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/50 px-2 py-0.5 rounded-md">
              {product.specifications?.storage}GB
            </span>
            <span className="text-[10px] font-medium bg-slate-800 text-emerald-400 border border-slate-700/50 px-2 py-0.5 rounded-md">
              5G Ultra
            </span>
          </div>
        </div>

        {/* Bloco de Preço e Ação */}
        <div className="pt-3 border-t border-slate-800 mt-2">
          {product.compareAtPrice && (
            <p className="text-xs text-slate-500 line-through">
              {formatCurrency(Number(product.compareAtPrice))}
            </p>
          )}

          <div className="flex items-baseline justify-between">
            <div>
              <p className="text-lg font-black text-white">
                {formatCurrency(Number(product.price))}
              </p>
              <p className="text-[11px] text-slate-400">
                12x de <span className="text-slate-200 font-medium">{formatCurrency(installmentValue)}</span> sem juros
              </p>
            </div>

            {/* Botão de Adicionar ao Carrinho */}
            <button
              onClick={handleQuickAdd}
              disabled={product.stock <= 0}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-xl transition-all shadow-md shadow-indigo-600/30 hover:scale-105 active:scale-95"
              title="Adicionar ao Carrinho"
            >
              <ShoppingCart className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
