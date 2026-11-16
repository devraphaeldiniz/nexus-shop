import type { Metadata } from 'next'
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import './globals.css'
import { Navbar } from '../components/layout/Navbar'
import { Footer } from '../components/layout/Footer'
import { CartDrawer } from '../components/cart/CartDrawer'
import { AuthBootstrap } from '../components/auth/AuthBootstrap'

const display = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-display', display: 'swap' })
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-body', display: 'swap' })

export const metadata: Metadata = {
  title: 'Nexus Shop — Smartphones novos com nota fiscal',
  description: 'Smartphones novos com nota fiscal, garantia e envio rastreado. Pague no PIX ou no cartão.',
  keywords: 'smartphones, celulares, iphone, samsung, xiaomi, motorola, pix',
  icons: { icon: '/favicon.svg' },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <body className="flex min-h-screen flex-col">
        <AuthBootstrap />
        <Navbar />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
      </body>
    </html>
  )
}
