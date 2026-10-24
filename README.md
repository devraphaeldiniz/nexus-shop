# 🛍️ Nexus Shop 📱 E-Commerce de Smartphones de Ponta a Ponta

> **Nota:** Este repositório é o **e-commerce full stack de smartphones** (Next.js + Fastify + Prisma). Não é a plataforma de gestão de associados **nexus** nem o marketplace **nexus-commerce**. â€” E-Commerce de Smartphones de Ponta a Ponta

Plataforma completa de e-commerce especializada em smartphones, com arquitetura moderna, alta performance, seguranÃ§a rigorosa e mÃºltiplos gateways de pagamento (Stripe & Mercado Pago).

---

## ðŸ—ï¸ Arquitetura e Stack TecnolÃ³gica

- **Frontend**: Next.js 14+ (App Router), TypeScript, Tailwind CSS, Zustand, Lucide React
- **Backend**: Node.js + Fastify, TypeScript, Prisma ORM
- **Banco de Dados**: PostgreSQL 16 (dados relacionais) + Redis 7 (cache e sessÃµes)
- **AutenticaÃ§Ã£o**: JWT (Access Token + Refresh Token rotativo) + Google OAuth + RBAC (Customer/Admin)
- **Gateways de Pagamento**: Stripe (CartÃ£o/Internacional) & Mercado Pago (PIX/Boleto/CartÃ£o)
- **SeguranÃ§a**: Fastify Helmet, CORS, Rate Limit distribuÃ­do, sanitizaÃ§Ã£o, validaÃ§Ã£o Zod rigorosa, CSRF, TLS/HSTS
- **Testes**: Vitest (UnitÃ¡rios & IntegraÃ§Ã£o) + Playwright (E2E)
- **Infraestrutura**: Docker & Docker Compose, GitHub Actions CI/CD

---

## ðŸš€ Como Executar

### 1. PrÃ©-requisitos
- Node.js 20+
- Docker & Docker Compose

### 2. Subir Banco de Dados e Cache
```bash
docker-compose up -d postgres redis
```

### 3. Backend (API Fastify)
```bash
cd server
cp .env.example .env
npm install
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
# API rodando em http://localhost:3001
# DocumentaÃ§Ã£o Swagger em http://localhost:3001/documentation
```

### 4. Frontend (Next.js)
```bash
cd client
cp .env.example .env.local
npm install
npm run dev
# AplicaÃ§Ã£o rodando em http://localhost:3000
```

