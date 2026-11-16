# Multi-stage Dockerfile para Nexus Shop Backend
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci

COPY . .

RUN npx prisma generate
RUN npm run build

# Runtime Stage
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production

# Usuário não-root para segurança reforçada
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 fastify

COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma

# Pasta de uploads gravável pelo usuário da aplicação (monte um volume aqui)
RUN mkdir -p /app/uploads && chown -R fastify:nodejs /app/uploads

USER fastify

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3001/health || exit 1

# Aplica as migrações pendentes antes de subir a API
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
