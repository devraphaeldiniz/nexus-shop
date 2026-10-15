import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { CartDrawer } from '../components/cart/CartDrawer'

export const metadata: Metadata = {
  title: 'Nexus Shop — Smartphones',
  description:
    'Compre smartphones com pagamento seguro, garantia e envio rastreado.',
  keywords: 'smartphones, celulares, ecommerce, pagamento seguro',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR" className="dark">
      <body className="min-h-screen flex flex-col bg-slate-950 text-slate-50 antialiased selection:bg-indigo-500 selection:text-white">
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  )
}
