import Link from 'next/link'
import { Logo } from './Logo'

const COLUMNS = [
  {
    title: 'Comprar',
    links: [
      { href: '/products', label: 'Todos os smartphones' },
      { href: '/products?brand=Apple', label: 'iPhone' },
      { href: '/products?brand=Samsung', label: 'Samsung Galaxy' },
      { href: '/products?sort=price_asc', label: 'Menores preços' },
    ],
  },
  {
    title: 'Sua compra',
    links: [
      { href: '/account', label: 'Minha conta' },
      { href: '/orders', label: 'Acompanhar pedido' },
      { href: '/shipping-policy', label: 'Frete e prazos' },
      { href: '/returns', label: 'Trocas e devoluções' },
    ],
  },
  {
    title: 'Ajuda',
    links: [
      { href: '/terms', label: 'Garantia' },
      { href: '/contact', label: 'Fale com a loja' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="mt-24 border-t border-white/60 bg-white/60 backdrop-blur-xl">
      <div className="container grid gap-10 py-14 md:grid-cols-[1.4fr_repeat(3,1fr)]">
        <div className="max-w-xs space-y-3">
          <Logo />
          <p className="text-sm leading-relaxed text-graphite">
            Smartphones novos, com nota fiscal e garantia. Pagamento no PIX ou no cartão, envio rastreado para todo o Brasil.
          </p>
        </div>

        {COLUMNS.map((column) => (
          <div key={column.title}>
            <h2 className="mb-3 font-sans text-sm font-semibold text-ink">{column.title}</h2>
            <ul className="space-y-2 text-sm text-graphite">
              {column.links.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-ink">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className="border-t border-line">
        <div className="container flex flex-col gap-2 py-5 text-xs text-graphite sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Nexus Shop. Projeto de portfólio.{' '}
            <Link href="/credits" className="underline-offset-4 hover:text-ink hover:underline">
              Créditos das fotos
            </Link>
          </p>
          <p>Pagamentos processados por Mercado Pago e Stripe.</p>
        </div>
      </div>
    </footer>
  )
}
