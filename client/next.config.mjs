/**
 * Proxy da API: com API_PROXY_TARGET definido (ex.: https://nexus-shop-api.onrender.com),
 * o front chama /api/v1/* no próprio domínio e o Next repassa para a API.
 * Assim os cookies de sessão são do mesmo site do front (funcionam até em navegadores
 * que bloqueiam cookies de terceiros). Nesse caso use NEXT_PUBLIC_API_URL=/api/v1.
 */
const apiProxyTarget = process.env.API_PROXY_TARGET?.replace(/\/$/, '')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Gera .next/standalone para a imagem Docker (client/Dockerfile)
  output: 'standalone',
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'upload.wikimedia.org' },
      { protocol: 'https', hostname: '**.stripe.com' },
      { protocol: 'https', hostname: '**.mercadopago.com' },
    ],
  },
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1',
  },
  async rewrites() {
    if (!apiProxyTarget) return []
    return [
      { source: '/api/v1/:path*', destination: `${apiProxyTarget}/api/v1/:path*` },
      { source: '/uploads/:path*', destination: `${apiProxyTarget}/uploads/:path*` },
    ]
  },
}

export default nextConfig
