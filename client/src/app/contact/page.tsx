'use client'

import { FormEvent, useState } from 'react'
import { apiFetch } from '../../lib/api'

export default function ContactPage() {
  const [form, setForm] = useState({ name: '', email: '', orderId: '', message: '', website: '' })
  const [sent, setSent] = useState(false)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSending(true)
    try {
      await apiFetch('/contact', { method: 'POST', body: { ...form, orderId: form.orderId || undefined } })
      setSent(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a mensagem.')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container grid gap-10 py-12 md:grid-cols-[1fr_1.2fr] md:py-20">
      <div>
        <h1 className="text-4xl font-extrabold tracking-tight md:text-5xl">Fale com a loja</h1>
        <p className="mt-4 max-w-md text-lg leading-relaxed text-graphite">
          Dúvida sobre um modelo, prazo ou garantia? Escreva aqui. A resposta chega no seu e-mail.
        </p>
        <p className="mt-6 text-sm text-graphite">
          Já comprou? Informe o número do pedido para agilizar o atendimento.
        </p>
      </div>

      <div className="panel p-6 md:p-8">
        {sent ? (
          <div className="space-y-2">
            <p className="font-display text-xl font-semibold">Mensagem enviada</p>
            <p className="text-graphite">Vamos responder em {form.email}.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-5">
            {error && <p className="notice-error">{error}</p>}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="field-label">Nome</label>
                <input id="name" required minLength={2} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="field" />
              </div>
              <div>
                <label htmlFor="email" className="field-label">E-mail</label>
                <input id="email" required type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="field" />
              </div>
            </div>
            <div>
              <label htmlFor="orderId" className="field-label">
                Número do pedido <span className="font-normal text-graphite">(opcional)</span>
              </label>
              <input id="orderId" value={form.orderId} onChange={(e) => setForm({ ...form, orderId: e.target.value })} className="field" />
            </div>
            <div>
              <label htmlFor="message" className="field-label">Mensagem</label>
              <textarea id="message" required minLength={10} rows={6} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} className="field" />
            </div>
            {/* Campo invisível anti-robô */}
            <input type="text" name="website" tabIndex={-1} autoComplete="off" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} className="hidden" aria-hidden="true" />
            <button disabled={sending} className="btn-primary w-full py-3">
              {sending ? 'Enviando...' : 'Enviar mensagem'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}
