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
# MEDUSA_BUILD=true tells medusa-config.ts to skip validateEnv() — env vars
# are not available at Docker build time (only at container runtime).
RUN MEDUSA_BUILD=true npm run build

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
