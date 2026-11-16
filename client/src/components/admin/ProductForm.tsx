'use client'

import { FormEvent, useState } from 'react'
import { Upload, X } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { AdminProduct, errorMessage, inputClass, labelClass } from './types'

interface FormState {
  name: string
  brand: string
  model: string
  sku: string
  price: string
  compareAtPrice: string
  stock: string
  description: string
  images: string
  isFeatured: boolean
  screenSize: string
  resolution: string
  processor: string
  ram: string
  storage: string
  battery: string
  mainCamera: string
  frontCamera: string
  os: string
  charging: string
  colors: string
}

function toForm(product: AdminProduct | null): FormState {
  const spec = product?.specifications ?? {}
  return {
    name: product?.name ?? '',
    brand: product?.brand ?? '',
    model: product?.model ?? '',
    sku: product?.sku ?? '',
    price: product ? String(Number(product.price)) : '',
    compareAtPrice: product?.compareAtPrice ? String(Number(product.compareAtPrice)) : '',
    stock: product ? String(product.stock) : '10',
    description: product?.description ?? '',
    images: product?.images.map((i) => i.url).join('\n') ?? '',
    isFeatured: product?.isFeatured ?? false,
    screenSize: spec.screenSize ?? '',
    resolution: spec.resolution ?? '',
    processor: spec.processor ?? '',
    ram: spec.ram ? String(spec.ram) : '8',
    storage: spec.storage ? String(spec.storage) : '256',
    battery: spec.battery ? String(spec.battery) : '',
    mainCamera: spec.mainCamera ?? '',
    frontCamera: spec.frontCamera ?? '',
    os: spec.os ?? '',
    charging: spec.charging ?? '',
    colors: spec.colors?.join(', ') ?? '',
  }
}

