'use client'

import { useCallback, useEffect, useState } from 'react'
import { Edit2, Eye, EyeOff, Plus, Search } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { formatCurrency } from '../../lib/utils'
import { ProductForm } from './ProductForm'
import { ProductImage } from '../products/ProductImage'
import { AdminProduct, errorMessage } from './types'

export function ProductsTab({ onChange }: { onChange: () => void }) {
  const [products, setProducts] = useState<AdminProduct[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<AdminProduct | null | undefined>(undefined) // undefined = modal fechado

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const data = await apiFetch<{ products: AdminProduct[] }>('/admin/products', {
        params: { search: search || undefined, limit: 100 },
      })
      setProducts(data.products)
      setError('')
    } catch (err) {
      setError(errorMessage(err, 'Não foi possível carregar os produtos.'))
    } finally {
      setLoading(false)
    }
  }, [search])

  useEffect(() => {
    const timer = setTimeout(load, 250) // espera parar de digitar
    return () => clearTimeout(timer)
  }, [load])

  async function toggleActive(product: AdminProduct) {
    const verb = product.isActive ? 'pausar' : 'reativar'
    if (!confirm(`Deseja ${verb} "${product.name}" na vitrine?`)) return
    try {
      await apiFetch(`/products/${product.id}`, { method: 'PATCH', body: { isActive: !product.isActive } })
      await load()
      onChange()
    } catch (err) {
      alert(errorMessage(err))
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por nome, marca ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full panel px-4 py-2 pl-10 text-xs text-ink placeholder:text-graphite/70 focus:outline-none focus:border-ink"
          />
          <Search className="w-4 h-4 text-graphite absolute left-3.5 top-2.5" />
        </div>
        <button
          onClick={() => setEditing(null)}
          className="flex items-center gap-2 px-4 py-2.5 bg-ink hover:bg-ink-soft text-white text-xs font-semibold rounded-xl"
        >
          <Plus className="w-4 h-4" /> Cadastrar smartphone
        </button>
      </div>

      {error && <p className="text-xs text-danger">{error}</p>}

      <div className="panel overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="bg-paper border-b border-line text-graphite uppercase tracking-wider font-semibold">
            <tr>
              <th className="py-3 px-4">Smartphone</th>
              <th className="py-3 px-4">SKU</th>
              <th className="py-3 px-4">Preço</th>
              <th className="py-3 px-4">Estoque</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4 text-right">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {!loading && products.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-graphite">Nenhum produto encontrado.</td>
              </tr>
            )}
            {products.map((p) => (
              <tr key={p.id} className={`hover:bg-paper ${p.isActive ? '' : 'opacity-60'}`}>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3">
                    <ProductImage src={p.images[0]?.url} alt={p.name} className="h-10 w-10 rounded-lg bg-stage object-cover" />
                    <div>
                      <span className="font-semibold text-ink block">{p.name}</span>
                      <span className="text-[10px] text-graphite">{p.brand} · {p.model}{p.isFeatured ? ' · destaque' : ''}</span>
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4 font-mono text-ink">{p.sku}</td>
                <td className="py-3 px-4 font-bold text-ink">{formatCurrency(Number(p.price))}</td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.stock > 5 ? 'bg-white text-ink' : 'bg-danger-soft text-danger'}`}>
                    {p.stock} un.
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${p.isActive ? 'bg-ok-soft text-ok' : 'bg-white text-graphite'}`}>
                    {p.isActive ? 'Ativo' : 'Pausado'}
                  </span>
                </td>
                <td className="py-3 px-4 text-right space-x-1 whitespace-nowrap">
                  <button onClick={() => setEditing(p)} className="p-1.5 text-graphite hover:text-ink rounded-lg hover:bg-paper" title="Editar">
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button onClick={() => toggleActive(p)} className="p-1.5 text-graphite hover:text-ink rounded-lg hover:bg-paper" title={p.isActive ? 'Pausar' : 'Reativar'}>
                    {p.isActive ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing !== undefined && (
        <ProductForm
          product={editing}
          onClose={() => setEditing(undefined)}
          onSaved={() => {
            setEditing(undefined)
            load()
            onChange()
          }}
        />
      )}
    </div>
  )
}
