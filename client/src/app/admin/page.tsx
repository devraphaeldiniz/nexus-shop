'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Package,
  Plus,
  Settings,
  DollarSign,
  TrendingUp,
  AlertCircle,
  Truck,
  Check,
  Edit2,
  Trash2,
  Eye,
  Key,
  Smartphone,
  Save,
  Search,
} from 'lucide-react'
import { useAuthStore } from '../../store/useAuthStore'
import { formatCurrency, formatDate } from '../../lib/utils'

interface ProductItem {
  id: string
  name: string
  brand: string
  model: string
  sku: string
  price: number
  stock: number
  isActive: boolean
  images: { url: string }[]
  specifications: any
}

interface OrderItem {
  id: string
  total: number
  status: string
  paymentStatus: string
  paymentGateway: string
  trackingCode?: string
  createdAt: string
  user: { name: string; email: string }
  address: { street: string; number: string; city: string; state: string }
  items: { name: string; quantity: number; price: number }[]
}

export default function AdminPage() {
  const router = useRouter()
  const { user, accessToken, isAuthenticated } = useAuthStore()

  const [activeTab, setActiveTab] = useState<'products' | 'orders' | 'settings'>('products')
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  // Estados dos Produtos
  const [products, setProducts] = useState<ProductItem[]>([])
  const [productSearch, setProductSearch] = useState('')
  const [isProductModalOpen, setIsProductModalOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductItem | null>(null)
  const [productForm, setProductForm] = useState({
    name: '',
    brand: '',
    model: '',
    sku: '',
    price: 0,
    stock: 0,
    description: '',
    images: '',
    ram: 8,
    storage: 256,
    screenSize: '6.7"',
    processor: '',
    colors: 'Preto, Branco, Titânio',
  })

  // Estados dos Pedidos
  const [orders, setOrders] = useState<OrderItem[]>([])
  const [orderTracking, setOrderTracking] = useState<{ [key: string]: string }>({})

  // Estados das Configurações do Lojista
  const [settingsForm, setSettingsForm] = useState({
    storeName: 'Nexus Shop',
    legalName: '',
    documentNumber: '',
    contactEmail: '',
    contactPhone: '',
    supportWhatsapp: '',
    freeShippingThreshold: 0,
    stripeEnabled: false,
    stripePublishableKey: '',
    stripeSecretKey: '',
    mercadoPagoEnabled: false,
    mercadoPagoPublicKey: '',
    mercadoPagoAccessToken: '',
    pixKey: '',
  })
  const [settingsSaved, setSettingsSaved] = useState(false)

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (mounted && (!isAuthenticated || user?.role !== 'ADMIN')) {
      router.push('/login')
      return
    }
    if (mounted) {
      loadData()
    }
  }, [mounted, isAuthenticated, user, activeTab])

  const loadData = async () => {
    setLoading(true)
    try {
      // Carregar Produtos
      const prodRes = await fetch(`${apiUrl}/products?limit=100`)
      if (prodRes.ok) {
        const prodData = await prodRes.json()
        setProducts(prodData.products || [])
      }

      // Carregar Pedidos
      if (accessToken) {
        const ordRes = await fetch(`${apiUrl}/orders/admin/all`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (ordRes.ok) {
          const ordData = await ordRes.json()
          setOrders(ordData.orders || [])
        }

        // Carregar Configurações do Lojista
        const setRes = await fetch(`${apiUrl}/settings`, {
          headers: { Authorization: `Bearer ${accessToken}` },
        })
        if (setRes.ok) {
          const setData = await setRes.json()
          if (setData.settings) {
            setSettingsForm({
              storeName: setData.settings.storeName || 'Nexus Shop',
              legalName: setData.settings.legalName || '',
              documentNumber: setData.settings.documentNumber || '',
              contactEmail: setData.settings.contactEmail || '',
              contactPhone: setData.settings.contactPhone || '',
              supportWhatsapp: setData.settings.supportWhatsapp || '',
              freeShippingThreshold: Number(setData.settings.freeShippingThreshold || 0),
              stripeEnabled: setData.settings.stripeEnabled || false,
              stripePublishableKey: setData.settings.stripePublishableKey || '',
              stripeSecretKey: setData.settings.stripeSecretKey || '',
              mercadoPagoEnabled: setData.settings.mercadoPagoEnabled || false,
              mercadoPagoPublicKey: setData.settings.mercadoPagoPublicKey || '',
              mercadoPagoAccessToken: setData.settings.mercadoPagoAccessToken || '',
              pixKey: setData.settings.pixKey || '',
            })
          }
        }
      }
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  // ==================== SALVAR PRODUTO ====================
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault()
    const payload = {
      name: productForm.name,
      brand: productForm.brand,
      model: productForm.model,
      sku: productForm.sku,
      price: Number(productForm.price),
      stock: Number(productForm.stock),
      description: productForm.description,
      isFeatured: true,
      images: productForm.images
        .split('\n')
        .map((url) => url.trim())
        .filter((url) => url.length > 0),
      specifications: {
        screenSize: productForm.screenSize,
        processor: productForm.processor || 'Processador Octa-core',
        ram: Number(productForm.ram),
        storage: Number(productForm.storage),
        battery: 5000,
        mainCamera: '50 MP Principal',
        frontCamera: '12 MP Frontal',
        os: 'Android / iOS',
        resolution: 'FHD+ OLED',
        colors: productForm.colors.split(',').map((c) => c.trim()),
      },
    }

    try {
      const endpoint = editingProduct
        ? `${apiUrl}/products/${editingProduct.id}`
        : `${apiUrl}/products`
      const method = editingProduct ? 'PATCH' : 'POST'

      const res = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(payload),
      })

      if (res.ok) {
        setIsProductModalOpen(false)
        setEditingProduct(null)
        loadData()
      } else {
        const error = await res.json()
        alert(error.message || 'Erro ao salvar produto')
      }
    } catch (err) {
      alert('Falha na comunicação com o servidor')
    }
  }

  // ==================== DESATIVAR PRODUTO ====================
  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Deseja realmente desativar este produto da vitrine?')) return
    try {
      const res = await fetch(`${apiUrl}/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      if (res.ok) {
        loadData()
      }
    } catch {
      alert('Erro ao excluir produto')
    }
  }

  // ==================== ATUALIZAR STATUS DO PEDIDO ====================
  const handleUpdateOrderStatus = async (orderId: string, status: string) => {
    const trackingCode = orderTracking[orderId] || undefined
    try {
      const res = await fetch(`${apiUrl}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ status, trackingCode }),
      })
      if (res.ok) {
        loadData()
      }
    } catch {
      alert('Erro ao atualizar status do pedido')
    }
  }

  // ==================== SALVAR CONFIGURAÇÕES DO LOJISTA ====================
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSettingsSaved(false)
    try {
      const res = await fetch(`${apiUrl}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify(settingsForm),
      })
      if (res.ok) {
        setSettingsSaved(true)
        setTimeout(() => setSettingsSaved(false), 3000)
      } else {
        alert('Erro ao salvar configurações')
      }
    } catch {
      alert('Erro na comunicação com o servidor')
    }
  }

  if (!mounted) return null

  const filteredProducts = products.filter(
    (p) =>
      p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.brand.toLowerCase().includes(productSearch.toLowerCase()) ||
      p.sku.toLowerCase().includes(productSearch.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Top Header Administrativo */}
      <div className="border-b border-slate-800 bg-slate-900/60 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              Painel de Gestão da Loja
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Gerencie seus smartphones, pedidos de clientes e credenciais de pagamento.
            </p>
          </div>

          {/* Abas de Navegação */}
          <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('products')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'products'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Package className="w-4 h-4" />
              Produtos ({products.length})
            </button>
            <button
              onClick={() => setActiveTab('orders')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'orders'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Truck className="w-4 h-4" />
              Pedidos ({orders.length})
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'settings'
                  ? 'bg-indigo-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Key className="w-4 h-4" />
              Pagamentos & Loja
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* ======================================================== */}
        {/* ABA 1: PRODUTOS / ESTOQUE                                 */}
        {/* ======================================================== */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Buscar por modelo, marca ou SKU..."
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-2 pl-10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-2.5" />
              </div>

              <button
                onClick={() => {
                  setEditingProduct(null)
                  setProductForm({
                    name: '',
                    brand: 'Apple',
                    model: '',
                    sku: '',
                    price: 0,
                    stock: 10,
                    description: '',
                    images: '',
                    ram: 8,
                    storage: 256,
                    screenSize: '6.7"',
                    processor: '',
                    colors: 'Preto, Branco',
                  })
                  setIsProductModalOpen(true)
                }}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-xl shadow transition-colors"
              >
                <Plus className="w-4 h-4" />
                Cadastrar Novo Smartphone
              </button>
            </div>

            {/* Tabela de Produtos */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Smartphone</th>
                    <th className="py-3 px-4">SKU</th>
                    <th className="py-3 px-4">Preço</th>
                    <th className="py-3 px-4">Estoque</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Nenhum produto cadastrado no catálogo da loja.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 flex items-center gap-3">
                          <img
                            src={p.images?.[0]?.url || 'https://via.placeholder.com/80'}
                            alt={p.name}
                            className="w-10 h-10 rounded-lg object-cover bg-slate-800"
                          />
                          <div>
                            <span className="font-semibold text-white block">{p.name}</span>
                            <span className="text-[10px] text-slate-400">{p.brand} · {p.model}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 font-mono text-slate-300">{p.sku}</td>
                        <td className="py-3 px-4 font-bold text-white">{formatCurrency(p.price)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              p.stock > 5
                                ? 'bg-slate-800 text-slate-200'
                                : 'bg-rose-950 text-rose-400 border border-rose-800'
                            }`}
                          >
                            {p.stock} un.
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                              p.isActive
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {p.isActive ? 'Ativo na Loja' : 'Pausado'}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-2">
                          <button
                            onClick={() => {
                              setEditingProduct(p)
                              setProductForm({
                                name: p.name,
                                brand: p.brand,
                                model: p.model,
                                sku: p.sku,
                                price: p.price,
                                stock: p.stock,
                                description: (p as any).description || '',
                                images: p.images?.map((img) => img.url).join('\n') || '',
                                ram: p.specifications?.ram || 8,
                                storage: p.specifications?.storage || 256,
                                screenSize: p.specifications?.screenSize || '6.7"',
                                processor: p.specifications?.processor || '',
                                colors: p.specifications?.colors?.join(', ') || 'Preto, Branco',
                              })
                              setIsProductModalOpen(true)
                            }}
                            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
                            title="Editar"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteProduct(p.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition-colors"
                            title="Desativar"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 2: PEDIDOS DOS CLIENTES                              */}
        {/* ======================================================== */}
        {activeTab === 'orders' && (
          <div className="space-y-6">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 border-b border-slate-800 text-slate-400 uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Pedido / Data</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Itens</th>
                    <th className="py-3 px-4">Total</th>
                    <th className="py-3 px-4">Pagamento</th>
                    <th className="py-3 px-4">Status & Rastreio</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80">
                  {orders.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-slate-500">
                        Nenhum pedido realizado até o momento.
                      </td>
                    </tr>
                  ) : (
                    orders.map((ord) => (
                      <tr key={ord.id} className="hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-indigo-400 block">#{ord.id.slice(-8)}</span>
                          <span className="text-[10px] text-slate-500">{formatDate(ord.createdAt)}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-white block">{ord.user?.name}</span>
                          <span className="text-[10px] text-slate-400">{ord.user?.email}</span>
                          <span className="text-[10px] text-slate-500 block">
                            {ord.address?.city}/{ord.address?.state}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-[200px]">
                          {ord.items?.map((item, idx) => (
                            <div key={idx} className="text-slate-300 truncate">
                              {item.quantity}x {item.name}
                            </div>
                          ))}
                        </td>
                        <td className="py-3 px-4 font-bold text-white">{formatCurrency(ord.total)}</td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              ord.paymentStatus === 'PAID'
                                ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {ord.paymentStatus === 'PAID' ? 'Pago' : 'Pendente'}
                          </span>
                          <span className="text-[10px] text-slate-400 block mt-1">{ord.paymentGateway}</span>
                        </td>
                        <td className="py-3 px-4 space-y-1.5">
                          <select
                            value={ord.status}
                            onChange={(e) => handleUpdateOrderStatus(ord.id, e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1"
                          >
                            <option value="PENDING">Pendente</option>
                            <option value="CONFIRMED">Confirmado</option>
                            <option value="PROCESSING">Em Separação</option>
                            <option value="SHIPPED">Enviado</option>
                            <option value="DELIVERED">Entregue</option>
                            <option value="CANCELLED">Cancelado</option>
                          </select>

                          <div className="flex gap-1">
                            <input
                              type="text"
                              placeholder="Código de Rastreio"
                              defaultValue={ord.trackingCode || ''}
                              onChange={(e) =>
                                setOrderTracking({ ...orderTracking, [ord.id]: e.target.value })
                              }
                              className="bg-slate-800 border border-slate-700 rounded px-2 py-0.5 text-[10px] text-white w-32"
                            />
                            <button
                              onClick={() => handleUpdateOrderStatus(ord.id, ord.status)}
                              className="px-2 py-0.5 bg-indigo-600 text-[10px] text-white rounded font-semibold"
                            >
                              Salvar
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* ABA 3: CONFIGURAÇÕES DA LOJA E APIS DE PAGAMENTO         */}
        {/* ======================================================== */}
        {activeTab === 'settings' && (
          <form onSubmit={handleSaveSettings} className="max-w-4xl space-y-8">
            {/* Dados Cadastrais */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Settings className="w-4 h-4 text-indigo-400" />
                Informações Institucionais da Loja
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Nome Comercial da Loja</label>
                  <input
                    type="text"
                    value={settingsForm.storeName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, storeName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Razão Social (Opcional)</label>
                  <input
                    type="text"
                    value={settingsForm.legalName}
                    onChange={(e) => setSettingsForm({ ...settingsForm, legalName: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">CNPJ ou CPF do Lojista</label>
                  <input
                    type="text"
                    value={settingsForm.documentNumber}
                    onChange={(e) => setSettingsForm({ ...settingsForm, documentNumber: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">WhatsApp de Atendimento</label>
                  <input
                    type="text"
                    value={settingsForm.supportWhatsapp}
                    onChange={(e) => setSettingsForm({ ...settingsForm, supportWhatsapp: e.target.value })}
                    placeholder="(11) 99999-9999"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>
            </div>

            {/* Credenciais de Pagamento: Mercado Pago */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Credenciais Mercado Pago (PIX e Cartões Nacionais)
                </h2>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.mercadoPagoEnabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mercadoPagoEnabled: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Habilitar Mercado Pago</span>
                </label>
              </div>

              <p className="text-xs text-slate-400">
                O lojista deve pegar essas credenciais no Painel de Desenvolvedores do Mercado Pago (Mercado Pago Developers).
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Public Key (Chave Pública)</label>
                  <input
                    type="text"
                    value={settingsForm.mercadoPagoPublicKey}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mercadoPagoPublicKey: e.target.value })}
                    placeholder="APP_USR-..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Access Token (Chave Privada de Acesso)</label>
                  <input
                    type="password"
                    value={settingsForm.mercadoPagoAccessToken}
                    onChange={(e) => setSettingsForm({ ...settingsForm, mercadoPagoAccessToken: e.target.value })}
                    placeholder="APP_USR-..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px]"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Chave PIX Direta (Opcional)</label>
                  <input
                    type="text"
                    value={settingsForm.pixKey}
                    onChange={(e) => setSettingsForm({ ...settingsForm, pixKey: e.target.value })}
                    placeholder="CNPJ, E-mail, Telefone ou Chave Aleatória"
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            {/* Credenciais de Pagamento: Stripe */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h2 className="text-sm font-bold text-white flex items-center gap-2">
                  <Key className="w-4 h-4 text-indigo-400" />
                  Credenciais Stripe (Cartões Internacionais & Apple Pay)
                </h2>
                <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settingsForm.stripeEnabled}
                    onChange={(e) => setSettingsForm({ ...settingsForm, stripeEnabled: e.target.checked })}
                    className="rounded border-slate-700 text-indigo-600 focus:ring-0"
                  />
                  <span>Habilitar Stripe</span>
                </label>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">Publishable Key (Chave Publicável)</label>
                  <input
                    type="text"
                    value={settingsForm.stripePublishableKey}
                    onChange={(e) => setSettingsForm({ ...settingsForm, stripePublishableKey: e.target.value })}
                    placeholder="pk_live_... ou pk_test_..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px]"
                  />
                </div>
                <div>
                  <label className="text-slate-400 block mb-1">Secret Key (Chave Secreta)</label>
                  <input
                    type="password"
                    value={settingsForm.stripeSecretKey}
                    onChange={(e) => setSettingsForm({ ...settingsForm, stripeSecretKey: e.target.value })}
                    placeholder="sk_live_... ou sk_test_..."
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px]"
                  />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition-colors"
              >
                <Save className="w-4 h-4" />
                Salvar Configurações da Loja
              </button>
              {settingsSaved && (
                <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                  <Check className="w-4 h-4" /> Dados atualizados com sucesso!
                </span>
              )}
            </div>
          </form>
        )}
      </div>

      {/* ======================================================== */}
      {/* MODAL DE CADASTRO / EDIÇÃO DE SMARTPHONE                 */}
      {/* ======================================================== */}
      {isProductModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-2xl p-6 sm:p-8 space-y-6 max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-indigo-400" />
                {editingProduct ? 'Editar Smartphone' : 'Cadastrar Novo Smartphone'}
              </h3>
              <button
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕ Fechar
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Nome do Smartphone *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Apple iPhone 15 Pro Max 256GB"
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Fabricante / Marca *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Apple, Samsung, Xiaomi"
                    value={productForm.brand}
                    onChange={(e) => setProductForm({ ...productForm, brand: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Modelo Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: iPhone 15 Pro Max"
                    value={productForm.model}
                    onChange={(e) => setProductForm({ ...productForm, model: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">SKU (Código Interno) *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: AAPL-IP15PM-256"
                    value={productForm.sku}
                    onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Preço de Venda (R$) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Quantidade em Estoque *</label>
                  <input
                    type="number"
                    required
                    value={productForm.stock}
                    onChange={(e) => setProductForm({ ...productForm, stock: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Armazenamento (GB)</label>
                  <input
                    type="number"
                    value={productForm.storage}
                    onChange={(e) => setProductForm({ ...productForm, storage: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Memória RAM (GB)</label>
                  <input
                    type="number"
                    value={productForm.ram}
                    onChange={(e) => setProductForm({ ...productForm, ram: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">Processador</label>
                  <input
                    type="text"
                    placeholder="Ex: Snapdragon 8 Gen 3 ou Apple A17 Pro"
                    value={productForm.processor}
                    onChange={(e) => setProductForm({ ...productForm, processor: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Cores Disponíveis (separadas por vírgula)</label>
                  <input
                    type="text"
                    placeholder="Ex: Titânio Natural, Preto Espacial, Azul"
                    value={productForm.colors}
                    onChange={(e) => setProductForm({ ...productForm, colors: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>

                <div className="sm:col-span-2 space-y-2">
                  <label className="text-slate-400 block mb-1">Fotos do Smartphone</label>
                  
                  {/* Upload Direto de Imagem */}
                  <div className="flex items-center gap-3">
                    <label className="cursor-pointer px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white rounded-xl text-xs font-semibold inline-flex items-center gap-2 transition-colors">
                      <Plus className="w-4 h-4 text-indigo-400" />
                      <span>Fazer Upload de Foto do Computador</span>
                      <input
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]
                          if (!file) return
                          const formData = new FormData()
                          formData.append('file', file)

                          try {
                            const res = await fetch(`${apiUrl}/upload`, {
                              method: 'POST',
                              headers: { Authorization: `Bearer ${accessToken}` },
                              body: formData,
                            })
                            if (res.ok) {
                              const uploadData = await res.json()
                              const currentImages = productForm.images ? productForm.images + '\n' : ''
                              setProductForm({ ...productForm, images: `${currentImages}${apiUrl.replace('/api/v1', '')}${uploadData.url}` })
                            } else {
                              alert('Erro ao enviar imagem. Verifique se o arquivo tem até 10MB (JPG/PNG/WEBP).')
                            }
                          } catch {
                            alert('Falha na conexão durante o upload.')
                          }
                        }}
                      />
                    </label>
                    <span className="text-[10px] text-slate-500">Ou cole links externos abaixo (uma URL por linha):</span>
                  </div>

                  <textarea
                    rows={3}
                    placeholder="https://exemplo.com/foto1.jpg&#10;https://exemplo.com/foto2.jpg"
                    value={productForm.images}
                    onChange={(e) => setProductForm({ ...productForm, images: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-[11px]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-slate-400 block mb-1">Descrição Comercial</label>
                  <textarea
                    rows={3}
                    placeholder="Detalhes sobre a câmera, tela, garantia e performance..."
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl p-2.5 text-white"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-700 text-slate-300 hover:bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow"
                >
                  {editingProduct ? 'Atualizar Smartphone' : 'Cadastrar no Catálogo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
