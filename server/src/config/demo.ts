/**
 * Contas de demonstração exibidas na tela de login.
 * A senha é pública de propósito: por isso o admin demo é somente leitura
 * e as duas contas não podem trocar nome, e-mail ou senha.
 */
export const DEMO_PASSWORD = 'Demo1234'

export const DEMO_ACCOUNTS = [
  { role: 'CUSTOMER' as const, label: 'Cliente', email: 'cliente.demo@nexusshop.com', name: 'Cliente Demonstração' },
  { role: 'ADMIN' as const, label: 'Administrador', email: 'admin.demo@nexusshop.com', name: 'Admin Demonstração' },
]

export const DEMO_EMAILS = new Set(DEMO_ACCOUNTS.map((a) => a.email))
