'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  CreditCard,
  QrCode,
  Truck,
  Tag,
  CheckCircle,
  Lock,
  ArrowRight,
  Copy,
  Check,
  AlertCircle,
} from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'
import { formatCurrency } from '../../lib/utils'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const { user, accessToken, isAuthenticated } = useAuthStore()

  const [mounted, setMounted] = useState(false)
  const [address, setAddress] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
  })

  const [shippingOptions, setShippingOptions] = useState<any[]>([])
  const [selectedShipping, setSelectedShipping] = useState<any>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)

  const [gateways, setGateways] = useState<{ stripe: boolean; mercadoPago: boolean }>({
    stripe: true,
    mercadoPago: true,
  })
  const [selectedGateway, setSelectedGateway] = useState<'MERCADOPAGO' | 'STRIPE'>('MERCADOPAGO')
  const [selectedMethod, setSelectedMethod] = useState<'PIX' | 'CREDIT_CARD'>('PIX')

  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [pixData, setPixData] = useState<{ qrCode?: string; qrCodeBase64?: string } | null>(null)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [copiedPix, setCopiedPix] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

  useEffect(() => {
    setMounted(true)
    loadStoreSettings()
  }, [])

  const loadStoreSettings = async () => {
    try {
      const res = await fetch(`${apiUrl}/settings/public`)
      if (res.ok) {
        const data = await res.json()
        setGateways({
          stripe: data.paymentGateways?.stripe?.enabled ?? true,
          mercadoPago: data.paymentGateways?.mercadoPago?.enabled ?? true,
        })
      }
    } catch {}
  }

  // Busca de CEP oficial
  const handleZipCodeBlur = async () => {
    const cleanZip = address.zipCode.replace(/\D/g, '')
    if (cleanZip.length !== 8) return

    setLoadingShipping(true)
    try {
      const res = await fetch(`${apiUrl}/shipping/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ zipCode: cleanZip, subtotal: subtotal() }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.address) {
          setAddress((prev) => ({
            ...prev,
            city: data.address.city || prev.city,
            state: data.address.state || prev.state,
            neighborhood: data.address.neighborhood || prev.neighborhood,
            street: data.address.street || prev.street,
          }))
        }
        setShippingOptions(data.options || [])
        if (data.options?.length > 0) {
          setSelectedShipping(data.options[0])
        }
      }
    } catch {
    } finally {
      setLoadingShipping(false)
    }
  }

  // Aplicar Cupom Real via Backend
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setCouponError('')
    if (!couponCode.trim()) return

    try {
      const res = await fetch(`${apiUrl}/coupons/validate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ code: couponCode.trim(), orderAmount: subtotal() }),
      })

      const data = await res.json()
      if (res.ok && data.valid) {
        setDiscount(data.coupon.discountAmount)
        setCouponApplied(true)
      } else {
        setCouponError(data.message || 'Cupom inválido ou expirado.')
        setDiscount(0)
        setCouponApplied(false)
      }
    } catch {
      setCouponError('Não foi possível validar o cupom.')
    }
  }

  // Enviar Pedido Real
  const handlePlaceOrder = async () => {
    if (!isAuthenticated) {
      alert('Você precisa estar logado para concluir a compra.')
      router.push('/login')
      return
    }

    if (!address.street || !address.number || !address.city || !address.state) {
      alert('Por favor, preencha o endereço completo de entrega.')
      return
    }

    setIsSubmitting(true)
    try {
      // 1. Cadastrar endereço ou usar o selecionado
      const orderPayload = {
        address: {
          street: address.street,
          number: address.number,
          complement: address.complement || undefined,
          neighborhood: address.neighborhood,
          city: address.city,
          state: address.state,
          zipCode: address.zipCode,
        },
        paymentGateway: selectedGateway,
        paymentMethod: selectedMethod,
        couponCode: couponApplied ? couponCode.trim() : undefined,
      }

      // 2. Chamar endpoint de criação de pedido
      const res = await fetch(`${apiUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(orderPayload),
      })

      const data = await res.json()

      if (!res.ok) {
        alert(data.message || 'Falha ao registrar pedido.')
        setIsSubmitting(false)
        return
      }

      const order = data.order
      setCreatedOrder(order)
      clearCart()

      // 3. Se for PIX no Mercado Pago, gera o QR Code e código copia-e-cola
      if (selectedGateway === 'MERCADOPAGO' && selectedMethod === 'PIX') {
        const pixRes = await fetch(`${apiUrl}/payments/mercadopago/create-pix`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ orderId: order.id }),
        })

        if (pixRes.ok) {
          const pixResult = await pixRes.json()
          setPixData(pixResult)
        }
      }
    } catch (err) {
      alert('Erro ao processar pedido. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const copyPixCode = () => {
    if (pixData?.qrCode) {
      navigator.clipboard.writeText(pixData.qrCode)
      setCopiedPix(true)
      setTimeout(() => setCopiedPix(false), 2500)
    }
  }

  if (!mounted) return null

  // Tela de Pedido Concluído / Pagamento Pendente PIX
  if (createdOrder) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-950 border border-emerald-800 text-emerald-400 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Pedido Registrado com Sucesso!</h1>
        <p className="text-xs text-slate-400">
          Identificador do pedido: <span className="font-mono font-bold text-indigo-400">#{createdOrder.id.slice(-8)}</span>
        </p>

        {pixData?.qrCode && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 text-left space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
              <QrCode className="w-4 h-4" />
              <span>Pague via PIX para Liberação Imediata</span>
            </div>

            {pixData.qrCodeBase64 && (
              <div className="flex justify-center p-4 bg-white rounded-xl max-w-[200px] mx-auto">
                <img
                  src={`data:image/png;base64,${pixData.qrCodeBase64}`}
                  alt="QR Code PIX"
                  className="w-full h-auto"
                />
              </div>
            )}

            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Código Copia e Cola PIX:</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={pixData.qrCode}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-[10px] text-slate-300 font-mono truncate"
                />
                <button
                  onClick={copyPixCode}
                  className="px-3 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 flex-shrink-0"
                >
                  {copiedPix ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedPix ? 'Copiado!' : 'Copiar'}</span>
                </button>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 text-center">
              Abra o app do seu banco, escolha <strong>PIX Copia e Cola</strong> e conclua o pagamento.
              A confirmação é automática.
            </p>
          </div>
        )}

        <button
          onClick={() => router.push('/products')}
          className="px-6 py-2.5 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg"
        >
          Voltar para a Loja
        </button>
      </div>
    )
  }

  const rawSubtotal = subtotal()
  const shippingCost = selectedShipping?.price ?? (rawSubtotal > 3000 ? 0 : 39.9)
  const total = Math.max(0, rawSubtotal - discount + shippingCost)

  if (items.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-base font-bold text-white">Seu carrinho está vazio</h2>
        <p className="text-xs text-slate-400">Adicione ao menos um smartphone ao carrinho para finalizar a compra.</p>
        <button
          onClick={() => router.push('/products')}
          className="px-4 py-2 bg-indigo-600 text-white text-xs font-semibold rounded-lg"
        >
          Explorar Catálogo
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
      <div className="border-b border-slate-800 pb-4">
        <h1 className="text-2xl font-bold text-white tracking-tight">Finalização da Compra</h1>
        <p className="text-xs text-slate-400 mt-1">Ambiente protegido com criptografia bancária</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Formulário de Endereço & Pagamento */}
        <div className="lg:col-span-7 space-y-6">
          {/* 1. Endereço com Busca de CEP Oficial */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">1. Endereço e Cálculo de Frete</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 mb-1 block">CEP *</label>
                <div className="relative">
                  <input
                    type="text"
                    placeholder="00000-000"
                    value={address.zipCode}
                    onChange={(e) => setAddress({ ...address, zipCode: e.target.value })}
                    onBlur={handleZipCodeBlur}
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                  />
                  {loadingShipping && (
                    <span className="absolute right-3 top-3 text-[10px] text-indigo-400 animate-pulse">
                      Consultando...
                    </span>
                  )}
                </div>
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Cidade / UF</label>
                <input
                  type="text"
                  placeholder="Preenchimento automático"
                  value={address.city ? `${address.city} - ${address.state}` : ''}
                  readOnly
                  className="w-full bg-slate-800/60 border border-slate-700/60 rounded-lg p-2.5 text-slate-300"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-slate-400 mb-1 block">Logradouro / Rua *</label>
                <input
                  type="text"
                  placeholder="Rua, Avenida, Praça..."
                  value={address.street}
                  onChange={(e) => setAddress({ ...address, street: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Número *</label>
                <input
                  type="text"
                  placeholder="123"
                  value={address.number}
                  onChange={(e) => setAddress({ ...address, number: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 mb-1 block">Complemento</label>
                <input
                  type="text"
                  placeholder="Apto, Bloco (opcional)"
                  value={address.complement}
                  onChange={(e) => setAddress({ ...address, complement: e.target.value })}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2.5 text-white"
                />
              </div>
            </div>

            {/* Opções de Envio Retornadas pelo Backend */}
            {shippingOptions.length > 0 && (
              <div className="pt-3 border-t border-slate-800 space-y-2">
                <p className="text-xs font-semibold text-slate-300">Selecione o Tipo de Frete:</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {shippingOptions.map((opt) => (
                    <div
                      key={opt.id}
                      onClick={() => setSelectedShipping(opt)}
                      className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                        selectedShipping?.id === opt.id
                          ? 'border-indigo-500 bg-indigo-950/20'
                          : 'border-slate-800 bg-slate-950/40'
                      }`}
                    >
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-white">{opt.name}</span>
                        <span className="font-bold text-emerald-400">
                          {opt.price === 0 ? 'Grátis' : formatCurrency(opt.price)}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">Prazo: {opt.deadline}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </section>

          {/* 2. Seleção de Gateway e Pagamento Real */}
          <section className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-indigo-400" />
              <h2 className="text-sm font-bold text-white">2. Forma de Pagamento</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {gateways.mercadoPago && (
                <div
                  onClick={() => {
                    setSelectedGateway('MERCADOPAGO')
                    setSelectedMethod('PIX')
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedGateway === 'MERCADOPAGO'
                      ? 'border-indigo-500 bg-indigo-950/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">PIX (Mercado Pago)</span>
                    <span className="text-[10px] font-semibold text-emerald-400 bg-emerald-950 border border-emerald-800 px-1.5 py-0.5 rounded">
                      Liberação Imediata
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Gera QR Code oficial para pagamento direto no app do seu banco.
                  </p>
                </div>
              )}

              {gateways.stripe && (
                <div
                  onClick={() => {
                    setSelectedGateway('STRIPE')
                    setSelectedMethod('CREDIT_CARD')
                  }}
                  className={`p-4 rounded-xl border cursor-pointer transition-colors ${
                    selectedGateway === 'STRIPE'
                      ? 'border-indigo-500 bg-indigo-950/20'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-bold text-white">Cartão de Crédito</span>
                    <span className="text-[10px] font-semibold text-indigo-400 bg-indigo-950 border border-indigo-800 px-1.5 py-0.5 rounded">
                      Até 12x
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Processamento seguro via Stripe com proteção antifraude.
                  </p>
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Resumo do Pedido & Ação */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 space-y-4">
            <h2 className="text-sm font-bold text-white">Itens do Pedido ({items.length})</h2>

            <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
              {items.map((item) => (
                <div key={item.id} className="flex gap-3 text-xs">
                  <img
                    src={item.image || 'https://via.placeholder.com/60'}
                    alt={item.name}
                    className="w-10 h-10 object-cover rounded bg-slate-800 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white truncate">{item.name}</p>
                    <p className="text-slate-400 text-[10px]">Qtd: {item.quantity}</p>
                  </div>
                  <span className="font-semibold text-white">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Cupom */}
            <form onSubmit={handleApplyCoupon} className="pt-3 border-t border-slate-800">
              <label className="text-[11px] font-medium text-slate-300 block mb-1.5">Cupom Promocional</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Código do cupom"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase"
                />
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs rounded-lg border border-slate-700"
                >
                  Aplicar
                </button>
              </div>
              {couponApplied && (
                <p className="text-[10px] text-emerald-400 font-medium mt-1">Cupom aplicado com sucesso!</p>
              )}
              {couponError && (
                <p className="text-[10px] text-rose-400 mt-1">{couponError}</p>
              )}
            </form>

            {/* Totais */}
            <div className="space-y-1.5 pt-3 border-t border-slate-800 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Subtotal</span>
                <span>{formatCurrency(rawSubtotal)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-400">
                  <span>Desconto</span>
                  <span>- {formatCurrency(discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-400">
                <span>Frete</span>
                <span>{shippingCost === 0 ? 'Grátis' : formatCurrency(shippingCost)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-white pt-2 border-t border-slate-800">
                <span>Total</span>
                <span className="text-indigo-400">{formatCurrency(total)}</span>
              </div>
            </div>

            <button
              onClick={handlePlaceOrder}
              disabled={isSubmitting}
              className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-semibold text-xs rounded-lg flex items-center justify-center gap-2 transition-colors shadow-sm"
            >
              <span>{isSubmitting ? 'Gerando Cobrança...' : 'Confirmar Pedido & Pagar'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
