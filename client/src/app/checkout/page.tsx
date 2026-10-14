'use client'

import React, { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  ShieldCheck,
  CreditCard,
  QrCode,
  Truck,
  Tag,
  CheckCircle,
  Lock,
  ArrowRight,
} from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import { formatCurrency } from '../../lib/utils'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()

  // Estados do formulário
  const [address, setAddress] = useState({
    street: 'Av. Paulista',
    number: '1000',
    complement: 'Apt 42',
    neighborhood: 'Bela Vista',
    city: 'São Paulo',
    state: 'SP',
    zipCode: '01310-100',
  })

  const [paymentGateway, setPaymentGateway] = useState<'STRIPE' | 'MERCADOPAGO'>('MERCADOPAGO')
  const [paymentMethod, setPaymentMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')
  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState<any>(null)

  const rawSubtotal = subtotal()
  const shippingCost = rawSubtotal > 3000 ? 0 : 49.9
  const total = Math.max(0, rawSubtotal - discount + shippingCost)

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault()
    setCouponError('')

    const code = couponCode.trim().toUpperCase()
    if (code === 'NEXUS10') {
      const disc = rawSubtotal * 0.1
      setDiscount(disc)
      setCouponApplied(true)
    } else if (code === 'PRIMEIRACOMPRA') {
      setDiscount(150)
      setCouponApplied(true)
    } else {
      setCouponError('Cupom inválido ou expirado.')
    }
  }

  const handlePlaceOrder = async () => {
    if (items.length === 0) return
    setIsSubmitting(true)

    try {
      // Simulação rápida caso backend esteja em mock
      const mockOrder = {
        id: `nex_${Date.now().toString().slice(-6)}`,
        status: 'CONFIRMED',
        paymentGateway,
        paymentMethod,
        total,
        address,
      }

      setTimeout(() => {
        setOrderSuccess(mockOrder)
        clearCart()
        setIsSubmitting(false)
      }, 1200)
    } catch {
      setIsSubmitting(false)
    }
  }

  if (orderSuccess) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-20 h-20 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto border border-emerald-500/30">
          <CheckCircle className="w-10 h-10" />
        </div>
        <h1 className="text-3xl font-black text-white">Pedido Realizado com Sucesso!</h1>
        <p className="text-slate-300 text-sm">
          Número do pedido: <strong className="text-indigo-400 font-mono">#{orderSuccess.id}</strong>
        </p>

        {/* Detalhes do Pagamento */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-4">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800">
            <div>
              <p className="text-xs text-slate-400">Total Pago</p>
              <p className="text-xl font-bold text-white">{formatCurrency(orderSuccess.total)}</p>
            </div>
            <span className="px-3 py-1 bg-emerald-950 text-emerald-400 border border-emerald-800 text-xs font-bold rounded-full">
              PAGAMENTO CONFIRMADO
            </span>
          </div>

          <div className="text-xs text-slate-300 space-y-1">
            <p className="font-semibold text-white">Endereço de Entrega:</p>
            <p>
              {orderSuccess.address.street}, {orderSuccess.address.number} - {orderSuccess.address.city}/{orderSuccess.address.state}
            </p>
            <p className="text-slate-400">Previsão de entrega: 2 a 4 dias úteis via Envio Expresso com seguro.</p>
          </div>
        </div>

        <button
          onClick={() => router.push('/products')}
          className="px-8 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-xl shadow-lg transition-colors"
        >
          Continuar Comprando
        </button>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Seu carrinho está vazio</h2>
        <p className="text-xs text-slate-400">Adicione um smartphone ao carrinho antes de prosseguir com o checkout.</p>
        <button
          onClick={() => router.push('/products')}
          className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Ir para o Catálogo
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-3xl font-black text-white">Finalização de Pedido</h1>
        <p className="text-xs text-slate-400 mt-1">Ambiente seguro com criptografia de ponta a ponta (TLS 1.3)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* ==================== FORMULÁRIO DE CHECKOUT ==================== */}
        <div className="lg:col-span-7 space-y-8">
          {/* 1. Endereço */}
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">1. Endereço de Entrega</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="text-slate-400 mb-1 block">CEP</label>
                <input
                  type="text"
                  value={address.zipCode}
                  onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 mb-1 block">Cidade / UF</label>
                <input
                  type="text"
                  value={`${address.city} - ${address.state}`}
                  readOnly
                  className="w-full bg-slate-800/50 border border-slate-700/50 rounded-xl p-3 text-slate-400"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="text-slate-400 mb-1 block">Logradouro / Rua</label>
                <input
                  type="text"
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 mb-1 block">Número</label>
                <input
                  type="text"
                  value={address.number}
                  onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>
              <div>
                <label className="text-slate-400 mb-1 block">Complemento</label>
                <input
                  type="text"
                  value={address.complement}
                  onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                />
              </div>
            </div>
          </section>

          {/* 2. Seleção de Gateway de Pagamento */}
          <section className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <div className="flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-indigo-400" />
              <h2 className="text-base font-bold text-white">2. Método de Pagamento</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Mercado Pago */}
              <div
                onClick={() => {
                  setPaymentGateway('MERCADOPAGO')
                  setPaymentMethod('PIX')
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentGateway === 'MERCADOPAGO'
                    ? 'border-indigo-500 bg-indigo-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-white">Mercado Pago</span>
                  <span className="text-[10px] text-emerald-400 font-bold bg-emerald-950 border border-emerald-800 px-2 py-0.5 rounded-full">
                    PIX 10% OFF
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Pague no PIX com confirmação em segundos ou parcele no cartão nacional.
                </p>
              </div>

              {/* Stripe */}
              <div
                onClick={() => {
                  setPaymentGateway('STRIPE')
                  setPaymentMethod('CREDIT_CARD')
                }}
                className={`p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                  paymentGateway === 'STRIPE'
                    ? 'border-indigo-500 bg-indigo-950/20'
                    : 'border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-white">Stripe</span>
                  <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950 border border-indigo-800 px-2 py-0.5 rounded-full">
                    Internacional
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  Cartão de Crédito global (Visa, Master, Amex, Apple Pay) com proteção Stripe Radar.
                </p>
              </div>
            </div>

            {/* Opções específicas do gateway selecionado */}
            {paymentGateway === 'MERCADOPAGO' && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-400" />
                  <span className="text-xs font-bold text-white">Pagamento via PIX Instantâneo</span>
                </div>
                <p className="text-xs text-slate-400">
                  O QR Code oficial do Banco Central será gerado e exibido imediatamente após a confirmação.
                </p>
              </div>
            )}

            {paymentGateway === 'STRIPE' && (
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-indigo-400" />
                  <span className="text-xs font-bold text-white">Formulário Seguro Stripe Elements</span>
                </div>
                <div className="space-y-2 text-xs">
                  <input
                    type="text"
                    placeholder="Número do Cartão (•••• •••• •••• ••••)"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="MM/AA"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                    />
                    <input
                      type="text"
                      placeholder="CVC"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 text-white"
                    />
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ==================== RESUMO DO PEDIDO ==================== */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
            <h2 className="text-base font-bold text-white">Resumo dos Smartphones</h2>

            <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs">
                  <img
                    src={item.image}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-lg bg-slate-800"
                  />
                  <div className="flex-1">
                    <p className="font-semibold text-white line-clamp-1">{item.name}</p>
                    <p className="text-slate-400 text-[10px]">
                      Qtd: {item.quantity} · {item.color} · {item.storage}
                    </p>
                  </div>
                  <span className="font-bold text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cupom de Desconto */}
            <form onSubmit={handleApplyCoupon} className="pt-4 border-t border-slate-800">
              <label className="text-xs font-semibold text-slate-300 block mb-2">
                Possui Cupom Promocional?
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Ex: NEXUS10 ou PRIMEIRACOMPRA"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white uppercase placeholder-slate-500"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700"
                >
                  Aplicar
                </button>
              </div>
              {couponApplied && (
                <p className="text-[11px] text-emerald-400 font-semibold mt-1.5 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5" /> Cupom de desconto aplicado com sucesso!
                </p>
              )}
              {couponError && (
                <p className="text-[11px] text-rose-400 mt-1.5">{couponError}</p>
              )}
            </form>

            {/* Cálculos */}
            <div className="space-y-2 pt-4 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(rawSubtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400 font-medium">
                  <span>Desconto de Cupom</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Frete Seguro</span>
                <span className="text-emerald-400">
                  {shippingCost === 0 ? 'Grátis' : formatCurrency(shippingCost)}
                </span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-white pt-2 border-t border-slate-800">
                <span>Total a Pagar</span>
                <span className="text-indigo-400 text-lg">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50 text-white font-bold text-sm rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-600/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              {isSubmitting ? (
                <span>Processando Pagamento...</span>
              ) : (
                <>
                  <span>Confirmar & Pagar Agora</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Garantia de Entrega Nexus ou seu Dinheiro de Volta</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
