import Link from 'next/link'

export default function ShippingPolicyPage() {
  return (
    <article className="prose-store container max-w-3xl py-12 md:py-20">
      <h1>Frete e prazos</h1>
      <p>O valor e o prazo do frete aparecem no checkout assim que você informa o CEP. Há duas opções: econômica e expressa com seguro.</p>
      <h2>Quando o prazo começa</h2>
      <p>O prazo conta a partir da confirmação do pagamento. No PIX a confirmação é automática; no cartão, depende da aprovação do emissor.</p>
      <h2>Rastreamento</h2>
      <p>Assim que o pedido é postado, o código de rastreio aparece em Meus pedidos e chega por e-mail.</p>
      <Link href="/products" className="btn-primary mt-8">Ver smartphones</Link>
    </article>
  )
}
