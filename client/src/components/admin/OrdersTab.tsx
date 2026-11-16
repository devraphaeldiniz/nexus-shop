'use client'

import { useCallback, useEffect, useState } from 'react'
import { apiFetch } from '../../lib/api'
import { formatCurrency, formatDate } from '../../lib/utils'
import { ORDER_STATUS_LABEL, PAYMENT_METHOD_LABEL, PAYMENT_STATUS_LABEL } from '../../lib/orderStatus'
import { AdminOrder, errorMessage } from './types'

const PAGE_SIZE = 20

/** Status que o admin pode escolher a partir do atual (o servidor também valida). */
function allowedStatuses(order: AdminOrder): string[] {
  if (order.status === 'CANCELLED' || order.status === 'REFUNDED') return [order.status]
  if (order.paymentStatus !== 'PAID') return ['PENDING', 'CANCELLED']
  return ['CONFIRMED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'REFUNDED']
}

export function OrdersTab({ onChange }: { onChange: () => void }) {
  const [orders, setOrders] = useState<AdminOrder[]>([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('')
  const [tracking, setTracking] = useState<Record<string, string>>({})
  const [error, setError] = useState('')
  const [savingId, setSavingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    try {
      const data = await apiFetch<{ orders: AdminOrder[]; pagination: { totalPages: number } }>('/orders/admin/all', {
        params: { page, limit: PAGE_SIZE, status: statusFilter || undefined },
      })
      setOrders(data.orders)
      setTotalPages(Math.max(data.pagination.totalPages, 1))
      setError('')
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível carregar os pedidos.'))
    }
  }, [page, statusFilter])

  useEffect(() => {
    load()
  }, [load])

  async function update(order: AdminOrder, status: string) {
    const trackingCode = tracking[order.id]?.trim() || undefined
    if ((status === 'CANCELLED' || status === 'REFUNDED') && !confirm('Confirmar? O estoque dos itens volta para a loja.')) return
    setSavingId(order.id)
    try {
      await apiFetch(`/orders/${order.id}/status`, { method: 'PATCH', body: { status, trackingCode } })
      await load()
      onChange()
    } catch (err) {
      alert(errorMessage(err, 'Não foi possível atualizar o pedido.'))
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <label className="text-graphite">Filtrar:</label>
        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1)
            setStatusFilter(e.target.value)
          }}
          className="bg-white border border-line text-ink rounded-lg px-2.5 py-1.5"
        >
          <option value="">Todos os status</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-paper border-b border-line text-graphite uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Pedido</th>
              <th className="py-3 px-4">Cliente</th>
              <th className="py-3 px-4">Itens</th>
              <th className="py-3 px-4">Total</th>
              <th className="py-3 px-4">Pagamento</th>
              <th className="py-3 px-4">Status e rastreio</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-graphite">Nenhum pedido encontrado.</td>
              </tr>
            )}
            {orders.map((order) => (
              <tr key={order.id} className="align-top hover:bg-paper">
                <td className="py-3 px-4">
                  <span className="font-mono font-bold text-signal block">#{order.id.slice(-8)}</span>
                  <span className="text-[10px] text-graphite">{formatDate(order.createdAt)}</span>
                  {order.notes?.includes('[sistema]') && (
                    <p className="mt-1 max-w-[220px] whitespace-pre-line text-[10px] text-warn">{order.notes}</p>
                  )}
                </td>
                <td className="py-3 px-4">
                  <span className="font-semibold text-ink block">{order.user.name}</span>
                  <span className="text-[10px] text-graphite block">{order.user.email}</span>
                  <span className="text-[10px] text-graphite block">{order.address.city}/{order.address.state}</span>
                </td>
                <td className="py-3 px-4 max-w-[200px]">
                  {order.items.map((item) => (
                    <div key={item.id} className="text-ink truncate">{item.quantity}x {item.name}</div>
                  ))}
                </td>
                <td className="py-3 px-4 font-bold text-ink">{formatCurrency(Number(order.total))}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${order.paymentStatus === 'PAID' ? 'bg-ok-soft text-ok' : 'bg-warn-soft text-warn'}`}>
                    {PAYMENT_STATUS_LABEL[order.paymentStatus] ?? order.paymentStatus}
                  </span>
                  <span className="text-[10px] text-graphite block mt-1">
                    {order.paymentMethod ? PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod : '-'}
                  </span>
                </td>
                <td className="py-3 px-4 space-y-1.5">
                  <select
                    value={order.status}
                    disabled={savingId === order.id || allowedStatuses(order).length === 1}
                    onChange={(e) => update(order, e.target.value)}
                    className="bg-white border border-line text-ink text-xs rounded-lg px-2 py-1 disabled:opacity-60"
                  >
                    {Array.from(new Set([order.status, ...allowedStatuses(order)])).map((status) => (
                      <option key={status} value={status}>{ORDER_STATUS_LABEL[status] ?? status}</option>
                    ))}
                  </select>
                  {order.paymentStatus === 'PAID' && order.status !== 'CANCELLED' && order.status !== 'REFUNDED' && (
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Código de rastreio"
                        defaultValue={order.trackingCode || ''}
                        onChange={(e) => setTracking({ ...tracking, [order.id]: e.target.value })}
                        className="bg-white border border-line rounded px-2 py-0.5 text-[10px] text-ink w-32"
                      />
                      <button
                        onClick={() => update(order, order.status === 'CONFIRMED' || order.status === 'PROCESSING' ? 'SHIPPED' : order.status)}
                        disabled={savingId === order.id}
                        className="px-2 py-0.5 bg-ink text-[10px] text-white rounded font-semibold disabled:opacity-50"
                      >
                        Salvar
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-end gap-2 text-xs">
          <button disabled={page <= 1} onClick={() => setPage(page - 1)} className="px-3 py-1.5 bg-white rounded-lg disabled:opacity-40">Anterior</button>
          <span className="text-graphite">Página {page} de {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => setPage(page + 1)} className="px-3 py-1.5 bg-white rounded-lg disabled:opacity-40">Próxima</button>
        </div>
      )}
    </div>
  )
}
