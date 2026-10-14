import type { Metadata } from 'next'
import './globals.css'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { CartDrawer } from '../components/cart/CartDrawer'

export const metadata: Metadata = {
  title: 'Nexus Shop — Smartphones Premium & Flagships',
  description:
    'A loja definitiva de smartphones no Brasil. Apple iPhone 15 Pro, Samsung Galaxy S24 Ultra, Xiaomi 14 Ultra com garantia nacional e envio expresso.',
  keywords: 'smartphones, iphone, galaxy, xiaomi, pixel, 5g, celular, ecommerce',
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
