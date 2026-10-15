'use client'

import React from 'react'
import Link from 'next/link'
import { Star, ShoppingCart } from 'lucide-react'
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
    <div className="group animate-fade-up bg-slate-900 border border-slate-800 rounded-xl overflow-hidden hover:-translate-y-1 hover:border-indigo-500/60 transition-all duration-300 flex flex-col justify-between">
      {/* Imagem do Produto */}
      <Link href={`/products/${product.slug}`} className="block relative pt-[85%] bg-slate-950/60 overflow-hidden">
        {product.images[0]?.url ? (
          <img
            src={product.images[0].url}
            alt={product.name}
            className="absolute inset-0 w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-slate-500 text-xs">
            Sem foto cadastrada
          </div>
        )}

        <div className="absolute top-2.5 left-2.5 bg-slate-950/80 border border-slate-800 text-slate-300 text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded">
          {product.brand}
        </div>
      </Link>

      {/* Conteúdo */}
      <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
        <div>
          <div className="flex items-center gap-1 text-amber-400 text-xs font-semibold mb-1">
            <Star className="w-3.5 h-3.5 fill-amber-400" />
            <span>{product.avgRating ? product.avgRating.toFixed(1) : '5.0'}</span>
            <span className="text-slate-500 text-[10px]">({product.totalReviews || 0})</span>
          </div>

          <Link href={`/products/${product.slug}`}>
            <h3 className="text-xs font-semibold text-white hover:text-indigo-400 transition-colors line-clamp-2">
              {product.name}
            </h3>
          </Link>

          {/* Especificações resumidas */}
          <div className="flex flex-wrap gap-1 mt-2 text-[10px] text-slate-400">
            {product.specifications?.storage && (
              <span className="bg-slate-800 px-1.5 py-0.5 rounded">
                {product.specifications.storage}GB
              </span>
            )}
            {product.specifications?.ram && (
              <span className="bg-slate-800 px-1.5 py-0.5 rounded">
                {product.specifications.ram}GB RAM
              </span>
            )}
          </div>
        </div>

        {/* Preço e Botão */}
        <div className="pt-3 border-t border-slate-800/80 flex items-end justify-between">
          <div>
            <p className="text-sm font-bold text-white">
              {formatCurrency(Number(product.price))}
            </p>
            <p className="text-[10px] text-slate-400 mt-0.5">
              12x de {formatCurrency(installmentValue)} sem juros
            </p>
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={product.stock <= 0}
            className="p-2 bg-indigo-600 hover:bg-indigo-500 hover:scale-105 active:scale-95 disabled:bg-slate-800 disabled:text-slate-600 text-white rounded-lg transition-all duration-200"
            title="Adicionar ao carrinho"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  )
}
