'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  TrendingUp,
  ShoppingBag,
  Users,
  AlertTriangle,
  Smartphone,
  Sliders,
  DollarSign,
  Package,
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { formatCurrency, formatDate } from '../../lib/utils'

export default function AdminDashboardPage() {
  const router = useRouter()
  const { user, isAuthenticated } = useAuthStore()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (mounted && (!isAuthenticated || user?.role !== 'ADMIN')) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-4">
        <h2 className="text-xl font-bold text-white">Acesso Restrito ao Painel</h2>
        <p className="text-xs text-slate-400">Esta área requer privilégios de administrador.</p>
        <button
          onClick={() => router.push('/login')}
          className="px-6 py-2.5 bg-indigo-600 text-white text-xs font-bold rounded-xl"
        >
          Entrar como Administrador
        </button>
      </div>
    )
  }

  // Métricas mock/reais para exibição
  const stats = {
    totalRevenue: 284950.0,
    totalOrders: 38,
    totalCustomers: 124,
    lowStockCount: 2,
  }

  const lowStock = [
    { name: 'Xiaomi 14 Ultra Leica', brand: 'Xiaomi', stock: 4 },
    { name: 'Apple iPhone 15 Pro Max', brand: 'Apple', stock: 8 },
  ]

  const recentOrders = [
    {
      id: 'ORD-9842',
      customer: 'Lucas Ferreira',
      product: 'Apple iPhone 15 Pro Max 256GB',
      total: 8999,
      status: 'CONFIRMED',
      gateway: 'MERCADOPAGO (PIX)',
      date: new Date().toISOString(),
    },
    {
      id: 'ORD-9841',
      customer: 'Beatriz Ramos',
      product: 'Samsung Galaxy S24 Ultra 512GB',
      total: 7999,
      status: 'SHIPPED',
      gateway: 'STRIPE (CARD)',
      date: new Date(Date.now() - 3600000 * 4).toISOString(),
    },
    {
      id: 'ORD-9840',
      customer: 'Carlos Eduardo',
      product: 'Xiaomi 14 Ultra 512GB',
      total: 6499,
      status: 'DELIVERED',
      gateway: 'MERCADOPAGO (CARD)',
      date: new Date(Date.now() - 3600000 * 24).toISOString(),
    },
  ]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 border-b border-slate-800 gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sliders className="w-6 h-6 text-purple-400" />
            <h1 className="text-3xl font-black text-white">Nexus Admin Dashboard</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Visão geral em tempo real de vendas, faturamento e estoque de smartphones
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
            ● Sistemas Operacionais Online
          </span>
        </div>
      </div>

      {/* ==================== STATS CARDS ==================== */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Receita Total</span>
            <DollarSign className="w-5 h-5 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-white">{formatCurrency(stats.totalRevenue)}</p>
          <p className="text-[11px] text-emerald-400 flex items-center gap-1 font-medium">
            <TrendingUp className="w-3.5 h-3.5" /> +18.4% em relação ao mês anterior
          </p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Pedidos Concluídos</span>
            <ShoppingBag className="w-5 h-5 text-indigo-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalOrders}</p>
          <p className="text-[11px] text-slate-400">Taxa de conversão: 3.8%</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Clientes Ativos</span>
            <Users className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-white">{stats.totalCustomers}</p>
          <p className="text-[11px] text-slate-400">Cadastrados no e-commerce</p>
        </div>

        <div className="p-6 bg-slate-900 border border-slate-800 rounded-3xl space-y-3">
          <div className="flex justify-between items-center text-slate-400">
            <span className="text-xs font-semibold">Alertas de Estoque</span>
            <AlertTriangle className="w-5 h-5 text-amber-400" />
          </div>
          <p className="text-2xl font-black text-amber-400">{stats.lowStockCount}</p>
          <p className="text-[11px] text-slate-400">Modelos com menos de 10 un.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* ==================== PEDIDOS RECENTES ==================== */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Package className="w-5 h-5 text-indigo-400" />
            Últimos Pedidos Recebidos
          </h2>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 pb-3">
                  <th className="py-2">Pedido</th>
                  <th className="py-2">Cliente</th>
                  <th className="py-2">Smartphone</th>
                  <th className="py-2">Valor</th>
                  <th className="py-2">Gateway</th>
                  <th className="py-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {recentOrders.map((ord) => (
                  <tr key={ord.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 font-mono font-bold text-indigo-400">{ord.id}</td>
                    <td className="py-3 text-slate-200">{ord.customer}</td>
                    <td className="py-3 text-slate-300 max-w-[200px] truncate">{ord.product}</td>
                    <td className="py-3 font-bold text-white">{formatCurrency(ord.total)}</td>
                    <td className="py-3 text-[11px] text-slate-400">{ord.gateway}</td>
                    <td className="py-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ord.status === 'CONFIRMED'
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : ord.status === 'SHIPPED'
                            ? 'bg-indigo-950 text-indigo-400 border border-indigo-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {ord.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ==================== ALERTA DE ESTOQUE ==================== */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 space-y-6">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-amber-400" />
            Reposição Crítica
          </h2>

          <div className="space-y-4">
            {lowStock.map((item) => (
              <div
                key={item.name}
                className="p-4 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold uppercase text-indigo-400">{item.brand}</span>
                  <h4 className="text-xs font-semibold text-white">{item.name}</h4>
                </div>
                <span className="px-2.5 py-1 bg-amber-950 text-amber-300 border border-amber-800 text-xs font-bold rounded-xl">
                  {item.stock} restam
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
