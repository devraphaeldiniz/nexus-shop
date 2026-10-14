'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/navigation'
import { useRouter } from 'next/navigation'
import { X, Trash2, Plus, Minus, ShoppingBag, ArrowRight } from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import { formatCurrency } from '../../lib/utils'

export function CartDrawer() {
  const router = useRouter()
  const {
    items,
    isOpen,
    setIsOpen,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
  } = useCartStore()

  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted || !isOpen) return null

  const handleCheckout = () => {
    setIsOpen(false)
    router.push('/checkout')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop com blur */}
      <div
        onClick={() => setIsOpen(false)}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 text-white flex flex-col shadow-2xl">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-indigo-400" />
              <h2 className="text-lg font-bold">Seu Carrinho Nexus</h2>
              <span className="text-xs text-slate-400">({items.length} itens)</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Lista de Itens */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-slate-800/80 flex items-center justify-center text-slate-500 mb-4">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h3 className="text-base font-semibold text-slate-200">
                  Seu carrinho está vazio
                </h3>
                <p className="text-xs text-slate-400 mt-1 max-w-[240px]">
                  Explore nosso catálogo e encontre o smartphone dos seus sonhos.
                </p>
                <button
                  onClick={() => setIsOpen(false)}
                  className="mt-6 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-full transition-colors"
                >
                  Ver Smartphones
                </button>
              </div>
            ) : (
              items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-3.5 bg-slate-800/50 border border-slate-700/50 rounded-xl"
                >
                  {/* Foto miniatura */}
                  <div className="relative w-20 h-20 bg-slate-800 rounded-lg overflow-hidden flex-shrink-0">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-slate-500">
                        Foto
                      </div>
                    )}
                  </div>

                  {/* Informações */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-indigo-400 uppercase tracking-wider">
                        {item.brand}
                      </span>
                      <h4 className="text-xs font-semibold text-white line-clamp-1">
                        {item.name}
                      </h4>
                      <div className="flex gap-2 mt-0.5 text-[10px] text-slate-400">
                        {item.color && <span>Cor: {item.color}</span>}
                        {item.storage && <span>· {item.storage}</span>}
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs font-bold text-white">
                        {formatCurrency(item.price * item.quantity)}
                      </span>

                      {/* Controles de Quantidade */}
                      <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-700 rounded-lg p-1">
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity - 1,
                              item.color,
                              item.storage
                            )
                          }
                          className="p-1 hover:text-indigo-400 transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="text-xs font-semibold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() =>
                            updateQuantity(
                              item.productId,
                              item.quantity + 1,
                              item.color,
                              item.storage
                            )
                          }
                          className="p-1 hover:text-indigo-400 transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>

                      <button
                        onClick={() =>
                          removeItem(item.productId, item.color, item.storage)
                        }
                        className="p-1.5 text-slate-500 hover:text-rose-400 transition-colors"
                        title="Remover item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer do Carrinho */}
          {items.length > 0 && (
            <div className="p-6 border-t border-slate-800 bg-slate-900/90 space-y-4">
              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Subtotal</span>
                  <span>{formatCurrency(subtotal())}</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Frete estimado</span>
                  <span className="text-emerald-400">
                    {subtotal() > 3000 ? 'Grátis' : formatCurrency(49.9)}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                  <span>Total</span>
                  <span className="text-indigo-400 font-extrabold text-base">
                    {formatCurrency(subtotal() + (subtotal() > 3000 ? 0 : 49.9))}
                  </span>
                </div>
              </div>

              <button
                onClick={handleCheckout}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Finalizar Compra</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={() => clearCart()}
                className="w-full text-center text-xs text-slate-500 hover:text-rose-400 transition-colors"
              >
                Limpar carrinho
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
