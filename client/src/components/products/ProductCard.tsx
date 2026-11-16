'use client'

import React from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { Product } from '../../types'
import { formatCurrency, formatStorage } from '../../lib/utils'
import { useCartStore } from '../../store/useCartStore'
import { ProductImage } from './ProductImage'

export function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartStore()
  const spec = product.specifications
  const price = Number(product.price)
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null
  const soldOut = product.stock <= 0

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      price,
      quantity: 1,
      image: product.images[0]?.url || '',
      stock: product.stock,
      color: spec?.colors?.[0],
      storage: spec?.storage ? formatStorage(spec.storage) : undefined,
    })
  }

  return (
    <article className="group relative flex flex-col">
      <Link href={`/products/${product.slug}`} className="stage relative block aspect-[4/5] overflow-hidden">
        <ProductImage
          src={product.images[0]?.url}
          alt={product.name}
          loading="lazy"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
        />
        {soldOut && (
          <span className="absolute left-3 top-3 rounded-full bg-white px-3 py-1 text-xs font-semibold text-graphite">Esgotado</span>
        )}
        {!soldOut && compareAt && compareAt > price && (
          <span className="absolute left-3 top-3 rounded-full bg-signal px-3 py-1 text-xs font-semibold text-white">
            -{Math.round((1 - price / compareAt) * 100)}%
          </span>
        )}
      </Link>

      <div className="flex flex-1 flex-col px-1 pt-4">
        <p className="text-sm text-graphite">{product.brand}</p>
        <h3 className="mt-0.5 font-display text-lg font-semibold leading-snug">
          <Link href={`/products/${product.slug}`} className="hover:underline">
            {product.name}
          </Link>
        </h3>
        {spec?.ram && spec?.storage && (
          <p className="mt-1 text-sm text-graphite">
            {spec.ram} GB de RAM, {formatStorage(spec.storage)}
          </p>
        )}

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div>
            {compareAt && compareAt > price && (
              <p className="text-xs text-graphite line-through">{formatCurrency(compareAt)}</p>
            )}
            <p className="price text-xl">{formatCurrency(price)}</p>
          </div>
          <button
            onClick={handleQuickAdd}
            disabled={soldOut}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-ink text-white hover:bg-signal disabled:bg-line disabled:text-graphite"
            aria-label={`Adicionar ${product.name} ao carrinho`}
            title="Adicionar ao carrinho"
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  )
}
