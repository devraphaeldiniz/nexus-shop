# Deploy do Nexus Shop

Arquitetura sugerida (todos com plano gratuito para portfólio):

| Parte | Serviço | Observação |
|---|---|---|
| Front (Next.js) | **Vercel** | Root directory `client` |
| API (Fastify) | **Render** (Docker) | `render.yaml` na raiz já descreve o serviço |
| PostgreSQL | **Neon** | Copie a connection string (com `?sslmode=require`) |
| Redis | **Upstash** | Use a URL `rediss://...` |
| E-mail | Resend, Brevo ou Mailtrap | Qualquer SMTP |

O front faz **proxy** da API (`/api/v1/*` → API) para que os cookies de sessão sejam do mesmo domínio do front.
Por isso não é preciso `COOKIE_SAME_SITE=none`.

## 1. Banco e Redis
1. Crie um projeto no Neon e copie a `DATABASE_URL`.
2. Crie um banco Redis no Upstash e copie a `REDIS_URL` (`rediss://default:...@...upstash.io:6379`).

## 2. API no Render
1. New → Blueprint → aponte para o repositório. O Render lê `render.yaml`.
2. Preencha as variáveis marcadas como "sync: false":
   - `DATABASE_URL`, `REDIS_URL`
   - `FRONTEND_URL` = URL do front na Vercel (ex.: `https://nexus-shop.vercel.app`)
   - `API_PUBLIC_URL` = URL do próprio serviço no Render (ex.: `https://nexus-shop-api.onrender.com`)
   - `SMTP_*`, `MERCADOPAGO_WEBHOOK_SECRET`, `STRIPE_WEBHOOK_SECRET`
3. O container roda `prisma migrate deploy` antes de subir, então o banco é criado no primeiro deploy.
4. Teste `https://<api>/health` → `"status": "healthy"`.

`JWT_*`, `SETTINGS_ENCRYPTION_KEY` e `SETUP_TOKEN` são gerados pelo Render. Guarde o `SETUP_TOKEN`: ele é pedido na tela `/setup`.

## 3. Front na Vercel
1. Importe o repositório e defina **Root Directory = `client`**.
2. Variáveis de ambiente:
   - `API_PROXY_TARGET` = `https://nexus-shop-api.onrender.com`
   - `NEXT_PUBLIC_API_URL` = `/api/v1`
3. Deploy.

## 4. Primeiro acesso
1. Abra `https://<front>/setup`, crie o administrador (com o `SETUP_TOKEN`).
2. No painel admin → Configurações: dados da loja, e-mail de contato, chaves do Mercado Pago e/ou Stripe, e ative os gateways.
3. Cadastre os produtos (ou rode o seed de demonstração uma vez apontando `DATABASE_URL` para o Neon: `npm run prisma:seed`).
4. **Vitrine de portfólio** (opcional): defina `DEMO_ACCOUNTS=true` na API e rode `DEMO_ACCOUNTS=true npm run prisma:seed:prod` apontando para o banco de produção. A tela de login passa a mostrar o cliente e o admin de demonstração (senha `Demo1234`); o admin demo só consegue ver, e os dados pessoais de clientes reais aparecem ocultos para ele.

## 5. Webhooks
- **Mercado Pago**: Suas integrações → Webhooks → URL `https://<api>/api/v1/payments/mercadopago/webhook`, evento **Pagamentos**. Copie a assinatura secreta para `MERCADOPAGO_WEBHOOK_SECRET`. Com `API_PUBLIC_URL` definida, cada PIX também envia a `notification_url`.
- **Stripe**: Developers → Webhooks → endpoint `https://<api>/api/v1/payments/stripe/webhook`, eventos `payment_intent.succeeded` e `payment_intent.payment_failed`. Copie o `whsec_...` para `STRIPE_WEBHOOK_SECRET`.

## Limites do plano gratuito
- O Render free "dorme" após 15 min sem uso: a primeira requisição leva ~30–50 s.
- O disco do Render free é apagado a cada deploy: **imagens enviadas pelo painel se perdem**. Para produção real, use URLs de imagens externas (Unsplash, CDN) ou adicione um storage (Cloudinary/S3) — ainda não implementado.
- A varredura que cancela pedidos sem pagamento roda dentro da API; com o serviço dormindo, ela roda quando ele acordar.

## Checklist pós-deploy
- [ ] `/health` saudável (database e cache `ok`)
- [ ] Cadastro, login e logout no front
- [ ] Pedido com PIX de teste do Mercado Pago chega a "Pago" sozinho
- [ ] Pedido com cartão de teste do Stripe (`4242 4242 4242 4242`) chega a "Pago"
- [ ] E-mail de "pedido recebido" chega
