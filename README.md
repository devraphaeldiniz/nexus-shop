# 🛍️ Nexus Shop — E-commerce de Smartphones

> **Nota:** este repositório é o **e-commerce full stack de smartphones** (Next.js + Fastify + Prisma). Não é a plataforma de gestão de associados **nexus** nem o marketplace **nexus-commerce**.

Loja completa com catálogo, carrinho, checkout com frete e cupom, pagamento por **PIX (Mercado Pago)** e **cartão (Stripe)** confirmados por webhook, área do cliente e painel administrativo.

## ✨ Funcionalidades

**Cliente**
- Catálogo com busca, filtros (marca, preço, RAM, armazenamento) e ordenação
- Página do produto com galeria, ficha técnica, favoritos e avaliações (com selo de compra verificada)
- Carrinho, cálculo de frete por CEP (ViaCEP), cupom de desconto
- Checkout com endereços salvos, PIX com QR Code ou cartão via Stripe Payment Element
- Status do pagamento atualizado sozinho na tela; acompanhamento de pedidos e rastreio
- Minha conta: dados, troca de senha, endereços e favoritos; recuperação de senha por e-mail
- Formulário de contato que envia e-mail para a loja

**Lojista (painel `/admin`)**
- Métricas (receita, pedidos, clientes, estoque baixo)
- Cadastro, edição, pausa e reativação de produtos, com upload de fotos
- Gestão de pedidos com regras de status (só envia o que foi pago; cancelar devolve o estoque)
- Configurações da loja, frete grátis e chaves de pagamento (guardadas criptografadas)
- Configuração inicial em `/setup` (cria o primeiro administrador)

**Demonstração**
- A tela de login traz uma conta de cliente e uma de administrador (senha `Demo1234`) para conhecer a loja sem cadastro
- O admin de demonstração só consegue ver: nada é salvo, e os dados pessoais de clientes reais aparecem ocultos
- Em produção ficam desligadas; para uma vitrine de portfólio use `DEMO_ACCOUNTS=true` (veja o DEPLOY.md)

## 🏗️ Arquitetura

```
Navegador ──▶ Next.js (client/) ──/api/v1 (proxy opcional)──▶ Fastify (server/) ──▶ PostgreSQL (Prisma)
                                                                     │          └──▶ Redis (cache, sessões, rate limit)
                                Mercado Pago / Stripe ──webhooks────┘
```

| Camada | Tecnologias |
|---|---|
| Front | Next.js 14 (App Router), TypeScript, Tailwind, Zustand, Stripe.js |
| API | Fastify 4, TypeScript, Zod, Prisma 5, ioredis, Nodemailer |
| Dados | PostgreSQL 16, Redis 7 |
| Pagamentos | Mercado Pago (PIX), Stripe (cartão) |
| Qualidade | Vitest (unitários + integração com banco real), Playwright (E2E), ESLint, GitHub Actions |
| Infra | Docker / Docker Compose, Render (API), Vercel (front) — ver [DEPLOY.md](./DEPLOY.md) |

### Decisões técnicas
- **Preço, frete e desconto calculados só no servidor**; o front apenas exibe estimativas.
- **Estoque e cupom atômicos**: baixa condicional (`stock >= qtd`) dentro da transação — dois pedidos simultâneos não vendem a mesma unidade.
- **Webhooks seguros e idempotentes**: assinatura do Stripe validada sobre o corpo bruto; HMAC do Mercado Pago obrigatório e comparado em tempo constante; status sempre confirmado na API do gateway; `transactionId` único evita confirmação dupla; valor divergente não libera o pedido.
- **Pedidos sem pagamento expiram** (PIX 35 min, cartão 24 h) e devolvem estoque e cupom; um pagamento que chegue depois reserva o estoque de novo ou fica marcado para reembolso.
- **Sessão em cookies httpOnly** (access 15 min + refresh rotativo com detecção de reuso). Nenhum token no `localStorage`. Em produção o front faz proxy da API para manter os cookies no mesmo domínio.
- **Segredos**: em produção a API não sobe sem as variáveis obrigatórias; chaves de pagamento salvas pelo painel ficam criptografadas (AES-256-GCM) e só voltam mascaradas.

## 🚀 Como rodar localmente

Pré-requisitos: Node.js 20+, Docker.

```bash
# 1. Banco e cache
docker compose up -d postgres redis

# 2. API (http://localhost:3001, Swagger em /documentation)
cd server
cp .env.example .env
npm install
npx prisma migrate dev
npm run prisma:seed        # dados de demonstração; mostra as senhas geradas
npm run dev

# 3. Front (http://localhost:3000)
cd ../client
cp .env.example .env.local
npm install
npm run dev
```

O seed cria `admin@nexusshop.com` e `cliente@nexusshop.com` (senhas exibidas no terminal, ou defina `SEED_ADMIN_PASSWORD` / `SEED_CUSTOMER_PASSWORD`), 5 smartphones, os cupons `NEXUS10` e `PRIMEIRACOMPRA` e ativa os dois gateways.

### Pagamentos em teste
- **PIX**: informe o Access Token de teste do Mercado Pago no painel (ou `MERCADOPAGO_ACCESS_TOKEN`). Para receber o webhook localmente, exponha a API (ex.: ngrok) e defina `API_PUBLIC_URL`.
- **Cartão**: informe as chaves de teste do Stripe no painel e rode `stripe listen --forward-to localhost:3001/api/v1/payments/stripe/webhook` (use o `whsec_...` exibido em `STRIPE_WEBHOOK_SECRET`). Cartão de teste: `4242 4242 4242 4242`.

## 🧪 Testes

```bash
cd server
npm test            # unitários + integração sem banco
npm run test:db     # suíte completa num banco separado (nexus_shop_test), incluindo pedidos, cupons, webhooks e expiração

cd ../client
# E2E: precisa de um banco migrado e com seed (ex.: nexus_shop_e2e); usa a conta demo do cliente
DATABASE_URL=postgresql://.../nexus_shop_e2e npm run test:e2e
```

O CI (GitHub Actions) roda lint, typecheck e testes da API com Postgres/Redis, lint/typecheck/build do front, os testes E2E e o build das imagens Docker.

## 📦 Deploy
Passo a passo em [DEPLOY.md](./DEPLOY.md) (Vercel + Render + Neon + Upstash).

## 📄 Licença
MIT
