# CLAUDE.md — Nexus Shop

> Mapa do projeto para ler no início das conversas. Só contém o que foi verificado no código; deduções estão marcadas "(a confirmar)".

## Visão geral
- E-commerce full stack de smartphones: catálogo com filtros, página de produto com favoritos e avaliações, carrinho, checkout com frete/cupom/endereços salvos, pedidos, "Minha conta", contato e painel admin (métricas, produtos, pedidos, configurações e chaves de pagamento).
- Pagamentos: PIX (Mercado Pago, QR Code) e cartão (Stripe Payment Element), confirmados por webhooks assinados; pedidos sem pagamento expiram e devolvem o estoque.
- Monorepo: `client/` (Next.js) e `server/` (Fastify + Prisma). Não é o mesmo projeto que `nexus` nem `nexus-commerce`.
- Status: **local / pronto para deploy** (guia em `DEPLOY.md`, blueprint `render.yaml`); ainda sem deploy publicado.
- Repositório: https://github.com/devraphaeldiniz/nexus-shop

## Stack
- **Front** (`client/package.json`): Next.js ^14.2.5 (instalado 14.2.35, `output: 'standalone'`), React ^18.3.1, TypeScript ^5.5.4, Tailwind ^3.4.7, Zustand ^4.5.4, `@stripe/stripe-js` ^10.3.0, `@stripe/react-stripe-js` ^7.1.0, lucide-react; dev: ESLint 8 + `eslint-config-next`, Playwright ^1.45.3.
- **API** (`server/package.json`): Node 20, Fastify ^4.28.1 (cors, helmet, rate-limit, cookie, multipart, static, swagger), Prisma ^5.18.0 (instalado 5.22), Zod ^3.23.8, jsonwebtoken, bcryptjs, ioredis ^5.4.1, sanitize-html, nodemailer ^6.9.14, stripe ^16.7.0, mercadopago ^2.0.15; dev: Vitest ^2, tsx, ESLint 9 + typescript-eslint.
- **Dados**: PostgreSQL 16 (docker, host 5433) e Redis 7 (cache, refresh tokens, rate limit; fallback em memória).
- **Externos**: Mercado Pago, Stripe, SMTP, ViaCEP. Sem filas (varredura de pedidos roda num `setInterval` na API).
- **Auth**: JWT em cookies httpOnly — access 15 min (`/`), refresh 7 dias rotativo com `jti` (path `/api/v1/auth`); uma chave por sessão no Redis (`refresh:<userId>:<jti>`, `modules/auth/sessions.ts`), então várias sessões por conta convivem. Middleware aceita `Bearer` também. Nada de token no navegador. RBAC `CUSTOMER`/`ADMIN`.

## Como rodar
```bash
docker compose up -d postgres redis
cd server && cp .env.example .env && npm install
npx prisma migrate dev            # aplica server/prisma/migrations
npm run prisma:seed               # demo: admin/cliente (senhas impressas), 22 produtos de 6 marcas, cupons, gateways ativos
npm run dev                       # :3001, /documentation, /health
cd ../client && cp .env.example .env.local && npm install && npm run dev   # :3000
```
- Server: `dev`, `build`, `start`, `lint`, `typecheck`, `test` (sem banco), `test:db` (cria/migra `nexus_shop_test` e roda tudo), `test:coverage`, `prisma:*` (`prisma.seed` configurado).
- Client: `dev`, `build`, `start`, `lint`, `typecheck`, `test:e2e` (Playwright sobe API e front ou reusa os que estão rodando; usa o cliente demo por padrão, então só precisa de um banco com seed).
- Produção sem seed: primeiro admin em `/setup` (com `SETUP_TOKEN`). Docker da API roda `prisma migrate deploy` antes de subir.

