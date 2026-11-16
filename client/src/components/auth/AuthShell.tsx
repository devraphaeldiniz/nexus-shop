import Link from 'next/link'

/** Moldura das telas de conta: coluna estreita, título grande e rodapé com link alternativo. */
export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  back,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
  footer?: React.ReactNode
  back?: { href: string; label: string }
}) {
  return (
    <div className="container flex justify-center py-12 md:py-20">
      <div className="w-full max-w-md">
        {back && (
          <Link href={back.href} className="text-sm font-medium text-graphite hover:text-ink">
            {back.label}
          </Link>
        )}
        <h1 className="mt-4 text-4xl font-extrabold tracking-tight">{title}</h1>
        {subtitle && <p className="mt-2 text-graphite">{subtitle}</p>}
        <div className="panel mt-8 p-6 md:p-8">{children}</div>
        {footer && <div className="mt-6 text-center text-sm text-graphite">{footer}</div>}
      </div>
    </div>
  )
}
