# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (cached unless package.json/lock changes)
COPY package.json package-lock.json* ./
COPY .npmrc* ./
RUN --mount=type=cache,target=/root/.npm \
    npm install --legacy-peer-deps

# Copy source
COPY . .

# Build Medusa
RUN npm run build

# Strip devDependencies for a leaner production image (~400MB smaller)
RUN npm prune --production --legacy-peer-deps 2>/dev/null || true

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
