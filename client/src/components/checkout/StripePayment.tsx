'use client'

import { FormEvent, useState } from 'react'
import { loadStripe, Stripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useElements, useStripe } from '@stripe/react-stripe-js'
import { Lock } from 'lucide-react'

const stripePromises = new Map<string, Promise<Stripe | null>>()

/** loadStripe deve ser chamado uma vez por chave pública. */
function getStripe(publishableKey: string) {
  if (!stripePromises.has(publishableKey)) {
    stripePromises.set(publishableKey, loadStripe(publishableKey))
  }
  return stripePromises.get(publishableKey)!
}

interface StripePaymentProps {
  clientSecret: string
  publishableKey: string
  orderId: string
  /** Chamado quando o Stripe aceitou o pagamento (a confirmação final vem pelo webhook). */
  onSubmitted?: () => void
}

export function StripePayment({ clientSecret, publishableKey, orderId, onSubmitted }: StripePaymentProps) {
  return (
    <Elements
      stripe={getStripe(publishableKey)}
      options={{
        clientSecret,
        locale: 'pt-BR',
        appearance: {
          theme: 'stripe',
          variables: { colorPrimary: '#16181D', colorText: '#16181D', borderRadius: '12px', fontSizeBase: '15px' },
        },
      }}
    >
      <StripePaymentForm orderId={orderId} onSubmitted={onSubmitted} />
    </Elements>
  )
}

function StripePaymentForm({ orderId, onSubmitted }: { orderId: string; onSubmitted?: () => void }) {
  const stripe = useStripe()
  const elements = useElements()
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!stripe || !elements) return

    setError('')
    setSubmitting(true)

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Usado só quando o método exige redirecionamento (ex.: 3D Secure)
        return_url: `${window.location.origin}/orders/${orderId}`,
      },
      redirect: 'if_required',
    })

    if (result.error) {
      setError(result.error.message || 'Pagamento não aprovado. Verifique os dados do cartão.')
      setSubmitting(false)
      return
    }

    setSubmitted(true)
    setSubmitting(false)
    onSubmitted?.()
  }

  if (submitted) {
    return <p className="notice-ok">Pagamento enviado. Aguardando a confirmação do Stripe...</p>
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      {error && <p className="notice-error">{error}</p>}
      <button type="submit" disabled={!stripe || submitting} className="btn-buy w-full py-3.5 text-base">
        <Lock className="h-4 w-4" />
        {submitting ? 'Processando...' : 'Pagar com cartão'}
      </button>
    </form>
  )
}
