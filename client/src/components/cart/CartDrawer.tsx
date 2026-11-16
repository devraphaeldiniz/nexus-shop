'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Minus, Plus, Trash2, X } from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import { formatCurrency } from '../../lib/utils'
import { ProductImage } from '../products/ProductImage'

export function CartDrawer() {
  const router = useRouter()
  const { items, isOpen, setIsOpen, updateQuantity, removeItem, subtotal } = useCartStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  // Fecha com Esc
  useEffect(() => {
    if (!isOpen) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setIsOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isOpen, setIsOpen])

  if (!mounted || !isOpen) return null

  const goToCheckout = () => {
    setIsOpen(false)
    router.push('/checkout')
  }

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label="Carrinho">
      <div onClick={() => setIsOpen(false)} className="absolute inset-0 bg-ink/40" />

      <aside className="animate-drawer absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white">
        <div className="flex items-center justify-between border-b border-line px-6 py-5">
          <h2 className="text-xl font-bold">Seu carrinho</h2>
          <button onClick={() => setIsOpen(false)} className="rounded-full p-2 text-graphite hover:bg-paper hover:text-ink" aria-label="Fechar carrinho">
            <X className="h-5 w-5" />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="font-display text-lg font-semibold">Seu carrinho está vazio</p>
            <p className="text-sm text-graphite">Escolha um smartphone na vitrine para começar.</p>
            <Link href="/products" onClick={() => setIsOpen(false)} className="btn-primary">
              Ver smartphones
            </Link>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-6">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 py-5">
                  <div className="stage h-24 w-20 flex-shrink-0 overflow-hidden rounded-2xl">
                    <ProductImage src={item.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <Link
                          href={`/products/${item.slug}`}
                          onClick={() => setIsOpen(false)}
                          className="line-clamp-2 text-sm font-semibold leading-snug hover:underline"
                        >
                          {item.name}
                        </Link>
                        <p className="mt-0.5 text-xs text-graphite">
                          {[item.color, item.storage].filter(Boolean).join(', ')}
                        </p>
                      </div>
                      <button
                        onClick={() => removeItem(item.productId, item.color, item.storage)}
                        className="rounded-full p-1.5 text-graphite hover:bg-paper hover:text-danger"
                        aria-label={`Remover ${item.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="mt-auto flex items-center justify-between pt-3">
                      <div className="flex items-center rounded-full border border-line">
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity - 1, item.color, item.storage)}
                          className="p-2 text-graphite hover:text-ink"
                          aria-label="Diminuir quantidade"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-6 text-center text-sm font-semibold tabular-nums">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.productId, item.quantity + 1, item.color, item.storage)}
                          disabled={item.stock > 0 && item.quantity >= item.stock}
                          className="p-2 text-graphite hover:text-ink disabled:opacity-30"
                          aria-label="Aumentar quantidade"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <span className="price text-base">{formatCurrency(item.price * item.quantity)}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>

            <div className="space-y-4 border-t border-line px-6 py-5">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-graphite">Subtotal</span>
                <span className="price text-2xl">{formatCurrency(subtotal())}</span>
              </div>
              <p className="text-xs text-graphite">Frete e cupom são calculados no próximo passo.</p>
              <button onClick={goToCheckout} className="btn-buy w-full py-3.5 text-base">
                Finalizar compra
              </button>
              <button onClick={() => setIsOpen(false)} className="w-full text-sm font-medium text-graphite hover:text-ink">
                Continuar comprando
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  )
}
