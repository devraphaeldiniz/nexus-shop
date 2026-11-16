'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Check, CreditCard, QrCode } from 'lucide-react'
import { useCartStore } from '../../store/useCartStore'
import { useAuthStore } from '../../store/useAuthStore'
import { formatCurrency } from '../../lib/utils'
import { ProductImage } from '../../components/products/ProductImage'
import { apiFetch } from '../../lib/api'
import { OrderPayment, PayableOrder } from '../../components/checkout/OrderPayment'
import { Address } from '../../types'

interface ShippingOption {
  id: 'express' | 'standard'
  name: string
  deadline: string
  price: number
  isFree: boolean
}

type Gateway = 'MERCADOPAGO' | 'STRIPE'
const METHOD_BY_GATEWAY: Record<Gateway, 'PIX' | 'CREDIT_CARD'> = {
  MERCADOPAGO: 'PIX',
  STRIPE: 'CREDIT_CARD',
}

const inputClass = 'field'

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, clearCart } = useCartStore()
  const { isAuthenticated } = useAuthStore()

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

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string>('') // '' = novo endereço

  const [shippingOptions, setShippingOptions] = useState<ShippingOption[]>([])
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null)
  const [loadingShipping, setLoadingShipping] = useState(false)
  const [shippingError, setShippingError] = useState('')

  const [gateways, setGateways] = useState<{ stripe: boolean; mercadoPago: boolean }>({
    stripe: true,
    mercadoPago: true,
  })
  const [selectedGateway, setSelectedGateway] = useState<Gateway>('MERCADOPAGO')

  const [couponCode, setCouponCode] = useState('')
  const [discount, setDiscount] = useState(0)
  const [couponApplied, setCouponApplied] = useState(false)
  const [couponError, setCouponError] = useState('')

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const [createdOrder, setCreatedOrder] = useState<PayableOrder | null>(null)

  const rawSubtotal = subtotal()

  useEffect(() => {
    setMounted(true)
    loadStoreSettings()
  }, [])

  // Endereços salvos do cliente: o padrão já vem selecionado
  useEffect(() => {
    if (!isAuthenticated) return
    apiFetch<{ addresses: Address[] }>('/account/addresses')
      .then(({ addresses }) => {
        setSavedAddresses(addresses)
        const preferred = addresses.find((a) => a.isDefault) || addresses[0]
        if (preferred) selectSavedAddress(preferred)
      })
      .catch(() => undefined)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated])

  const selectSavedAddress = (saved: Address | null) => {
    if (!saved) {
      setSelectedAddressId('')
      setAddress({ street: '', number: '', complement: '', neighborhood: '', city: '', state: '', zipCode: '' })
      setShippingOptions([])
      setSelectedShipping(null)
      return
    }
    setSelectedAddressId(saved.id)
    setAddress({
      street: saved.street,
      number: saved.number,
      complement: saved.complement || '',
      neighborhood: saved.neighborhood,
      city: saved.city,
      state: saved.state,
      zipCode: saved.zipCode,
    })
    calculateShipping(false, saved.zipCode)
  }

  // O frete depende do subtotal: se o carrinho mudar, recalcula
  useEffect(() => {
    if (mounted && address.zipCode.replace(/\D/g, '').length === 8) {
      calculateShipping(false)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSubtotal])

  const loadStoreSettings = async () => {
    try {
      const data = await apiFetch<{
        paymentGateways?: { stripe?: { enabled: boolean }; mercadoPago?: { enabled: boolean } }
      }>('/settings/public')
      const next = {
        stripe: !!data.paymentGateways?.stripe?.enabled,
        mercadoPago: !!data.paymentGateways?.mercadoPago?.enabled,
      }
      setGateways(next)
      if (!next.mercadoPago && next.stripe) setSelectedGateway('STRIPE')
    } catch {
      // Sem resposta da API: o servidor valida o gateway ao criar o pedido
    }
  }

  // Consulta CEP (ViaCEP) e opções de frete no backend
  const calculateShipping = async (fillAddress = true, zipCode = address.zipCode) => {
    const cleanZip = zipCode.replace(/\D/g, '')
    if (cleanZip.length !== 8) return

    setShippingError('')
    setLoadingShipping(true)
    try {
      const data = await apiFetch<{
        address?: { city: string; state: string; neighborhood: string; street: string }
        options: ShippingOption[]
      }>('/shipping/calculate', {
        method: 'POST',
        body: { zipCode: cleanZip, subtotal: rawSubtotal },
      })

      if (fillAddress && data.address) {
        setAddress((prev) => ({
          ...prev,
          city: data.address!.city || prev.city,
          state: data.address!.state || prev.state,
          neighborhood: data.address!.neighborhood || prev.neighborhood,
          street: data.address!.street || prev.street,
        }))
      }
      setShippingOptions(data.options || [])
      setSelectedShipping((current) =>
        data.options.find((o) => o.id === current?.id) || data.options[0] || null
      )
    } catch (err) {
      setShippingError(err instanceof Error ? err.message : 'Não foi possível calcular o frete.')
    } finally {
      setLoadingShipping(false)
    }
  }

  // Valida o cupom no backend (mesma regra aplicada na criação do pedido)
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    setCouponError('')
    if (!couponCode.trim()) return
    if (!isAuthenticated) {
      setCouponError('Entre na sua conta para usar cupons.')
      return
    }

    try {
      const data = await apiFetch<{ coupon: { discountAmount: number } }>('/coupons/validate', {
        method: 'POST',
        body: { code: couponCode.trim(), orderAmount: rawSubtotal },
      })
      setDiscount(data.coupon.discountAmount)
      setCouponApplied(true)
    } catch (err) {
      setCouponError(err instanceof Error ? err.message : 'Cupom inválido ou expirado.')
      setDiscount(0)
      setCouponApplied(false)
    }
  }

  const removeCoupon = () => {
    setCouponCode('')
    setDiscount(0)
    setCouponApplied(false)
    setCouponError('')
  }

  const handlePlaceOrder = async () => {
    setFormError('')

    if (!isAuthenticated) {
      router.push('/login?next=/checkout')
      return
    }

    const missing = !address.zipCode || !address.street || !address.number || !address.neighborhood || !address.city || address.state.length !== 2
    if (missing) {
      setFormError('Preencha o endereço completo de entrega (CEP, rua, número, bairro, cidade e UF).')
      return
    }
    if (!selectedShipping) {
      setFormError('Informe o CEP para calcular o frete antes de continuar.')
      return
    }

    setIsSubmitting(true)
    try {
      const { order } = await apiFetch<{ order: PayableOrder }>('/orders', {
        method: 'POST',
        body: {
          items: items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            color: item.color || undefined,
            storage: item.storage || undefined,
          })),
          shippingOptionId: selectedShipping.id,
          ...(selectedAddressId ? { addressId: selectedAddressId } : {}),
          address: selectedAddressId ? undefined : {
            street: address.street.trim(),
            number: address.number.trim(),
            complement: address.complement.trim() || undefined,
            neighborhood: address.neighborhood.trim(),
            city: address.city.trim(),
            state: address.state.trim().toUpperCase(),
            zipCode: address.zipCode.replace(/\D/g, ''),
          },
          paymentGateway: selectedGateway,
          paymentMethod: METHOD_BY_GATEWAY[selectedGateway],
          couponCode: couponApplied ? couponCode.trim() : undefined,
        },
      })

      // Estoque já reservado no servidor: o carrinho local pode ser esvaziado
      setCreatedOrder(order)
      clearCart()
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Erro ao registrar o pedido. Tente novamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!mounted) return null

  // Pedido criado: cobrança (PIX ou cartão) e acompanhamento do pagamento
  if (createdOrder) {
    return (
      <div className="container max-w-xl py-12 md:py-20">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-ok text-white">
          <Check className="h-6 w-6" />
        </div>
        <h1 className="mt-5 text-4xl font-extrabold tracking-tight">Pedido registrado!</h1>
        <p className="mt-2 text-graphite">
          Número do pedido <span className="font-display font-bold text-ink" data-testid="order-code">#{createdOrder.id.slice(-8)}</span>.
          Assim que o pagamento for confirmado, você recebe um e-mail.
        </p>

        <div className="mt-8">
          <OrderPayment order={createdOrder} />
        </div>

        <div className="mt-8 flex flex-wrap gap-3">
          <Link href={`/orders/${createdOrder.id}`} className="btn-primary">Acompanhar pedido</Link>
          <Link href="/products" className="btn-ghost">Continuar comprando</Link>
        </div>
      </div>
    )
  }

  const shippingCost = selectedShipping?.price ?? 0
  const total = Math.max(0, rawSubtotal - discount + shippingCost)
  const noGateway = !gateways.mercadoPago && !gateways.stripe

  if (items.length === 0) {
    return (
      <div className="container py-20">
        <div className="stage mx-auto max-w-lg px-8 py-14 text-center">
          <h1 className="text-2xl font-bold">Seu carrinho está vazio</h1>
          <p className="mt-2 text-graphite">Escolha um smartphone para continuar.</p>
          <button onClick={() => router.push('/products')} className="btn-primary mt-6">Ver smartphones</button>
        </div>
      </div>
    )
  }

  return (
    <div className="container pt-8 md:pt-12">
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Finalizar compra</h1>

      {!isAuthenticated && (
        <p className="notice-warn mt-6">
          Entre na sua conta para concluir a compra.{' '}
          <Link href="/login?next=/checkout" className="font-semibold underline">Entrar</Link> ou{' '}
          <Link href="/register?next=/checkout" className="font-semibold underline">criar conta</Link>
        </p>
      )}

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_400px] lg:gap-12">
        <div className="space-y-8">
          {/* Entrega */}
          <section className="panel p-6 md:p-8">
            <h2 className="text-xl font-bold">Entrega</h2>

            {savedAddresses.length > 0 && (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {savedAddresses.map((saved) => (
                  <button
                    type="button"
                    key={saved.id}
                    onClick={() => selectSavedAddress(saved)}
                    aria-pressed={selectedAddressId === saved.id}
                    className={`rounded-xl border p-4 text-left text-sm ${
                      selectedAddressId === saved.id ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-graphite'
                    }`}
                  >
                    <span className="font-semibold">{saved.label}</span>
                    <p className="mt-1 text-graphite">{saved.street}, {saved.number}</p>
                    <p className="text-graphite">{saved.city}/{saved.state}</p>
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => selectSavedAddress(null)}
                  aria-pressed={selectedAddressId === ''}
                  className={`rounded-xl border p-4 text-left text-sm ${
                    selectedAddressId === '' ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-graphite'
                  }`}
                >
                  <span className="font-semibold">Outro endereço</span>
                  <p className="mt-1 text-graphite">Preencher um endereço novo</p>
                </button>
              </div>
            )}

            {!selectedAddressId && (
              <div className="mt-5 grid gap-4 sm:grid-cols-6">
                <div className="sm:col-span-2">
                  <label htmlFor="zip" className="field-label">CEP</label>
                  <input id="zip" type="text" inputMode="numeric" placeholder="00000-000" maxLength={9} value={address.zipCode} onChange={(e) => setAddress({ ...address, zipCode: e.target.value })} onBlur={() => calculateShipping(true)} className={inputClass} />
                  {loadingShipping && <p className="mt-1.5 text-xs text-graphite">Buscando endereço...</p>}
                  {shippingError && <p className="mt-1.5 text-xs text-danger">{shippingError}</p>}
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="city" className="field-label">Cidade</label>
                  <input id="city" type="text" value={address.city} onChange={(e) => setAddress({ ...address, city: e.target.value })} className={inputClass} />
                </div>
                <div>
                  <label htmlFor="uf" className="field-label">UF</label>
                  <input id="uf" type="text" maxLength={2} value={address.state} onChange={(e) => setAddress({ ...address, state: e.target.value.toUpperCase() })} className={`${inputClass} uppercase`} />
                </div>
                <div className="sm:col-span-4">
                  <label htmlFor="street" className="field-label">Rua</label>
                  <input id="street" type="text" value={address.street} onChange={(e) => setAddress({ ...address, street: e.target.value })} className={inputClass} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="number" className="field-label">Número</label>
                  <input id="number" type="text" value={address.number} onChange={(e) => setAddress({ ...address, number: e.target.value })} className={inputClass} />
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="neighborhood" className="field-label">Bairro</label>
                  <input id="neighborhood" type="text" value={address.neighborhood} onChange={(e) => setAddress({ ...address, neighborhood: e.target.value })} className={inputClass} />
                </div>
                <div className="sm:col-span-3">
                  <label htmlFor="complement" className="field-label">Complemento <span className="font-normal text-graphite">(opcional)</span></label>
                  <input id="complement" type="text" placeholder="Apto, bloco" value={address.complement} onChange={(e) => setAddress({ ...address, complement: e.target.value })} className={inputClass} />
                </div>
              </div>
            )}
            {loadingShipping && selectedAddressId && <p className="mt-4 text-sm text-graphite">Calculando frete...</p>}

            {shippingOptions.length > 0 && (
              <fieldset className="mt-6">
                <legend className="mb-3 text-sm font-semibold">Escolha o frete</legend>
                <div className="grid gap-3 sm:grid-cols-2">
                  {shippingOptions.map((opt) => (
                    <button
                      type="button"
                      key={opt.id}
                      onClick={() => setSelectedShipping(opt)}
                      aria-pressed={selectedShipping?.id === opt.id}
                      className={`rounded-xl border p-4 text-left ${
                        selectedShipping?.id === opt.id ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-graphite'
                      }`}
                    >
                      <div className="flex items-baseline justify-between gap-2">
                        <span className="text-sm font-semibold">{opt.name}</span>
                        <span className={`price text-base ${opt.price === 0 ? 'text-ok' : ''}`}>
                          {opt.price === 0 ? 'Grátis' : formatCurrency(opt.price)}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-graphite">{opt.deadline}</p>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}
          </section>

          {/* Pagamento */}
          <section className="panel p-6 md:p-8">
            <h2 className="text-xl font-bold">Pagamento</h2>
            {noGateway && <p className="notice-warn mt-4">Nenhuma forma de pagamento está ativa agora. Tente mais tarde.</p>}
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              {gateways.mercadoPago && (
                <button
                  type="button"
                  onClick={() => setSelectedGateway('MERCADOPAGO')}
                  aria-pressed={selectedGateway === 'MERCADOPAGO'}
                  className={`flex gap-3 rounded-xl border p-4 text-left ${
                    selectedGateway === 'MERCADOPAGO' ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-graphite'
                  }`}
                >
                  <QrCode className="h-5 w-5 flex-shrink-0" />
                  <span>
                    <span className="block text-sm font-semibold">PIX (Mercado Pago)</span>
                    <span className="mt-1 block text-sm text-graphite">QR Code válido por 30 minutos. Confirmação automática.</span>
                  </span>
                </button>
              )}
              {gateways.stripe && (
                <button
                  type="button"
                  onClick={() => setSelectedGateway('STRIPE')}
                  aria-pressed={selectedGateway === 'STRIPE'}
                  className={`flex gap-3 rounded-xl border p-4 text-left ${
                    selectedGateway === 'STRIPE' ? 'border-ink ring-1 ring-ink' : 'border-line hover:border-graphite'
                  }`}
                >
                  <CreditCard className="h-5 w-5 flex-shrink-0" />
                  <span>
                    <span className="block text-sm font-semibold">Cartão de crédito</span>
                    <span className="mt-1 block text-sm text-graphite">Você digita os dados do cartão no próximo passo, em ambiente do Stripe.</span>
                  </span>
                </button>
              )}
            </div>
          </section>
        </div>

        {/* Resumo */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="panel p-6">
            <h2 className="text-xl font-bold">Resumo</h2>
            <ul className="mt-5 space-y-4">
              {items.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="stage h-16 w-14 flex-shrink-0 overflow-hidden rounded-xl">
                    <ProductImage src={item.image} alt="" className="h-full w-full object-cover" />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <p className="font-semibold leading-snug">{item.name}</p>
                    <p className="text-graphite">
                      {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}
                      {item.color ? `, ${item.color}` : ''}
                    </p>
                  </div>
                  <span className="price text-sm">{formatCurrency(item.price * item.quantity)}</span>
                </li>
              ))}
            </ul>

            <form onSubmit={handleApplyCoupon} className="mt-6 border-t border-line pt-5">
              <label htmlFor="coupon" className="field-label">Cupom</label>
              <div className="flex gap-2">
                <input id="coupon" type="text" placeholder="Código do cupom" value={couponCode} disabled={couponApplied} onChange={(e) => setCouponCode(e.target.value)} className="field uppercase disabled:bg-paper" />
                {couponApplied ? (
                  <button type="button" onClick={removeCoupon} className="btn-ghost px-4">Remover</button>
                ) : (
                  <button type="submit" className="btn-ghost px-4">Aplicar</button>
                )}
              </div>
              {couponApplied && <p className="mt-2 text-xs text-ok">Cupom aplicado! O valor final é conferido ao criar o pedido.</p>}
              {couponError && <p className="mt-2 text-xs text-danger">{couponError}</p>}
            </form>

            <dl className="mt-6 space-y-2 border-t border-line pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-graphite">Subtotal</dt>
                <dd className="tabular-nums">{formatCurrency(rawSubtotal)}</dd>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-ok">
                  <dt>Desconto</dt>
                  <dd className="tabular-nums">- {formatCurrency(discount)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-graphite">Frete</dt>
                <dd className="tabular-nums">
                  {!selectedShipping ? 'Informe o CEP' : shippingCost === 0 ? 'Grátis' : formatCurrency(shippingCost)}
                </dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-line pt-3">
                <dt className="font-semibold">Total</dt>
                <dd className="price text-3xl">{formatCurrency(total)}</dd>
              </div>
            </dl>

            {formError && <p className="notice-error mt-4">{formError}</p>}

            <button onClick={handlePlaceOrder} disabled={isSubmitting || noGateway} className="btn-buy mt-5 w-full py-3.5 text-base">
              {isSubmitting ? 'Registrando pedido...' : isAuthenticated ? 'Confirmar Pedido e pagar' : 'Entrar para finalizar'}
            </button>
          </div>
        </aside>
      </div>
    </div>
  )
}
