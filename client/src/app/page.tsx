import { Suspense } from 'react'
import { unstable_cache } from 'next/cache'
import Link from 'next/link'
import { BadgeCheck, QrCode, Truck } from 'lucide-react'
import { ProductCard } from '../components/products/ProductCard'
import { ProductImage } from '../components/products/ProductImage'
import { formatCurrency, formatStorage } from '../lib/utils'
import { Product } from '../types'

// No servidor do Next a URL precisa ser absoluta: com proxy, fala direto com a API
function serverApiUrl() {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
  return publicUrl.startsWith('http')
    ? publicUrl
    : `${process.env.API_PROXY_TARGET?.replace(/\/$/, '')}/api/v1`
}

// Renderiza a cada visita (o build não depende da API), com o catálogo em cache
export const dynamic = 'force-dynamic'

async function fetchJson<T>(path: string): Promise<T> {
  const res = await fetch(`${serverApiUrl()}${path}`, { cache: 'no-store' })
  if (!res.ok) throw new Error(`API respondeu ${res.status} em ${path}`)
  return (await res.json()) as T
}

/**
 * Catálogo da home em cache por 5 minutos e atualizado em segundo plano: a API
 * gratuita "dorme" e leva até 1 minuto para acordar. Falha ou lista vazia lança
 * erro, para nunca ficar guardada. Preço e estoque valem os da API no checkout.
 */
const getHomeCatalog = unstable_cache(
  async () => {
    const [{ products = [] }, { brands = [] }] = await Promise.all([
      fetchJson<{ products?: Product[] }>('/products?limit=8&sort=popular'),
      fetchJson<{ brands?: string[] }>('/products/brands'),
    ])
    if (products.length === 0) throw new Error('Catálogo vazio')
    return { products, brands }
  },
  ['home-catalog'],
  { revalidate: 300 }
)

async function loadHomeCatalog(): Promise<{ products: Product[]; brands: string[] }> {
  try {
    return await getHomeCatalog()
  } catch {
    return { products: [], brands: [] }
  }
}

const PROMISES = [
  {
    icon: BadgeCheck,
    title: 'Nota fiscal e 12 meses de garantia',
    text: 'Aparelhos novos, lacrados, com garantia do fabricante.',
  },
  {
    icon: QrCode,
    title: 'PIX com confirmação na hora',
    text: 'Pagou, o pedido é liberado sozinho. Ou use o cartão.',
  },
  {
    icon: Truck,
    title: 'Entrega rastreada para todo o Brasil',
    text: 'Você acompanha cada etapa em Meus pedidos.',
  },
]

/** Vitrine sem aparelho: enquanto o catálogo carrega ou se a API não responder. */
function HeroFallback({ loading = false }: { loading?: boolean }) {
  return (
    <div className="hero-stage rounded-stage px-6 py-16 md:px-14">
      <h1 className="max-w-2xl text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
        Smartphones novos, com nota fiscal.
      </h1>
      {loading && (
        <p role="status" className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
          Carregando os aparelhos. Na primeira visita, pode levar até 1 minuto.
        </p>
      )}
      <Link href="/products" className="btn-primary mt-8 px-7 py-3 text-base">
        Ver smartphones
      </Link>
    </div>
  )
}

