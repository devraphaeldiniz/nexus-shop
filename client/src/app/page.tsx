import React from 'react'
import Link from 'next/link'
import {
  ShieldCheck,
  Truck,
  CreditCard,
  ArrowRight,
  CheckCircle,
  Smartphone,
} from 'lucide-react'
import { ProductCard } from '../components/products/ProductCard'
import { Product } from '../types'

async function getProducts(): Promise<Product[]> {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'
    const res = await fetch(`${apiUrl}/products?limit=8`, {
      cache: 'no-store',
    })
    if (!res.ok) return []
    const data = await res.json()
    return data.products || []
  } catch {
    return []
  }
}

export default async function HomePage() {
  const products = await getProducts()

  const brands = Array.from(
    new Map(
      products.map((product) => [
        product.brand,
        { name: product.brand, desc: `Ver produtos ${product.brand}` },
      ])
    ).values()
  )

  return (
    <div className="space-y-16 pb-16 animate-fade-up">
      {/* ==================== HERO SECTION COMERCIAL ==================== */}
      <section className="border-b border-slate-800 bg-slate-900/40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Apresentação */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium">
                <span>Catálogo Oficial de Smartphones</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Smartphones Originais com Nota Fiscal e Garantia Nacional.
              </h1>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed max-w-xl">
                Encontre os lançamentos mais recentes das principais fabricantes mundiais.
                Parcelamento em até 12x no cartão de crédito, descontos exclusivos no PIX e envio segurado.
              </p>

              <div className="flex flex-wrap gap-4 pt-2">
                <Link
                  href="/products"
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg text-xs flex items-center gap-2 transition-colors shadow-sm"
                >
                  <span>Ver Todos os Modelos</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
                <Link
                  href="/products"
                  className="px-6 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors"
                >
                  Explorar catálogo
                </Link>
              </div>

              {/* Destaques Institucionais */}
              <div className="grid grid-cols-3 gap-6 pt-6 border-t border-slate-800 text-xs">
                <div>
                  <p className="font-bold text-white text-base">12 Meses</p>
                  <p className="text-slate-400 mt-0.5">Garantia oficial</p>
                </div>
                <div>
                  <p className="font-bold text-white text-base">Até 12x</p>
                  <p className="text-slate-400 mt-0.5">Sem juros no cartão</p>
                </div>
                <div>
                  <p className="font-bold text-white text-base">PIX</p>
                  <p className="text-slate-400 mt-0.5">Desconto à vista</p>
                </div>
              </div>
            </div>

            {/* Imagem do Aparelho Destaque */}
            <div className="lg:col-span-5 flex justify-center">
              {products[0] ? (
                <div className="w-full max-w-sm rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl space-y-4">
                  <div className="aspect-square bg-slate-950 rounded-xl overflow-hidden flex items-center justify-center border border-slate-800/80">
                    {products[0].images?.[0]?.url ? (
                      <img
                        src={products[0].images[0].url}
                        alt={products[0].name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <Smartphone className="w-16 h-16 text-slate-700" />
                    )}
                  </div>
                  <div className="flex justify-between items-center text-xs gap-3">
                    <div className="min-w-0">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Em destaque</span>
                      <p className="font-bold text-white text-sm truncate">{products[0].name}</p>
                    </div>
                    <Link
                      href={`/products/${products[0].slug}`}
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium whitespace-nowrap"
                    >
                      Ver detalhes
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="w-full max-w-sm aspect-square rounded-2xl bg-slate-900 border border-slate-800 flex flex-col items-center justify-center text-center p-8">
                  <Smartphone className="w-12 h-12 text-slate-700 mb-4" />
                  <p className="text-sm font-semibold text-slate-300">Sua vitrine começa aqui</p>
                  <p className="text-xs text-slate-500 mt-1">Cadastre o primeiro produto no painel administrativo.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ==================== SELEÇÃO DE MARCAS ==================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-baseline mb-6 border-b border-slate-800 pb-3">
          <h2 className="text-lg font-bold text-white">Fabricantes Oficiais</h2>
          <span className="text-xs text-slate-400">Distribuição autorizada</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {brands.map((b) => (
            <Link
              key={b.name}
              href={`/products?brand=${b.name}`}
              className="p-4 bg-slate-900 border border-slate-800 rounded-xl hover:border-slate-700 transition-colors"
            >
              <p className="text-sm font-bold text-white">{b.name}</p>
              <p className="text-[11px] text-slate-400 mt-1">{b.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ==================== VITRINE DE PRODUTOS ==================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-baseline mb-6 border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-lg font-bold text-white">Smartphones em Estoque</h2>
            <p className="text-xs text-slate-400 mt-0.5">Modelos disponíveis para pronta-entrega imediata</p>
          </div>

          <Link
            href="/products"
            className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
          >
            <span>Ver catálogo completo</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-slate-900 border border-slate-800 rounded-xl">
            <Smartphone className="w-8 h-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-white">Nenhum produto cadastrado na vitrine.</p>
            <p className="text-xs text-slate-400 mt-1">
              O lojista pode cadastrar smartphones diretamente pelo Painel de Gestão.
            </p>
            <Link
              href="/admin"
              className="inline-block mt-4 px-4 py-2 bg-indigo-600 text-white rounded text-xs font-semibold"
            >
              Acessar Painel de Gestão
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>

      {/* ==================== BANNER INSTITUCIONAL E FORMAS DE PAGAMENTO ==================== */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs text-slate-300">
            <div className="flex items-start gap-3">
              <Truck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Envio Rastreado com Seguro</p>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Todas as encomendas acompanham seguro de transporte contra extravio e código de rastreamento oficial.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <CreditCard className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Gateways Homologados</p>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Processamento seguro via Mercado Pago e Stripe. Suporte nativo a PIX instantâneo e cartões de crédito.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <ShieldCheck className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-white text-sm">Garantia Legal & Fabricante</p>
                <p className="text-slate-400 mt-1 leading-relaxed">
                  Aparelhos homologados pela Anatel com 1 ano de garantia direta da fabricante e assistência autorizada.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
