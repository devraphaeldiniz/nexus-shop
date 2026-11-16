'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { BadgeCheck, ChevronLeft, QrCode, Star, Truck } from 'lucide-react'
import { formatCurrency, formatStorage } from '../../../lib/utils'
import { useCartStore } from '../../../store/useCartStore'
import { Product } from '../../../types'
import { apiFetch } from '../../../lib/api'
import { WishlistButton } from '../../../components/products/WishlistButton'
import { ProductReviews } from '../../../components/products/ProductReviews'
import { ProductImage } from '../../../components/products/ProductImage'

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { addItem, setIsOpen } = useCartStore()

  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedColor, setSelectedColor] = useState('')
  const [activeImage, setActiveImage] = useState(0)

  useEffect(() => {
    if (!slug) return
    setLoading(true)
    apiFetch<{ product: Product }>(`/products/${slug}`)
      .then(({ product: data }) => {
        setProduct(data)
        setSelectedColor(data.specifications?.colors?.[0] ?? '')
      })
      .catch(() => setProduct(null))
      .finally(() => setLoading(false))
  }, [slug])

  if (loading) {
    return <div className="container py-24 text-graphite">Carregando aparelho...</div>
  }

  if (!product) {
    return (
      <div className="container py-24">
        <div className="stage mx-auto max-w-lg px-8 py-14 text-center">
          <h1 className="text-2xl font-bold">Aparelho não encontrado</h1>
          <p className="mt-2 text-graphite">Ele pode ter saído da vitrine ou o link está incorreto.</p>
          <Link href="/products" className="btn-primary mt-6">Ver smartphones</Link>
        </div>
      </div>
    )
  }

  const spec = product.specifications
  const price = Number(product.price)
  const compareAt = product.compareAtPrice ? Number(product.compareAtPrice) : null
  const soldOut = product.stock <= 0
  const storageLabel = spec?.storage ? formatStorage(spec.storage) : undefined

  const addToCart = () =>
    addItem({
      productId: product.id,
      name: product.name,
      slug: product.slug,
      brand: product.brand,
      price,
      quantity: 1,
      image: product.images[0]?.url || '',
      stock: product.stock,
      color: selectedColor || undefined,
      storage: storageLabel,
    })

  const buyNow = () => {
    addToCart()
    setIsOpen(false)
    router.push('/checkout')
  }

  const specRows: Array<[string, string | undefined]> = [
    ['Tela', [spec?.screenSize, spec?.resolution].filter((v) => v && v !== '-').join(', ')],
    ['Processador', spec?.processor],
    ['Memória RAM', spec?.ram ? `${spec.ram} GB` : undefined],
    ['Armazenamento', storageLabel],
    ['Câmera principal', spec?.mainCamera],
    ['Câmera frontal', spec?.frontCamera],
    ['Bateria', spec?.battery ? `${spec.battery} mAh` : undefined],
    ['Carregamento', spec?.charging],
    ['Sistema', spec?.os],
  ]

  return (
    <div className="container pt-6 md:pt-10">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm font-medium text-graphite hover:text-ink">
        <ChevronLeft className="h-4 w-4" /> Smartphones
      </Link>

      <div className="mt-5 grid gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
        {/* Galeria */}
        <div className="space-y-3">
          <div className="stage aspect-square overflow-hidden">
            <ProductImage key={activeImage} src={product.images[activeImage]?.url} alt={product.name} className="h-full w-full object-cover" />
          </div>
          {product.images.length > 1 && (
            <div className="flex gap-3">
              {product.images.map((img, idx) => (
                <button
                  key={img.id}
                  onClick={() => setActiveImage(idx)}
                  aria-label={`Foto ${idx + 1}`}
                  aria-current={activeImage === idx}
                  className={`stage h-20 w-20 overflow-hidden rounded-2xl ring-2 ring-offset-2 ring-offset-paper ${
                    activeImage === idx ? 'ring-ink' : 'ring-transparent'
                  }`}
                >
                  <ProductImage src={img.url} alt="" className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Compra */}
        <div className="lg:sticky lg:top-28 lg:self-start">
          <div className="flex items-center justify-between gap-3">
            <p className="font-medium text-graphite">{product.brand}</p>
            <WishlistButton productId={product.id} />
          </div>
          <h1 className="mt-1 text-4xl font-extrabold leading-[1.02] tracking-tight md:text-5xl">{product.name}</h1>

          <div className="mt-3 text-sm">
            {product.totalReviews > 0 ? (
              <a href="#avaliacoes" className="inline-flex items-center gap-1.5 hover:underline">
                <Star className="h-4 w-4 fill-signal text-signal" />
                <span className="font-semibold">{product.avgRating.toFixed(1)}</span>
                <span className="text-graphite">({product.totalReviews} {product.totalReviews === 1 ? 'avaliação' : 'avaliações'})</span>
              </a>
            ) : (
              <span className="text-graphite">Ainda sem avaliações</span>
            )}
          </div>

          <div className="mt-6">
            {compareAt && compareAt > price && (
              <p className="text-graphite line-through">{formatCurrency(compareAt)}</p>
            )}
            <p className="price text-5xl">{formatCurrency(price)}</p>
            <p className="mt-1 text-sm text-graphite">No PIX ou no cartão de crédito</p>
          </div>

          {spec?.colors && spec.colors.length > 0 && (
            <div className="mt-7">
              <p className="text-sm font-semibold">
                Cor: <span className="font-normal text-graphite">{selectedColor}</span>
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {spec.colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => setSelectedColor(color)}
                    aria-pressed={selectedColor === color}
                    className={`rounded-full border px-4 py-2 text-sm ${
                      selectedColor === color ? 'border-ink bg-white font-semibold' : 'border-line bg-white text-graphite hover:border-graphite'
                    }`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <button onClick={buyNow} disabled={soldOut} className="btn-buy py-3.5 text-base">
              {soldOut ? 'Esgotado' : 'Comprar agora'}
            </button>
            <button onClick={addToCart} disabled={soldOut} className="btn-ghost py-3.5 text-base">
              Adicionar ao carrinho
            </button>
          </div>
          {!soldOut && product.stock <= 5 && (
            <p className="mt-3 text-sm font-medium text-warn">Últimas {product.stock} unidades</p>
          )}

          <ul className="mt-8 space-y-3 border-t border-line pt-6 text-sm">
            <li className="flex gap-3"><BadgeCheck className="h-5 w-5 flex-shrink-0 text-ok" /> Novo, lacrado, com nota fiscal e 12 meses de garantia</li>
            <li className="flex gap-3"><QrCode className="h-5 w-5 flex-shrink-0 text-ok" /> PIX com confirmação automática do pedido</li>
            <li className="flex gap-3"><Truck className="h-5 w-5 flex-shrink-0 text-ok" /> Frete calculado pelo CEP no checkout</li>
          </ul>
        </div>
      </div>

      {/* Detalhes */}
      <div className="mt-20 grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
        <section>
          <h2 className="text-2xl font-bold tracking-tight">Sobre o aparelho</h2>
          <p className="mt-4 max-w-prose whitespace-pre-line leading-relaxed text-graphite">{product.description}</p>
        </section>
        <section>
          <h2 className="text-2xl font-bold tracking-tight">Ficha técnica</h2>
          <dl className="panel mt-4 divide-y divide-line">
            {specRows
              .filter(([, value]) => value && value !== '-')
              .map(([label, value]) => (
                <div key={label} className="grid grid-cols-[150px_1fr] gap-4 px-5 py-3.5 text-sm">
                  <dt className="text-graphite">{label}</dt>
                  <dd className="font-medium">{value}</dd>
                </div>
              ))}
          </dl>
        </section>
      </div>

      <div id="avaliacoes" className="mt-20 scroll-mt-24">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  )
}
