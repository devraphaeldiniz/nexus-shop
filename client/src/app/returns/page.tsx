import Link from 'next/link'

export default function ReturnsPage() {
  return (
    <article className="prose-store container max-w-3xl py-12 md:py-20">
      <h1>Trocas e devoluções</h1>
      <p>Você pode desistir da compra em até 7 dias corridos depois de receber o aparelho, como garante o Código de Defesa do Consumidor.</p>
      <h2>Como pedir</h2>
      <p>Fale com a loja informando o número do pedido e o motivo. Enviamos as instruções de postagem e o prazo do reembolso.</p>
      <h2>Condições</h2>
      <p>Devolva o aparelho com acessórios, nota fiscal e embalagem, sempre que possível. Defeitos de fabricação seguem a garantia legal e a do fabricante.</p>
      <Link href="/contact" className="btn-primary mt-8">Falar com a loja</Link>
    </article>
  )
}
