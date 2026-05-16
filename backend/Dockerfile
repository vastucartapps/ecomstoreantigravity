# syntax=docker/dockerfile:1
# cache-bust: 2026-05-16-diagnostic-startup
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (cached unless package.json/lock changes)
COPY package.json package-lock.json* ./
COPY .npmrc* ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

# Copy source
COPY . .

# Supply dummy env vars so validateEnv() passes during `medusa build`.
# esbuild keeps process.env.* as dynamic references (not inlined literals),
# so Coolify's real runtime env vars take full effect when the container starts.
ARG DATABASE_URL=postgresql://postgres:postgres@localhost:5432/medusa
ARG REDIS_URL=redis://localhost:6379
ARG JWT_SECRET=build-time-dummy-jwt-secret-not-used-at-runtime-placeholder
ARG COOKIE_SECRET=build-time-dummy-cookie-secret-not-used-at-runtime-ok
ARG STORE_CORS=http://localhost:3000
ARG ADMIN_CORS=http://localhost:3000
ARG AUTH_CORS=http://localhost:3000
ENV DATABASE_URL=$DATABASE_URL \
    REDIS_URL=$REDIS_URL \
    JWT_SECRET=$JWT_SECRET \
    COOKIE_SECRET=$COOKIE_SECRET \
    STORE_CORS=$STORE_CORS \
    ADMIN_CORS=$ADMIN_CORS \
    AUTH_CORS=$AUTH_CORS

# Build Medusa
RUN npm run build

# Note: Cannot use npm prune --production here because Medusa v2 loads
# medusa-config.ts at runtime, requiring TypeScript in node_modules

# Production
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production

COPY --from=base /app/.medusa ./.medusa
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/medusa-config.ts ./
COPY --from=base /app/tsconfig.json ./
COPY --from=base /app/src ./src
COPY --from=base /app/start.sh ./start.sh
RUN chmod +x ./start.sh

EXPOSE 9000

CMD ["./start.sh"]
