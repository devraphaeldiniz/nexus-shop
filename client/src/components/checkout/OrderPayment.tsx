'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { AlertCircle, Check, CheckCircle, Copy, QrCode, RefreshCw, XCircle } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'
import { StripePayment } from './StripePayment'

export interface PayableOrder {
  id: string
  total: number | string
  status: string
  paymentStatus: string
  paymentGateway?: 'STRIPE' | 'MERCADOPAGO' | null
  paymentMethod?: 'PIX' | 'CREDIT_CARD' | null
}

interface PixData {
  qrCode?: string
  qrCodeBase64?: string
  ticketUrl?: string
  expiresAt?: string
}

interface StripeData {
  clientSecret: string
  publishableKey: string
}

const POLL_INTERVAL_MS = 5000

/**
 * Gera a cobrança do pedido (PIX ou cartão) e acompanha o status até o pagamento ser
 * confirmado pelo webhook ou o pedido ser cancelado.
 */
export function OrderPayment({
  order: initialOrder,
  onOrderChange,
}: {
  order: PayableOrder
  onOrderChange?: (order: PayableOrder) => void
}) {
  const [order, setOrder] = useState(initialOrder)
  const [pix, setPix] = useState<PixData | null>(null)
  const [stripeData, setStripeData] = useState<StripeData | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const started = useRef(false)
  const onOrderChangeRef = useRef(onOrderChange)
  onOrderChangeRef.current = onOrderChange

  const isPaid = order.paymentStatus === 'PAID'
  const isClosed = order.status === 'CANCELLED' || order.status === 'REFUNDED'
  const isWaiting = !isPaid && !isClosed

  const startPayment = useCallback(async () => {
    setError('')
    setLoading(true)
    try {
      if (order.paymentGateway === 'MERCADOPAGO') {
        const data = await apiFetch<PixData>('/payments/mercadopago/create-pix', {
          method: 'POST',
          body: { orderId: order.id },
        })
        setPix(data)
      } else if (order.paymentGateway === 'STRIPE') {
        const data = await apiFetch<StripeData>('/payments/stripe/create-intent', {
          method: 'POST',
          body: { orderId: order.id },
        })
        setStripeData(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível gerar a cobrança.')
    } finally {
      setLoading(false)
    }
  }, [order.id, order.paymentGateway])

  // Gera a cobrança uma vez ao abrir
  useEffect(() => {
    if (isWaiting && !started.current) {
      started.current = true
      startPayment()
    }
  }, [isWaiting, startPayment])

  // Acompanha o status do pedido até sair de "aguardando pagamento"
  useEffect(() => {
    if (!isWaiting) return
    const timer = setInterval(async () => {
      try {
        const { order: fresh } = await apiFetch<{ order: PayableOrder }>(`/orders/${order.id}`)
        setOrder(fresh)
        onOrderChangeRef.current?.(fresh)
      } catch {
        // Falha pontual de rede: tenta de novo no próximo ciclo
      }
    }, POLL_INTERVAL_MS)
    return () => clearInterval(timer)
  }, [isWaiting, order.id])

  const copyPixCode = () => {
    if (!pix?.qrCode) return
    navigator.clipboard.writeText(pix.qrCode)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  if (isPaid) {
    return (
      <div className="rounded-2xl bg-ok-soft p-6">
        <p className="flex items-center gap-2 font-display text-lg font-semibold text-ok">
          <CheckCircle className="h-5 w-5" /> Pagamento confirmado
        </p>
        <p className="mt-1 text-sm text-ink">
          Recebemos {formatCurrency(Number(order.total))}. O código de rastreio chega por e-mail quando o pedido for postado.
        </p>
      </div>
    )
  }

  if (isClosed) {
    return (
      <div className="rounded-2xl bg-danger-soft p-6">
        <p className="flex items-center gap-2 font-display text-lg font-semibold text-danger">
          <XCircle className="h-5 w-5" /> Pedido cancelado
        </p>
        <p className="mt-1 text-sm text-ink">
          O prazo de pagamento terminou ou a cobrança foi recusada. Faça um novo pedido se ainda quiser o aparelho.
        </p>
      </div>
    )
  }

  return (
    <div className="panel space-y-5 p-6">
      {loading && <p className="text-sm text-graphite">Gerando a cobrança...</p>}

      {error && (
        <div className="space-y-3">
          <p className="notice-error flex items-start gap-2">
            <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
          </p>
          <button onClick={startPayment} className="btn-ghost">
            <RefreshCw className="h-4 w-4" /> Tentar de novo
          </button>
        </div>
      )}

      {order.paymentGateway === 'MERCADOPAGO' && pix?.qrCode && (
        <>
          <div className="flex items-center gap-2">
            <QrCode className="h-5 w-5" />
            <p className="font-display text-lg font-semibold">
              Pague <span className="price">{formatCurrency(Number(order.total))}</span> no PIX
            </p>
          </div>

          {pix.qrCodeBase64 && (
            <div className="mx-auto w-52 rounded-2xl border border-line bg-white p-3">
              <img src={`data:image/png;base64,${pix.qrCodeBase64}`} alt="QR Code do PIX" className="h-auto w-full" />
            </div>
          )}

          <div>
            <label htmlFor="pix-code" className="field-label">PIX copia e cola</label>
            <div className="flex gap-2">
              <input id="pix-code" type="text" readOnly value={pix.qrCode} className="field truncate font-mono text-xs" />
              <button onClick={copyPixCode} className="btn-primary flex-shrink-0 px-4">
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? 'Copiado' : 'Copiar'}
              </button>
            </div>
          </div>

          <p className="text-sm text-graphite">
            Abra o app do seu banco, escolha PIX copia e cola e conclua o pagamento.
            {pix.expiresAt && (
              <> O código vale até {new Date(pix.expiresAt).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}.</>
            )}{' '}
            Esta tela atualiza sozinha quando o pagamento for confirmado.
          </p>
        </>
      )}

      {order.paymentGateway === 'STRIPE' && stripeData && (
        <>
          <p className="font-display text-lg font-semibold">
            Pague <span className="price">{formatCurrency(Number(order.total))}</span> no cartão
          </p>
          <StripePayment clientSecret={stripeData.clientSecret} publishableKey={stripeData.publishableKey} orderId={order.id} />
        </>
      )}
    </div>
  )
}