### Variáveis — server (`server/src/config/env.ts`)
Em `NODE_ENV=production` não há defaults: a API encerra com a lista do que falta.
| Nome | Para que serve |
|---|---|
| `NODE_ENV`, `PORT` | Ambiente e porta (3001) |
| `FRONTEND_URL` | Origem liberada no CORS e base dos links de e-mail (obrigatória em prod) |
| `CORS_ORIGIN` | Origens extras no CORS, separadas por vírgula |
| `DATABASE_URL`, `REDIS_URL` | Postgres e Redis (obrigatórias em prod) |
| `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET` | Assinatura dos tokens, 32+ chars (obrigatórias em prod) |
| `SETTINGS_ENCRYPTION_KEY` | Criptografia AES-GCM das chaves de pagamento do painel, 32+ chars (obrigatória em prod) |
| `API_PUBLIC_URL` | URL pública da API: `notification_url` do PIX e URL absoluta dos uploads |
| `COOKIE_SAME_SITE`, `COOKIE_DOMAIN` | Política dos cookies (`lax` padrão) |
| `SETUP_TOKEN` | Exigido em `POST /auth/setup` quando definido |
| `STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`, `STRIPE_CURRENCY` | Fallback das chaves Stripe do painel |
| `STRIPE_WEBHOOK_SECRET`, `MERCADOPAGO_WEBHOOK_SECRET` | Assinaturas dos webhooks (sem elas o webhook é recusado) |
| `MERCADOPAGO_ACCESS_TOKEN` | Fallback do token MP do painel |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM` | E-mail (host/user/pass obrigatórios em prod) |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` | Só `seed.production.ts` |
| `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`, `SEED_CUSTOMER_PASSWORD` | Só `seed.ts` |
| `TEST_DATABASE_URL` | Testes com banco (o helper recusa banco sem "test" no nome) |

### Variáveis — client
| Nome | Para que serve |
|---|---|
| `NEXT_PUBLIC_API_URL` | Base da API: `http://localhost:3001/api/v1` em dev; `/api/v1` com proxy |
| `API_PROXY_TARGET` | Se definida, `next.config.mjs` reescreve `/api/v1/*` e `/uploads/*` para a API (cookies first-party) |
| `E2E_CUSTOMER_PASSWORD`, `E2E_CUSTOMER_EMAIL` | Playwright (opcional; padrão é o cliente demo) |
| `DEMO_ACCOUNTS` | Contas de demonstração na tela de login. Ligado fora de produção; em produção só com `true` |
| `RATE_LIMIT_MAX` | Requisições/min por IP (padrão 120 em produção, 1000 fora) |

## Estrutura de pastas
```
nexus-shop/
├── .github/workflows/ci-cd.yml   # server (lint, tsc, migrate, testes), client (lint, tsc, build), e2e, audit (informativo), docker
├── docker-compose.yml            # postgres, redis (+ api/client opcionais, volume de uploads)
├── render.yaml, DEPLOY.md        # deploy da API no Render + guia completo
├── client/
│   ├── e2e/                      # Playwright (checkout PIX, cupom, cadastro/logout)
│   ├── public/                   # favicon.svg, robots.txt
│   └── src/
│       ├── app/                  # home, products, products/[slug], checkout, login, register, setup, forgot/reset-password,
│       │                         #   account, orders, orders/[id], admin, contact, returns, terms, shipping-policy
│       ├── components/           # admin/ (MetricsBar, ProductsTab, ProductForm, OrdersTab, SettingsTab, types)
│       │                         # auth/AuthBootstrap, cart/CartDrawer, checkout/OrderPayment|StripePayment,
│       │                         # layout/Navbar|Footer, products/ProductCard|ProductReviews|WishlistButton
│       ├── lib/                  # api.ts (apiFetch/authFetch/logout), navigation, orderStatus, utils
│       ├── store/                # useAuthStore (só usuário), useCartStore (carrinho local)
│       └── types/
└── server/
    ├── prisma/                   # schema, migrations/, seed.ts, seed.production.ts
    ├── scripts/test-db.mjs       # migra o banco de teste e roda o Vitest
    ├── src/
    │   ├── app.ts / server.ts    # plugins, rotas, erros / bootstrap, varredura de pedidos, shutdown
    │   ├── config/               # env (+ corsOrigins), prisma, redis, mail, stripe, mercadopago
    │   ├── middlewares/          # authenticate, authorize
    │   ├── modules/<dominio>/    # routes (+ service/schemas): auth, account, products, cart, orders, payments,
    │   │                         #   coupons, shipping, reviews, wishlist, admin, settings, upload, contact
    │   └── utils/                # errors, jwt, cookies, money, html, secret-box, mercadopago-signature
    └── tests/                    # unit/, integration/ (+ store-flow.db.test.ts com banco), helpers/db.ts, setup-env.ts
```

