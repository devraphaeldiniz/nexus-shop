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
            <h5 className="text-white text-sm font-semibold mb-3">Loja</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/products" className="hover:text-white transition-colors">Catálogo de smartphones</Link></li>
              <li><Link href="/login" className="hover:text-white transition-colors">Minha conta</Link></li>
              <li><Link href="/checkout" className="hover:text-white transition-colors">Finalizar compra</Link></li>
            </ul>
          </div>

          <div>
            <h5 className="text-white text-sm font-semibold mb-3">Ajuda & Suporte</h5>
            <ul className="space-y-2 text-xs">
              <li><Link href="/orders" className="hover:text-white transition-colors">Acompanhar pedido</Link></li>
              <li><Link href="/shipping-policy" className="hover:text-white transition-colors">Política de frete</Link></li>
              <li><Link href="/returns" className="hover:text-white transition-colors">Trocas e devoluções</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Termos de garantia</Link></li>
              <li><Link href="/contact" className="hover:text-white transition-colors">Fale conosco</Link></li>
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
          <p>Informações comerciais e legais disponíveis no painel da loja</p>
        </div>
      </div>
    </footer>
  )
}
