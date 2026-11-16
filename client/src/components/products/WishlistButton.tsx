'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart } from 'lucide-react'
import { apiFetch } from '../../lib/api'
import { useAuthStore } from '../../store/useAuthStore'

/** Botão de favoritar. Sem login, leva para a tela de entrar. */
export function WishlistButton({ productId }: { productId: string }) {
  const router = useRouter()
  const { isAuthenticated } = useAuthStore()
  const [favorited, setFavorited] = useState(false)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) return
    apiFetch<{ items: Array<{ productId: string }> }>('/wishlist')
      .then((data) => setFavorited(data.items.some((item) => item.productId === productId)))
      .catch(() => undefined)
  }, [isAuthenticated, productId])

  async function toggle() {
    if (!isAuthenticated) {
      router.push(`/login?next=${encodeURIComponent(window.location.pathname)}`)
      return
    }
    setBusy(true)
    try {
      const data = await apiFetch<{ favorited: boolean }>('/wishlist/toggle', {
        method: 'POST',
        body: { productId },
      })
      setFavorited(data.favorited)
    } catch {
      // Mantém o estado anterior
    } finally {
      setBusy(false)
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={busy}
      aria-pressed={favorited}
      title={favorited ? 'Remover dos favoritos' : 'Salvar nos favoritos'}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-white px-3.5 py-1.5 text-sm font-medium hover:border-ink disabled:opacity-50"
    >
      <Heart className={`h-4 w-4 ${favorited ? 'fill-signal text-signal' : ''}`} />
      <span>{favorited ? 'Salvo' : 'Salvar'}</span>
    </button>
  )
}
