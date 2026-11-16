'use client'

import { useState } from 'react'
import { Smartphone } from 'lucide-react'

/** Foto do aparelho com reserva: se a URL falhar, mostra um ícone neutro no lugar do ícone de imagem quebrada. */
export function ProductImage({
  src,
  alt,
  className = '',
  loading,
}: {
  src?: string
  alt: string
  className?: string
  loading?: 'lazy' | 'eager'
}) {
  const [failed, setFailed] = useState(false)

  if (!src || failed) {
    return (
      <div className={`flex items-center justify-center text-graphite/40 ${className}`} role="img" aria-label={alt}>
        <Smartphone className="h-1/4 w-1/4 min-h-6 min-w-6" strokeWidth={1.25} />
      </div>
    )
  }

  return <img src={src} alt={alt} loading={loading} onError={() => setFailed(true)} className={className} />
}
