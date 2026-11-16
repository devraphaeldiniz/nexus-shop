'use client'

import { FormEvent, useEffect, useState } from 'react'
import { Check, CreditCard, QrCode, Save, Settings } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { StoreSettingsForm, errorMessage, inputClass, labelClass } from './types'

const EMPTY: StoreSettingsForm = {
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
}

type ApiSettings = { [K in keyof StoreSettingsForm]?: StoreSettingsForm[K] | null }

function fromApi(settings: ApiSettings): StoreSettingsForm {
  const form = { ...EMPTY }
  for (const key of Object.keys(EMPTY) as Array<keyof StoreSettingsForm>) {
    const value = settings[key]
    if (value !== null && value !== undefined) (form as Record<string, unknown>)[key] = value
  }
  form.freeShippingThreshold = Number(settings.freeShippingThreshold ?? 0)
  return form
}

export function SettingsTab({ onChange }: { onChange: () => void }) {
  const [form, setForm] = useState<StoreSettingsForm>(EMPTY)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    apiFetch<{ settings: ApiSettings }>('/settings')
      .then((data) => setForm(fromApi(data.settings)))
      .catch((err) => setError(errorMessage(err, 'Não foi possível carregar as configurações.')))
  }, [])

  const set = <K extends keyof StoreSettingsForm>(key: K, value: StoreSettingsForm[K]) => setForm((f) => ({ ...f, [key]: value }))

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSaved(false)
    setSaving(true)
    try {
      // Segredos mascarados ("••••1234") voltam como estão: o servidor entende que não mudaram
      const data = await apiFetch<{ settings: ApiSettings }>('/settings', { method: 'PUT', body: form })
      setForm(fromApi(data.settings))
      setSaved(true)
      onChange()
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      setError(errorMessage(err, 'Erro ao salvar as configurações.'))
    } finally {
      setSaving(false)
    }
  }

  const text = (key: keyof StoreSettingsForm, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label className={labelClass}>{label}</label>
      <input className={inputClass} value={String(form[key] ?? '')} onChange={(e) => set(key, e.target.value as never)} {...props} />
    </div>
  )

  const secretHint = 'Salva criptografada. Deixe como está para manter; apague o campo para remover.'

  return (
    <form onSubmit={submit} className="max-w-4xl space-y-6">
      {error && <p className="rounded-lg border border-transparent bg-danger-soft p-3 text-xs text-danger">{error}</p>}

      <section className="panel p-6 space-y-4">
        <h2 className="text-sm font-bold text-ink flex items-center gap-2 border-b border-line pb-3">
          <Settings className="w-4 h-4 text-signal" /> Dados da loja
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {text('storeName', 'Nome da loja *', { required: true })}
          {text('legalName', 'Razão social')}
          {text('documentNumber', 'CNPJ ou CPF')}
          {text('contactEmail', 'E-mail de contato (recebe o formulário "Fale conosco")', { type: 'email' })}
          {text('contactPhone', 'Telefone')}
          {text('supportWhatsapp', 'WhatsApp de atendimento')}
          <div>
            <label className={labelClass}>Frete grátis a partir de (R$, 0 = desativado)</label>
            <input type="number" min={0} step={0.01} className={inputClass} value={form.freeShippingThreshold} onChange={(e) => set('freeShippingThreshold', Number(e.target.value))} />
          </div>
        </div>
      </section>

      <section className="panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <QrCode className="w-4 h-4 text-signal" /> Mercado Pago (PIX)
          </h2>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" checked={form.mercadoPagoEnabled} onChange={(e) => set('mercadoPagoEnabled', e.target.checked)} />
            Ativo no checkout
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {text('mercadoPagoPublicKey', 'Public Key', { placeholder: 'APP_USR-... ou TEST-...' })}
          <div>
            {text('mercadoPagoAccessToken', 'Access Token', { type: 'password', autoComplete: 'off', placeholder: 'APP_USR-...' })}
            <p className="mt-1 text-[10px] text-graphite">{secretHint}</p>
          </div>
          {text('pixKey', 'Chave PIX (informativa)')}
        </div>
      </section>

      <section className="panel p-6 space-y-4">
        <div className="flex items-center justify-between border-b border-line pb-3">
          <h2 className="text-sm font-bold text-ink flex items-center gap-2">
            <CreditCard className="w-4 h-4 text-signal" /> Stripe (cartão)
          </h2>
          <label className="flex items-center gap-2 text-xs text-ink">
            <input type="checkbox" checked={form.stripeEnabled} onChange={(e) => set('stripeEnabled', e.target.checked)} />
            Ativo no checkout
          </label>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {text('stripePublishableKey', 'Publishable Key', { placeholder: 'pk_test_... ou pk_live_...' })}
          <div>
            {text('stripeSecretKey', 'Secret Key', { type: 'password', autoComplete: 'off', placeholder: 'sk_test_... ou sk_live_...' })}
            <p className="mt-1 text-[10px] text-graphite">{secretHint}</p>
          </div>
        </div>
      </section>

      <button disabled={saving} className="inline-flex items-center gap-2 px-5 py-2.5 bg-ink hover:bg-ink-soft disabled:opacity-50 text-white text-xs font-semibold rounded-xl">
        {saved ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
        {saving ? 'Salvando...' : saved ? 'Configurações salvas' : 'Salvar configurações'}
      </button>
    </form>
  )
}
