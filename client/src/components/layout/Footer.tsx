import React from 'react'
import Link from 'next/link'
import {
  Smartphone,
  ShieldCheck,
  Truck,
  RotateCcw,
  CreditCard,
  Lock,
} from 'lucide-react'

export function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 border-t border-slate-800 pt-16 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Selos de Confiança */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pb-12 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
              <Truck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Envio Expresso</h4>
              <p className="text-xs text-slate-500">Para todo o Brasil com seguro</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">12 Meses de Garantia</h4>
              <p className="text-xs text-slate-500">Aparelhos 100% originais com NF</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
              <CreditCard className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Até 12x Sem Juros</h4>
              <p className="text-xs text-slate-500">Ou 10% OFF no PIX à vista</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-indigo-400">
              <RotateCcw className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold text-sm">Devolução Descomplicada</h4>
              <p className="text-xs text-slate-500">7 dias para troca ou reembolso</p>
            </div>
          </div>
        </div>

        {/* Links do Rodapé */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-12 border-b border-slate-800">
          <div className="col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-xl font-black text-white">NEXUS<span className="text-indigo-400">SHOP</span></span>
            </div>
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed mb-4">
              A Nexus Shop é a loja de referência em smartphones de alta performance e flagships.
              Tecnologia de ponta, garantia nacional e segurança máxima em cada transação.
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-400 font-medium">
              <Lock className="w-3.5 h-3.5" />
              <span>Conexão Criptografada SSL 256-bit (TLS 1.3)</span>
            </div>
          </div>

          <div>
            <h5 className="text-white text-sm font-semibold mb-3">Marcas Premium</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/products?brand=Apple" className="hover:text-white transition-colors">Apple iPhone</Link></li>
              <li><Link href="/products?brand=Samsung" className="hover:text-white transition-colors">Samsung Galaxy</Link></li>
              <li><Link href="/products?brand=Xiaomi" className="hover:text-white transition-colors">Xiaomi Flagships</Link></li>
              <li><Link href="/products?brand=Google" className="hover:text-white transition-colors">Google Pixel</Link></li>
              <li><Link href="/products?brand=Motorola" className="hover:text-white transition-colors">Motorola Edge</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white text-sm font-semibold mb-3">Ajuda & Suporte</h5>
            <ul className="space-y-2 text-xs">
              <li><a href="#" className="hover:text-white transition-colors">Acompanhar Pedido</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Política de Frete</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Trocas e Devoluções</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Termos de Garantia</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Fale Conosco</a></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white text-sm font-semibold mb-3">Pagamento Seguro</h5>
            <div className="space-y-2 text-xs">
              <p className="font-semibold text-slate-300">Stripe & Mercado Pago</p>
              <div className="flex flex-wrap gap-1.5 pt-1">
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">PIX</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">Cartão</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">Boleto</span>
                <span className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-[10px] text-slate-300 font-mono">Stripe</span>
              </div>
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row justify-between items-center text-xs text-slate-500 gap-4">
          <p>© 2025 Nexus Shop Comércio Eletrônico Ltda. Todos os direitos reservados.</p>
          <p>CNPJ: 00.000.000/0001-00 · Desenvolvido com Next.js 14, Fastify & Prisma</p>
        </div>
      </div>
    </footer>
  )
}
