'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Key, Package, Truck } from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { MetricsBar } from '../../components/admin/MetricsBar'
import { ProductsTab } from '../../components/admin/ProductsTab'
import { OrdersTab } from '../../components/admin/OrdersTab'
import { SettingsTab } from '../../components/admin/SettingsTab'

type Tab = 'products' | 'orders' | 'settings'

const TABS: Array<{ id: Tab; label: string; icon: typeof Package }> = [
  { id: 'products', label: 'Produtos', icon: Package },
  { id: 'orders', label: 'Pedidos', icon: Truck },
  { id: 'settings', label: 'Pagamentos & Loja', icon: Key },
]

export default function AdminPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('products')
  const [refreshKey, setRefreshKey] = useState(0)

  useEffect(() => setMounted(true), [])

  useEffect(() => {
    if (mounted && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login?next=/admin')
    }
  }, [mounted, isAuthenticated, user, router])

  if (!mounted || !isAuthenticated || user?.role !== 'ADMIN') return null

  const refreshMetrics = () => setRefreshKey((k) => k + 1)

  return (
    <div className="min-h-screen">
      <div className="border-b border-line bg-white px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-ink tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-ok"></span>
              Painel de Gestão da Loja
            </h1>
            <p className="text-xs text-graphite mt-0.5">Produtos, pedidos e credenciais de pagamento.</p>
          </div>

          <div className="flex bg-paper p-1 rounded-xl border border-line">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                  activeTab === id ? 'bg-ink text-white shadow' : 'text-graphite hover:text-ink'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 space-y-6">
        {user?.isDemo && (
          <p className="notice-warn" data-testid="demo-readonly">
            Você está no painel de demonstração: pode navegar por tudo, mas nada é salvo. E-mails, telefones e
            endereços de clientes aparecem ocultos.
          </p>
        )}
        <MetricsBar refreshKey={refreshKey} />
        {activeTab === 'products' && <ProductsTab onChange={refreshMetrics} />}
        {activeTab === 'orders' && <OrdersTab onChange={refreshMetrics} />}
        {activeTab === 'settings' && <SettingsTab onChange={refreshMetrics} />}
      </div>
    </div>
  )
}