## Arquitetura e fluxos principais
- Front → `lib/api.ts` (`apiFetch` JSON + `ApiError`; `authFetch` cru) com `credentials: 'include'`; em 401 chama `POST /auth/refresh` uma vez (promessa compartilhada) e repete; se falhar limpa o store. `AuthBootstrap` chama `/auth/me` ao abrir o app.
- API: rota (Zod `.parse`) → service/Prisma → Postgres. Erros `AppError` → JSON; `ZodError` → 400 com `issues`. Rate limit global 120/min no Redis (`nexus-rl:`), 10/min em login/cadastro/setup/forgot/reset, 5/10 min no contato.
- Regras únicas: frete `shipping.service.ts`; cupom `coupons.service.ts`; estoque `reserveStock`/`releaseStock`/`cancelUnpaidOrder` (`orders.service.ts`); credenciais `PaymentService.getActiveCredentials()` (painel descriptografado → `.env`).

1. **Sessão**: login/register/setup → `setAuthCookies` → `{ user }`. Refresh rotaciona e detecta reuso (em conta normal o reuso derruba todas as sessões; em conta demo recusa só aquele token). Logout funciona com access vencido. Troca de senha (`/account/password`) e reset derrubam o refresh.
2. **Pedido**: checkout (endereço salvo → `addressId`, ou novo) → `POST /orders` com `items` + `shippingOptionId` + gateway/método → `OrderService.create`: gateway ativo no painel, preço do banco, frete, cupom → transação com `reserveStock` + `consumeCoupon` + Order/Items.
3. **PIX**: `OrderPayment` → `create-pix` (reaproveita PIX pendente, `notification_url`) → webhook MP: HMAC obrigatório antes de tudo → consulta pagamento → `approved` → `completePayment`; `cancelled/rejected` → `cancelUnpaidOrder` (se for a cobrança atual).
4. **Cartão**: `create-intent` (reaproveita intent, devolve `publishableKey`) → `StripePayment` → webhook com `rawBody` → `succeeded` → `completePayment`; `payment_failed` → `FAILED` (pode tentar de novo).
5. **Confirmação**: `completePayment` idempotente por `transactionId`; valor divergente → FAILED + nota; duplicado → nota "reembolsar"; pedido já cancelado → reserva estoque de novo ou fica CANCELLED+PAID com nota.
6. **Expiração**: `reconcileStaleOrders` a cada 5 min (PIX > 35 min, cartão > 24 h): consulta o gateway; se aprovado confirma; senão (ou se a consulta falhar) cancela e devolve estoque.
7. **Admin**: status só avança se pago; cancelar/reembolsar devolve estoque uma vez; produtos via `/admin/products` (inclui pausados), pausar/reativar por `PATCH isActive`; imagens substituem a galeria.

