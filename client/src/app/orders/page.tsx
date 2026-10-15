'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { PackageSearch } from 'lucide-react'
import { formatCurrency } from '../../lib/utils'

type Order = { id: string; status: string; paymentStatus: string; total: number | string; createdAt: string; trackingCode?: string | null }

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const api = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

  useEffect(() => {
    fetch(`${api}/orders/my-orders`, { credentials: 'include' })
      .then(async (res) => {
        if (!res.ok) throw new Error(res.status === 401 ? 'Faça login para acompanhar seus pedidos.' : 'Não foi possível carregar os pedidos.')
        const data = await res.json()
        setOrders(data.orders || [])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [api])

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 animate-fade-up">
      <h1 className="text-2xl font-bold text-white">Acompanhar pedidos</h1>
      <p className="mt-2 text-sm text-slate-400">Consulte o status, pagamento e rastreamento das suas compras.</p>
      {loading && <p className="mt-8 text-sm text-slate-400">Carregando pedidos...</p>}
      {!loading && error && <div className="mt-8 rounded-xl border border-amber-800 bg-amber-950/30 p-4 text-sm text-amber-300">{error} <Link className="underline" href="/login">Entrar</Link></div>}
      {!loading && !error && orders.length === 0 && <div className="mt-8 rounded-xl border border-slate-800 bg-slate-900 p-8 text-center"><PackageSearch className="mx-auto h-10 w-10 text-slate-600" /><p className="mt-3 text-sm text-slate-300">Você ainda não possui pedidos.</p><Link href="/products" className="mt-5 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white">Ver catálogo</Link></div>}
      <div className="mt-8 space-y-3">
        {orders.map((order) => <Link href={`/orders/${order.id}`} key={order.id} className="block rounded-xl border border-slate-800 bg-slate-900 p-5 transition hover:-translate-y-0.5 hover:border-indigo-500/60"><div className="flex flex-wrap justify-between gap-3"><div><p className="font-semibold text-white">Pedido #{order.id.slice(-8)}</p><p className="mt-1 text-xs text-slate-400">{new Date(order.createdAt).toLocaleDateString('pt-BR')}</p></div><p className="font-bold text-indigo-400">{formatCurrency(Number(order.total))}</p></div><div className="mt-4 flex flex-wrap gap-2 text-[11px] text-slate-300"><span className="rounded bg-slate-800 px-2 py-1">Status: {order.status}</span><span className="rounded bg-slate-800 px-2 py-1">Pagamento: {order.paymentStatus}</span>{order.trackingCode && <span className="rounded bg-emerald-950 px-2 py-1 text-emerald-300">Rastreio: {order.trackingCode}</span>}</div></Link>)}
      </div>
    </main>
  )
}
