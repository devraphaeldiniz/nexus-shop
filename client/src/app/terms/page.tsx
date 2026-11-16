import Link from 'next/link'

export default function TermsPage() {
  return (
    <article className="prose-store container max-w-3xl py-12 md:py-20">
      <h1>Garantia</h1>
      <p>Todos os aparelhos são novos e saem com nota fiscal. A garantia segue as condições do fabricante e a garantia legal do Código de Defesa do Consumidor.</p>
      <h2>Como acionar</h2>
      <p>Fale com a loja informando o número do pedido e descrevendo o problema. Se for preciso, pediremos fotos ou vídeo do defeito.</p>
      <h2>O que a garantia não cobre</h2>
      <p>Danos por queda, contato com líquidos ou reparo feito fora da assistência autorizada.</p>
      <Link href="/contact" className="btn-primary mt-8">Falar com a loja</Link>
    </article>
  )
}
