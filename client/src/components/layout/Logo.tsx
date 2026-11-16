import Link from 'next/link'

/** Marca: "nexus" em minúsculas com o ponto laranja da loja. */
export function Logo({ className = '' }: { className?: string }) {
  return (
    <Link href="/" className={`font-display text-2xl font-extrabold tracking-tight text-ink ${className}`} aria-label="Nexus Shop, página inicial">
      nexus<span className="text-signal">.</span>
    </Link>
  )
}