/** Cadastro e edição de produto. Na edição, campos não alterados mantêm o valor salvo. */
export function ProductForm({
  product,
  onClose,
  onSaved,
}: {
  product: AdminProduct | null
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState<FormState>(() => toForm(product))
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function uploadImage(file: File) {
    setUploading(true)
    setError('')
    try {
      const body = new FormData()
      body.append('file', file)
      const data = await apiFetch<{ url: string }>('/upload', { method: 'POST', body })
      const url = data.url.startsWith('http') ? data.url : `${window.location.origin}${data.url}`
      setForm((f) => ({ ...f, images: f.images ? `${f.images}\n${url}` : url }))
    } catch (err) {
      setError(errorMessage(err, 'Erro ao enviar imagem (JPG, PNG ou WEBP até 10MB).'))
    } finally {
      setUploading(false)
    }
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaving(true)

    const spec = product?.specifications ?? {}
    const payload = {
      name: form.name.trim(),
      brand: form.brand.trim(),
      model: form.model.trim(),
      sku: form.sku.trim(),
      price: Number(form.price),
      ...(form.compareAtPrice ? { compareAtPrice: Number(form.compareAtPrice) } : product ? { compareAtPrice: null } : {}),
      stock: Number(form.stock),
      description: form.description.trim(),
      isFeatured: form.isFeatured,
      images: form.images.split('\n').map((u) => u.trim()).filter(Boolean),
      specifications: {
        ...spec,
        screenSize: form.screenSize.trim() || spec.screenSize || '-',
        resolution: form.resolution.trim() || spec.resolution || '-',
        processor: form.processor.trim() || spec.processor || '-',
        ram: Number(form.ram),
        storage: Number(form.storage),
        battery: Number(form.battery) || spec.battery || 4000,
        mainCamera: form.mainCamera.trim() || spec.mainCamera || '-',
        frontCamera: form.frontCamera.trim() || spec.frontCamera || '-',
        os: form.os.trim() || spec.os || '-',
        ...(form.charging.trim() ? { charging: form.charging.trim() } : {}),
        colors: form.colors.split(',').map((c) => c.trim()).filter(Boolean),
      },
    }

    try {
      await apiFetch(product ? `/products/${product.id}` : '/products', {
        method: product ? 'PATCH' : 'POST',
        body: payload,
      })
      onSaved()
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar o produto.'))
      setSaving(false)
    }
  }

  const field = (key: keyof FormState, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input
        className={inputClass}
        value={form[key] as string}
        onChange={(e) => set(key, e.target.value as never)}
        {...props}
      />
    </div>
  )

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/70 p-4 backdrop-blur-sm">
      <form onSubmit={submit} className="my-8 w-full max-w-3xl space-y-5 rounded-2xl border border-line bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-ink">{product ? 'Editar smartphone' : 'Cadastrar smartphone'}</h2>
          <button type="button" onClick={onClose} className="p-1.5 text-graphite hover:text-ink" aria-label="Fechar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && <p className="rounded-lg border border-transparent bg-danger-soft p-3 text-xs text-danger">{error}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field('name', 'Nome *', { required: true, minLength: 3, placeholder: 'Ex: Apple iPhone 15 Pro Max 256GB' })}
          {field('brand', 'Marca *', { required: true, minLength: 2, placeholder: 'Ex: Apple' })}
          {field('model', 'Modelo *', { required: true, placeholder: 'Ex: iPhone 15 Pro Max' })}
          {field('sku', 'SKU *', { required: true, minLength: 3, placeholder: 'Ex: AAPL-IP15PM-256' })}
          {field('price', 'Preço (R$) *', { required: true, type: 'number', min: 0.01, step: 0.01 })}
          {field('compareAtPrice', 'Preço "de" (opcional)', { type: 'number', min: 0.01, step: 0.01 })}
          {field('stock', 'Estoque *', { required: true, type: 'number', min: 0, step: 1 })}
          <label className="flex items-center gap-2 self-end pb-2 text-xs text-ink">
            <input type="checkbox" checked={form.isFeatured} onChange={(e) => set('isFeatured', e.target.checked)} />
            Destaque na página inicial
          </label>
        </div>

        <fieldset className="grid grid-cols-2 sm:grid-cols-4 gap-4 border-t border-line pt-4">
          <legend className="text-xs font-semibold text-ink mb-2">Especificações</legend>
          {field('ram', 'RAM (GB) *', { required: true, type: 'number', min: 1 })}
          {field('storage', 'Armazenamento (GB) *', { required: true, type: 'number', min: 1 })}
          {field('screenSize', 'Tela', { placeholder: '6.7"' })}
          {field('resolution', 'Resolução', { placeholder: 'FHD+ OLED' })}
          {field('processor', 'Processador', { placeholder: 'Snapdragon 8 Gen 3' })}
          {field('battery', 'Bateria (mAh)', { type: 'number', min: 1 })}
          {field('mainCamera', 'Câmera principal', { placeholder: '50 MP' })}
          {field('frontCamera', 'Câmera frontal', { placeholder: '12 MP' })}
          {field('os', 'Sistema', { placeholder: 'Android 14' })}
          {field('charging', 'Carregamento', { placeholder: '45W' })}
          <div className="col-span-2">{field('colors', 'Cores (separadas por vírgula) *', { required: true, placeholder: 'Preto, Branco' })}</div>
        </fieldset>

        <div className="space-y-2 border-t border-line pt-4">
          <div className="flex items-center justify-between">
            <label className={labelClass}>Fotos (uma URL por linha) *</label>
            <label className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-paper border border-line text-ink rounded-lg text-xs">
              <Upload className="w-3.5 h-3.5" /> {uploading ? 'Enviando...' : 'Enviar foto'}
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) uploadImage(file)
                  e.target.value = ''
                }}
              />
            </label>
          </div>
          <textarea required rows={3} className={inputClass} value={form.images} onChange={(e) => set('images', e.target.value)} placeholder="https://exemplo.com/foto1.jpg" />
        </div>

        <div>
          <label className={labelClass}>Descrição *</label>
          <textarea required minLength={10} rows={4} className={inputClass} value={form.description} onChange={(e) => set('description', e.target.value)} />
        </div>

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className="px-4 py-2 text-xs text-ink hover:text-ink">Cancelar</button>
          <button disabled={saving} className="px-5 py-2 bg-ink hover:bg-ink-soft disabled:opacity-50 text-white text-xs font-semibold rounded-lg">
            {saving ? 'Salvando...' : 'Salvar produto'}
          </button>
        </div>
      </form>
    </div>
  )
}
