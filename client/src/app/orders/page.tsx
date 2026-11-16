'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { formatCurrency } from '../../lib/utils'
import { apiFetch, ApiError } from '../../lib/api'
import { ORDER_STATUS_LABEL, statusTone } from '../../lib/orderStatus'

type Order = {
  id: string
  status: string
  paymentStatus: string
  total: number | string
  createdAt: string
  trackingCode?: string | null
  items: Array<{ id: string; name: string; quantity: number }>
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [needsLogin, setNeedsLogin] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    apiFetch<{ orders: Order[] }>('/orders/my-orders')
      .then((data) => setOrders(data.orders || []))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) setNeedsLogin(true)
        else setError('Não foi possível carregar seus pedidos. Tente de novo.')
      })
      .finally(() => setLoading(false))
  }, [])

  return (
    <div className="container max-w-4xl pt-8 md:pt-12">
      <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Meus pedidos</h1>

      {loading && <p className="mt-8 text-graphite">Carregando pedidos...</p>}
      {error && <p className="notice-error mt-8">{error}</p>}

      {needsLogin && (
        <div className="stage mt-8 px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold">Entre para ver seus pedidos</p>
          <Link className="btn-primary mt-6" href="/login?next=/orders">Entrar</Link>
        </div>
      )}

      {!loading && !error && !needsLogin && orders.length === 0 && (
        <div className="stage mt-8 px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold">Você ainda não fez nenhum pedido</p>
          <p className="mt-2 text-graphite">Quando comprar, o acompanhamento aparece aqui.</p>
          <Link href="/products" className="btn-primary mt-6">Ver smartphones</Link>
        </div>
      )}

      <ul className="mt-8 space-y-3">
        {orders.map((order) => (
          <li key={order.id}>
            <Link href={`/orders/${order.id}`} className="panel flex flex-col gap-4 p-5 transition-colors hover:border-ink sm:flex-row sm:items-center sm:justify-between">
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold">Pedido #{order.id.slice(-8)}</p>
                <p className="mt-0.5 text-sm text-graphite">
                  {new Date(order.createdAt).toLocaleDateString('pt-BR', { day: '2-digit', month: 'long', year: 'numeric' })}
                </p>
                <p className="mt-2 truncate text-sm">
                  {order.items.map((i) => `${i.quantity}x ${i.name}`).join(', ')}
                </p>
              </div>
              <div className="flex items-center gap-4 sm:flex-col sm:items-end sm:gap-2">
                <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusTone(order.status)}`}>
                  {ORDER_STATUS_LABEL[order.status] ?? order.status}
                </span>
                <span className="price text-lg">{formatCurrency(Number(order.total))}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
