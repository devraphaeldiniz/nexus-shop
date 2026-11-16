import type { Config } from 'tailwindcss'

/**
 * Identidade Nexus Shop — "vitrine clara".
 * Fundo cinza-frio, superfícies brancas, grafite para texto e ações principais
 * e um laranja-sinal reservado para preço, compra e contador do carrinho.
 */
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    container: { center: true, padding: { DEFAULT: '1rem', md: '1.5rem' }, screens: { '2xl': '1240px' } },
    extend: {
      colors: {
        paper: '#F4F5F7',
        stage: '#E9EBEF',
        ink: { DEFAULT: '#16181D', soft: '#2A2D34' },
        graphite: '#5E6470',
        line: '#E2E4E8',
        signal: { DEFAULT: '#FF5A1F', dark: '#E0461A', soft: '#FFF0EA' },
        ok: { DEFAULT: '#0B8A5C', soft: '#E8F6EF' },
        warn: { DEFAULT: '#A85A00', soft: '#FFF4E0' },
        danger: { DEFAULT: '#C8312B', soft: '#FDECEB' },
      },
      fontFamily: {
        display: ['var(--font-display)', 'system-ui', 'sans-serif'],
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        stage: '1.75rem',
      },
      boxShadow: {
        lift: '0 12px 32px -16px rgb(22 24 29 / 0.25)',
      },
    },
  },
  plugins: [],
}

export default config