## Mapa de arquivos-chave
| Caminho | O que faz | Exports / rotas |
|---|---|---|
| `server/src/app.ts` | Monta a app | `buildApp()`, `GET /health` |
| `server/src/server.ts` | Sobe, agenda varredura, encerra | — |
| `server/src/config/env.ts` | Env validado (sem defaults em prod) | `env`, `corsOrigins` |
| `server/src/config/redis.ts` | Cache com fallback em memória | `redis` |
| `server/src/config/mail.ts` | Nodemailer (no-op em teste) | `sendMail({ to, subject, html, replyTo? })` |
| `server/src/utils/secret-box.ts` | AES-256-GCM das chaves do painel | `encryptSecret`, `decryptSecret`, `maskSecret`, `isMaskedValue` |
| `server/src/utils/cookies.ts` | Cookies de sessão | `setAuthCookies`, `clearAuthCookies` |
| `server/src/utils/mercadopago-signature.ts` | HMAC do MP | `verifyMercadoPagoSignature` |
| `modules/auth/*` | Auth | `GET /setup-status`, `POST /setup`, `/register`, `/login`, `/refresh`, `/logout`, `GET /me`, `POST /forgot-password`, `/reset-password` |
| `modules/account/account.routes.ts` | Minha conta | `PATCH /profile`, `POST /password`, `GET/POST /addresses`, `PATCH /addresses/:id/default`, `DELETE /addresses/:id` (arquiva) |
| `modules/products/*` | Catálogo (cache 30 min por slug, marcas 1 h) | `GET /`, `/brands`, `/:slug`; admin `POST /`, `PATCH /:id`, `DELETE /:id` (pausa) |
| `modules/orders/*` | Pedidos e estoque | `POST /`, `GET /my-orders`, `GET /:id`; admin `GET /admin/all`, `PATCH /:id/status` |
| `modules/payments/*` | Stripe e MP | `POST /stripe/create-intent`, `/stripe/webhook`, `/mercadopago/create-pix`, `/mercadopago/webhook`; `PaymentService` |
| `modules/coupons/*` | Cupons | `POST /validate`; admin `GET /`, `POST /` |
| `modules/shipping/*` | Frete | `POST /calculate`; `getShippingOptions`, `getShippingOption` |
| `modules/reviews`, `wishlist`, `contact` | Avaliações, favoritos, contato | `GET /reviews/product/:id`, `POST /reviews`; `GET /wishlist`, `POST /wishlist/toggle`; `POST /contact` |
| `modules/admin/admin.routes.ts` | Painel | `GET /metrics`, `/users`, `/products` |
| `modules/settings/settings.routes.ts` | Config. da loja | `GET /public`; admin `GET /` (segredos mascarados), `PUT /` |
| `modules/upload/upload.routes.ts` | Upload admin (JPG/PNG/WEBP ≤ 10MB, extensão pelo MIME) | `POST /` |
| `client/src/lib/api.ts` | Cliente HTTP | `API_URL`, `apiFetch`, `authFetch`, `ApiError`, `logout` |
| `client/src/app/checkout/page.tsx` | Checkout | `handlePlaceOrder`, `calculateShipping`, `selectSavedAddress` |
| `client/src/components/checkout/OrderPayment.tsx` | Cobrança + polling 5 s | `OrderPayment` |
| `client/src/components/admin/*` | Painel em componentes | `ProductsTab`, `ProductForm`, `OrdersTab`, `SettingsTab`, `MetricsBar` |
| `client/next.config.mjs` | standalone, imagens, proxy da API | — |

## Banco de dados
Prisma + PostgreSQL, IDs `cuid()`, dinheiro `Decimal(10,2)`, tabelas snake_case. Migrações em `server/prisma/migrations` (`init`, `address_archived_at`).
- **StoreSettings** (linha `default`): dados da loja, `freeShippingThreshold`, flags e chaves Stripe/MP (segredos com prefixo `enc:v1:`; valores antigos em texto puro ainda são lidos).
- **User**: `email`/`googleId` únicos, reset de senha (SHA-256), `refreshToken` não usado (refresh no Redis).
- **Address** (cascade do User; `archivedAt` = removido pelo cliente, mantido no histórico). **Order** → User, Address, Coupon?; `shippingMethod`; **OrderItem** (preço do momento), **PaymentTransaction** (`transactionId` único, `payload` com motivo em falhas).
- **Product** (`slug`/`sku` únicos, `specifications` JSON com `ram`/`storage` filtráveis), **ProductImage**, **CartItem** (rota existe; o front usa carrinho local), **WishlistItem**, **Review** (únicos por usuário+produto), **Coupon** (`discountType` string).
- Enums: `Role`, `OrderStatus`, `PaymentStatus`, `PaymentGateway`, `PaymentMethod` (CREDIT_CARD, PIX).
- Sem RLS/triggers; consistência de estoque e cupom feita com `updateMany` condicional em transação.

## Testes e qualidade
- `server/tests/unit`: errors, jwt, mercadopago-signature, money-coupon. `integration`: health, payments-webhook (sem banco), `store-flow.db.test.ts` (15 cenários com banco real: cookies/refresh, setup, preço/frete/estoque, concorrência de estoque e cupom, gateway desativado, webhooks MP aprovados/duplicados/divergentes/cancelados, pago após cancelamento, varredura, admin, criptografia das chaves). MP é mockado com `vi.mock`.
- `demo-accounts.db.test.ts` (contas demo: somente leitura, máscara de dados, sessões simultâneas) e `http-errors.test.ts` (4xx não vira 500).
- E2E (`client/e2e`): `checkout` (compra PIX, cupom, visitante → login → checkout, cadastro, senha errada), `catalog` (home e marcas, filtro e busca, página do produto, 404, carrinho, páginas institucionais), `demo` (botões da tela de login, admin somente leitura).
- `npm run test:db` → 50 testes passando; E2E 13 passando; lint, tipos e `next build` ok (15/11/2026).
- Lint: ESLint nos dois lados sem erros. CI bloqueia em lint/typecheck/testes/build; `npm audit` é informativo (`continue-on-error`).

