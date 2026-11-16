'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Check, ChevronLeft } from 'lucide-react'
import { apiFetch } from '../../../lib/api'
import { formatCurrency, formatDate } from '../../../lib/utils'
import { ORDER_STATUS_LABEL, ORDER_STEPS, PAYMENT_METHOD_LABEL, statusTone } from '../../../lib/orderStatus'
import { OrderPayment, PayableOrder } from '../../../components/checkout/OrderPayment'

interface OrderDetail extends PayableOrder {
  createdAt: string
  subtotal: number | string
  shippingCost: number | string
  discount: number | string
  trackingCode?: string | null
  items: Array<{ id: string; name: string; price: number | string; quantity: number; color?: string | null; storage?: string | null }>
  address: { street: string; number: string; complement?: string | null; neighborhood: string; city: string; state: string; zipCode: string }
}

/** Linha do tempo: etapas reais do pedido, em ordem. */
function Timeline({ status }: { status: string }) {
  const current = ORDER_STEPS.indexOf(status as (typeof ORDER_STEPS)[number])
  return (
    <ol className="grid grid-cols-5 gap-2">
      {ORDER_STEPS.map((step, idx) => {
        const done = idx <= current
        return (
          <li key={step} className="flex flex-col gap-2">
            <span className={`h-1.5 rounded-full ${done ? 'bg-ink' : 'bg-line'}`} />
            <span className={`flex items-center gap-1 text-xs ${done ? 'font-semibold text-ink' : 'text-graphite'}`}>
              {done && <Check className="h-3 w-3" />}
              {ORDER_STATUS_LABEL[step]}
            </span>
          </li>
        )
      })}
    </ol>
  )
}

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [order, setOrder] = useState<OrderDetail | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<{ order: OrderDetail }>(`/orders/${id}`)
      .then((data) => setOrder(data.order))
      .catch(() => setError('Pedido não encontrado ou sua sessão expirou.'))
  }, [id])

  const handleOrderChange = useCallback((fresh: PayableOrder) => {
    setOrder((current) => (current ? { ...current, ...fresh } : current))
  }, [])

  return (
    <div className="container max-w-4xl pt-8 md:pt-12">
      <Link href="/orders" className="inline-flex items-center gap-1 text-sm font-medium text-graphite hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Meus pedidos
      </Link>

      {error && (
        <p className="notice-error mt-6">
          {error} <Link href={`/login?next=/orders/${id}`} className="font-semibold underline">Entrar</Link>
        </p>
      )}

      {order && (
        <>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h1 className="text-4xl font-extrabold tracking-tight">Pedido #{order.id.slice(-8)}</h1>
              <p className="mt-1 text-graphite">Feito em {formatDate(order.createdAt)}</p>
            </div>
            <span className={`rounded-full px-3 py-1 text-sm font-semibold ${statusTone(order.status)}`}>
              {ORDER_STATUS_LABEL[order.status] ?? order.status}
            </span>
          </div>

          {order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
            <div className="mt-8">
              <Timeline status={order.status} />
            </div>
          )}

          {order.trackingCode && (
            <p className="notice-ok mt-6">
              Código de rastreio: <strong className="font-semibold">{order.trackingCode}</strong>
            </p>
          )}

          {order.status === 'PENDING' && order.paymentStatus !== 'PAID' && (
            <div className="mt-8">
              <OrderPayment order={order} onOrderChange={handleOrderChange} />
            </div>
          )}

          <div className="mt-8 grid gap-6 md:grid-cols-[1.4fr_1fr]">
            <section className="panel p-6">
              <h2 className="text-lg font-bold">Itens</h2>
              <ul className="mt-4 divide-y divide-line">
                {order.items.map((item) => (
                  <li key={item.id} className="flex justify-between gap-4 py-3 text-sm">
                    <span>
                      <span className="font-medium">{item.name}</span>
                      <span className="block text-graphite">
                        {item.quantity} {item.quantity === 1 ? 'unidade' : 'unidades'}
                        {item.color ? `, ${item.color}` : ''}
                      </span>
                    </span>
                    <span className="tabular-nums">{formatCurrency(Number(item.price) * item.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="mt-2 space-y-2 border-t border-line pt-4 text-sm">
                <div className="flex justify-between"><dt className="text-graphite">Subtotal</dt><dd className="tabular-nums">{formatCurrency(Number(order.subtotal))}</dd></div>
                {Number(order.discount) > 0 && (
                  <div className="flex justify-between text-ok"><dt>Desconto</dt><dd className="tabular-nums">- {formatCurrency(Number(order.discount))}</dd></div>
                )}
                <div className="flex justify-between"><dt className="text-graphite">Frete</dt><dd className="tabular-nums">{Number(order.shippingCost) === 0 ? 'Grátis' : formatCurrency(Number(order.shippingCost))}</dd></div>
                <div className="flex items-baseline justify-between pt-1"><dt className="font-semibold">Total</dt><dd className="price text-2xl">{formatCurrency(Number(order.total))}</dd></div>
              </dl>
            </section>

            <section className="panel space-y-5 p-6 text-sm">
              <div>
                <h2 className="text-lg font-bold">Entrega</h2>
                <p className="mt-2">{order.address.street}, {order.address.number}{order.address.complement ? `, ${order.address.complement}` : ''}</p>
                <p className="text-graphite">{order.address.neighborhood}, {order.address.city}/{order.address.state}</p>
                <p className="text-graphite">CEP {order.address.zipCode}</p>
              </div>
              <div>
                <h2 className="text-lg font-bold">Pagamento</h2>
                <p className="mt-2">{order.paymentMethod ? PAYMENT_METHOD_LABEL[order.paymentMethod] : '-'}</p>
              </div>
              <Link href="/contact" className="inline-block font-semibold underline underline-offset-4">Precisa de ajuda com este pedido?</Link>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
