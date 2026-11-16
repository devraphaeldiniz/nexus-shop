'use client'

import { useEffect, useState } from 'react'
import { AlertCircle, DollarSign, Package, ShoppingBag, Users } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'
import { AdminMetrics } from './types'

export function MetricsBar({ refreshKey }: { refreshKey: number }) {
  const [metrics, setMetrics] = useState<AdminMetrics | null>(null)

  useEffect(() => {
    apiFetch<{ metrics: AdminMetrics }>('/admin/metrics')
      .then((data) => setMetrics(data.metrics))
      .catch(() => setMetrics(null))
  }, [refreshKey])

  if (!metrics) return null

  const cards = [
    { label: 'Receita (pedidos pagos)', value: formatCurrency(metrics.totalRevenue), icon: DollarSign },
    { label: 'Pedidos', value: metrics.totalOrders, icon: ShoppingBag },
    { label: 'Clientes', value: metrics.totalCustomers, icon: Users },
    { label: 'Produtos ativos', value: metrics.totalProducts, icon: Package },
    { label: 'Estoque baixo (≤ 10)', value: metrics.lowStockCount, icon: AlertCircle },
  ]

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      {cards.map(({ label, value, icon: Icon }) => (
        <div key={label} className="panel p-4">
          <Icon className="w-4 h-4 text-signal" />
          <p className="mt-2 text-lg font-bold text-ink">{value}</p>
          <p className="text-[11px] text-graphite">{label}</p>
        </div>
      ))}
    </div>
  )
}
