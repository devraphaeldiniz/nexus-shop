import Link from 'next/link'
import type { Metadata } from 'next'
import { PHOTO_CREDITS } from '../../lib/photoCredits'

export const metadata: Metadata = { title: 'Créditos das fotos — Nexus Shop' }

export default function CreditsPage() {
  return (
    <article className="prose-store container max-w-3xl py-12 md:py-20">
      <h1>Créditos das fotos</h1>
      <p>
        As fotos dos aparelhos foram tiradas por voluntários e publicadas no Wikimedia Commons sob licenças livres. Cada
        uma está listada abaixo com autor, fonte e licença.
      </p>

      <ul className="mt-8 divide-y divide-line">
        {PHOTO_CREDITS.map((item) => (
          <li key={item.slug} className="py-4">
            <Link href={`/products/${item.slug}`} className="font-semibold text-ink hover:underline">
              {item.product}
            </Link>
            <ul className="mt-1 space-y-1 text-sm text-graphite">
              {item.photos.map((photo, index) => (
                <li key={photo.source}>
                  <a href={photo.source} target="_blank" rel="noopener noreferrer" className="underline-offset-4 hover:text-ink hover:underline">
                    Foto {index + 1}
                  </a>{' '}
                  de {photo.author}, licença{' '}
                  <a href={photo.licenseUrl} target="_blank" rel="noopener noreferrer license" className="underline-offset-4 hover:text-ink hover:underline">
                    {photo.license}
                  </a>
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>

      <p className="mt-8 text-sm">
        As marcas e nomes de produtos pertencem aos respectivos fabricantes. Esta é uma loja de demonstração (projeto de
        portfólio): nenhum produto é vendido de verdade.
      </p>
    </article>
  )
}