## Convenções
- Backend por domínio: `modules/<nome>/<nome>.routes.ts` (+ `.service.ts`/`.schemas.ts`); validação `Schema.parse`; erros por `utils/errors.ts`; imports ESM com `.js`.
- Dinheiro sempre arredondado com `roundMoney`; regras de negócio em services reutilizáveis, nunca duplicadas na rota.
- Front: client components, chamadas só via `lib/api.ts` com caminhos relativos (`/orders`), textos em português.
- Identidade visual "vitrine clara" (diferente do AstaCar, que é grafite/azul): tokens em `client/tailwind.config.ts` (`paper`, `stage`, `ink`, `graphite`, `line`, `signal` laranja #FF5A1F só para preço/compra/carrinho, `ok`/`warn`/`danger`) e classes em `globals.css` (`btn-primary`, `btn-buy`, `btn-ghost`, `field`, `field-label`, `panel`, `stage`, `price`, `notice-*`). Fontes: Bricolage Grotesque (títulos, nomes, preços) e Instrument Sans (texto), via `next/font`. Fotos sempre com `ProductImage` (tem reserva para URL quebrada). Evitar caixa-alta em rótulos e animações por toda parte (só a entrada do destaque na home).
- Repo em LF (`.gitattributes`). Commits: Conventional Commits em português com PR (`docs: ... (#4)`); branches por tipo (`docs/...`). O dono faz os commits e o push (sem atribuição ao Claude).

## Pontos de atenção
- **Não commitado ainda**: todas as etapas 1–10 de 15/11/2026 estão no working tree. `client/tsconfig.tsbuildinfo` continua rastreado: rodar `git rm --cached client/tsconfig.tsbuildinfo`.
- **Deploy não feito**: precisa criar contas/recursos (Neon, Upstash, Render, Vercel) e configurar webhooks — ver `DEPLOY.md`.
- **Uploads em disco local**: somem a cada deploy no Render free. Usar URLs externas ou implementar storage (Cloudinary/S3).
- **Pagamentos reais não testados**: PIX e Stripe validados com mocks e testes; falta um teste ponta a ponta com credenciais de sandbox (assinatura MP real, Payment Element).
- **Dependências**: `npm audit` acusa vulnerabilidades (client: 4, server: 23, maioria em dev/transitivas) — revisar com calma; não usar `audit fix --force` (sobe Next de versão principal).
- **Duas abas renovando a sessão ao mesmo tempo** ainda podem forçar novo login (o segundo refresh chega com o token já usado).
- **Contas de demonstração** (`config/demo.ts`, senha `Demo1234`, pública): `isDemo` no usuário e `demo` no JWT. Admin demo: `authorize('ADMIN')` recusa tudo que não for GET, e `utils/demo-privacy.ts` mascara e-mail/telefone/sobrenome/endereço de clientes reais nas respostas. Cliente demo: não altera nome/senha (endereço, carrinho e pedidos funcionam; carrinho e pedidos são compartilhados entre visitantes). Seed recria as contas e volta a senha.
- **Rate limit atrás do proxy do Next** (a confirmar): se o proxy não repassar `X-Forwarded-For`, todos os visitantes contam como o mesmo IP no limite de requisições.
- Google OAuth não existe. Parcelamento não é oferecido (textos de "12x" foram removidos).
- `trustProxy: true` confia em qualquer `X-Forwarded-For`; ok atrás de proxy (Render/Vercel), não exponha a API direto.
- Fotos dos 22 produtos do seed vêm do Wikimedia Commons (CC BY, CC BY-SA ou CC0; autor e licença comentados em cada produto no `seed.ts`); exigem crédito se o site for público. Regra: só entra modelo com foto do aparelho exato.
- O seed só cria produtos que não existem (upsert com `update: {}`): mudar dados de um produto já existente exige editar o banco ou o painel admin.
- O seed não inventa mais notas: `avgRating`/`totalReviews` começam em 0 e vêm das avaliações reais.

---
Última atualização: 2026-11-15 — commit 9eac53a
