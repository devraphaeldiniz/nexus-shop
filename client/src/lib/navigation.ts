/** Lê ?next= da URL atual, aceitando só caminhos internos (evita open redirect). */
export function getSafeNext(fallback = '/'): string {
  if (typeof window === 'undefined') return fallback
  const next = new URLSearchParams(window.location.search).get('next')
  return next && next.startsWith('/') && !next.startsWith('//') ? next : fallback
}
