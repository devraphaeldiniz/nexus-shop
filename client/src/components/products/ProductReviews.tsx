'use client'

import { FormEvent, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { BadgeCheck, Star } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { formatDate } from '../../lib/utils'
import { useAuthStore } from '../../store/useAuthStore'

interface ReviewItem {
  id: string
  rating: number
  title?: string | null
  comment?: string | null
  isVerified: boolean
  createdAt: string
  user: { name: string }
}

function Stars({ value }: { value: number }) {
  return (
    <span className="inline-flex gap-0.5" aria-label={`${value} de 5 estrelas`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star key={n} className={`h-4 w-4 ${n <= value ? 'fill-signal text-signal' : 'text-line'}`} />
      ))}
    </span>
  )
}

export function ProductReviews({ productId }: { productId: string }) {
  const { isAuthenticated } = useAuthStore()
  const pathname = usePathname()
  const [reviews, setReviews] = useState<ReviewItem[]>([])
  const [rating, setRating] = useState(5)
  const [title, setTitle] = useState('')
  const [comment, setComment] = useState('')
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const load = useCallback(() => {
    apiFetch<{ reviews: ReviewItem[] }>(`/reviews/product/${productId}`)
      .then((data) => setReviews(data.reviews))
      .catch(() => setReviews([]))
  }, [productId])

  useEffect(load, [load])

  async function submit(event: FormEvent) {
    event.preventDefault()
    setError('')
    setSending(true)
    try {
      await apiFetch('/reviews', {
        method: 'POST',
        body: { productId, rating, title: title || undefined, comment: comment || undefined },
      })
      setSent(true)
      load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível enviar a avaliação.')
    } finally {
      setSending(false)
    }
  }

  return (
    <section className="grid gap-10 lg:grid-cols-[1fr_1.15fr] lg:gap-14">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Avaliações</h2>
        <div className="mt-5">
          {!isAuthenticated ? (
            <p className="text-graphite">
              <Link href={`/login?next=${encodeURIComponent(pathname)}`} className="font-semibold text-ink underline underline-offset-4">
                Entre na sua conta
              </Link>{' '}
              para avaliar este aparelho.
            </p>
          ) : sent ? (
            <p className="notice-ok">Obrigado! Sua avaliação foi publicada.</p>
          ) : (
            <form onSubmit={submit} className="space-y-3">
              <p className="text-sm font-semibold">Sua nota</p>
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} type="button" onClick={() => setRating(n)} aria-label={`${n} estrelas`}>
                    <Star className={`h-7 w-7 ${n <= rating ? 'fill-signal text-signal' : 'text-line'}`} />
                  </button>
                ))}
              </div>
              <input maxLength={100} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Resumo (opcional)" className="field" />
              <textarea maxLength={1000} rows={4} value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Como está sendo usar o aparelho? (opcional)" className="field" />
              {error && <p className="notice-error">{error}</p>}
              <button disabled={sending} className="btn-primary">
                {sending ? 'Publicando...' : 'Publicar avaliação'}
              </button>
            </form>
          )}
        </div>
      </div>

      <div>
        {reviews.length === 0 ? (
          <p className="stage px-6 py-10 text-center text-graphite">Ninguém avaliou este aparelho ainda.</p>
        ) : (
          <ul className="space-y-4">
            {reviews.map((review) => (
              <li key={review.id} className="panel p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                  <Stars value={review.rating} />
                  <span className="text-sm font-semibold">{review.user.name}</span>
                  {review.isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs font-medium text-ok">
                      <BadgeCheck className="h-3.5 w-3.5" /> Compra verificada
                    </span>
                  )}
                  <span className="ml-auto text-xs text-graphite">{formatDate(review.createdAt)}</span>
                </div>
                {review.title && <p className="mt-3 font-semibold">{review.title}</p>}
                {review.comment && <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-graphite">{review.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  )
}