async function HomeCatalog() {
  const { products, brands } = await loadHomeCatalog()
  const featured = products.find((p) => p.isFeatured) ?? products[0]

  return (
    <div className="space-y-20 md:space-y-28">
      {/* Vitrine principal: o aparelho em destaque */}
      <section className="container pt-6 md:pt-10">
        {featured ? (
          <div className="hero-stage grid items-center gap-8 rounded-stage px-6 py-10 md:grid-cols-[1.05fr_1fr] md:gap-4 md:px-14 md:py-16">
            <div className="order-2 md:order-1">
              <p className="text-base font-medium text-white/60">{featured.brand}</p>
              <h1 className="mt-2 text-5xl font-extrabold leading-[0.95] tracking-tight md:text-7xl">
                {featured.model}
              </h1>
              <p className="mt-5 max-w-md text-lg leading-relaxed text-white/70">
                {featured.specifications?.ram} GB de RAM, {formatStorage(featured.specifications?.storage ?? 0)} e tela de{' '}
                {featured.specifications?.screenSize}. Novo, com nota fiscal.
              </p>
              <p className="price mt-6 text-4xl text-white">{formatCurrency(Number(featured.price))}</p>
              <div className="mt-7 flex flex-wrap gap-3">
                <Link href={`/products/${featured.slug}`} className="btn-buy px-7 py-3 text-base">
                  Comprar agora
                </Link>
                <Link href="/products" className="btn border border-white/25 bg-white/10 px-7 py-3 text-base text-white backdrop-blur hover:bg-white/20">
                  Ver todos os smartphones
                </Link>
              </div>
            </div>
            <div className="relative order-1 flex justify-center py-6 md:order-2 md:py-10">
              {/* Contornos de celular atrás da foto */}
              <span aria-hidden="true" className="hero-outline h-[118%]" />
              <span aria-hidden="true" className="hero-outline h-[150%] opacity-70" />
              <span aria-hidden="true" className="hero-outline h-[185%] opacity-40" />
              <span aria-hidden="true" className="absolute left-1/2 top-1/2 h-[26rem] w-[26rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-signal/40 blur-3xl" />

              <div className="relative">
                <ProductImage
                  src={featured.images[0]?.url}
                  alt={featured.name}
                  className="animate-rise relative aspect-[4/5] w-full max-w-[240px] rounded-[2rem] bg-white object-cover shadow-[0_30px_80px_-20px_rgb(255_90_31/0.55)] ring-1 ring-white/15 md:max-w-sm"
                />
                {featured.specifications?.ram && (
                  <span className="animate-float absolute -left-4 top-8 rounded-full bg-white px-4 py-2 text-ink font-display text-sm font-bold shadow-lift md:-left-10">
                    {featured.specifications.ram} GB de RAM
                  </span>
                )}
                {featured.specifications?.storage && (
                  <span className="animate-float absolute -right-3 bottom-10 rounded-full bg-signal px-4 py-2 font-display text-sm font-bold text-white shadow-lift [animation-delay:1.2s] md:-right-8">
                    {formatStorage(featured.specifications.storage)}
                  </span>
                )}
              </div>
            </div>
          </div>
        ) : (
          <HeroFallback />
        )}
      </section>

      {/* Atalho por marca */}
      {brands.length > 1 && (
        <section className="container">
          <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Escolha pela marca</h2>
          <div className="mt-5 flex flex-wrap gap-2.5">
            {brands.map((brand) => (
              <Link
                key={brand}
                href={`/products?brand=${encodeURIComponent(brand)}`}
                className="rounded-full border border-line bg-white px-5 py-2.5 font-display text-base font-semibold hover:border-ink"
              >
                {brand}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Mais vendidos */}
      {products.length > 0 && (
        <section className="container">
          <div className="flex items-end justify-between gap-4">
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Mais vendidos</h2>
            <Link href="/products" className="text-sm font-semibold text-ink underline-offset-4 hover:underline">
              Ver todos
            </Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4 md:gap-x-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}

export default function HomePage() {
  return (
    <div className="space-y-20 md:space-y-28">
      <Suspense
        fallback={
          <section className="container pt-6 md:pt-10">
            <HeroFallback loading />
          </section>
        }
      >
        <HomeCatalog />
      </Suspense>

      {/* Por que comprar aqui */}
      <section className="container">
        <div className="panel grid divide-y divide-line md:grid-cols-3 md:divide-x md:divide-y-0">
          {PROMISES.map(({ icon: Icon, title, text }) => (
            <div key={title} className="flex gap-4 p-6 md:p-8">
              <Icon className="h-6 w-6 flex-shrink-0 text-signal" aria-hidden="true" />
              <div>
                <h3 className="font-sans text-base font-semibold">{title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-graphite">{text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container">
        <div className="dots-light relative flex flex-col items-start justify-between gap-5 overflow-hidden rounded-stage bg-ink px-6 py-10 text-white md:flex-row md:items-center md:px-14">
          <div>
            <h2 className="text-2xl font-bold tracking-tight md:text-3xl">Ficou com alguma dúvida?</h2>
            <p className="mt-2 max-w-lg text-white/70">
              Pergunte sobre um modelo, prazo de entrega ou garantia. A loja responde por e-mail.
            </p>
          </div>
          <Link href="/contact" className="btn bg-white px-7 py-3 text-base text-ink hover:bg-paper">
            Falar com a loja
          </Link>
        </div>
      </section>
    </div>
  )
}
