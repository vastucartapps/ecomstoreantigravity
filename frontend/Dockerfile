# syntax=docker/dockerfile:1
FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies (cached unless package.json/lock changes)
COPY package.json package-lock.json* ./
# npm ci = deterministic install from package-lock.json (errors if out of sync).
# Eliminates the "works cached, fails on clean rebuild" outage class.
RUN --mount=type=cache,target=/root/.npm \
    npm ci

# Copy source
COPY . .

# Build-time env vars (NEXT_PUBLIC_ must be present at build time)
# NEXT_PUBLIC_MEDUSA_BACKEND_URL intentionally NOT set — uses Next.js rewrites (same-origin proxy)
ARG NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=
ARG NEXT_PUBLIC_ALGOLIA_APP_ID=
ARG NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=
ARG NEXT_PUBLIC_ALGOLIA_INDEX_NAME=products
ARG NEXT_PUBLIC_POSTHOG_KEY=
ARG NEXT_PUBLIC_POSTHOG_HOST=https://eu.i.posthog.com
ARG NEXT_PUBLIC_GA4_MEASUREMENT_ID=

ENV NEXT_TELEMETRY_DISABLED=1
ENV NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY=$NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY
ENV NEXT_PUBLIC_ALGOLIA_APP_ID=$NEXT_PUBLIC_ALGOLIA_APP_ID
ENV NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=$NEXT_PUBLIC_ALGOLIA_SEARCH_KEY
ENV NEXT_PUBLIC_ALGOLIA_INDEX_NAME=$NEXT_PUBLIC_ALGOLIA_INDEX_NAME
ENV NEXT_PUBLIC_POSTHOG_KEY=$NEXT_PUBLIC_POSTHOG_KEY
ENV NEXT_PUBLIC_POSTHOG_HOST=$NEXT_PUBLIC_POSTHOG_HOST
ENV NEXT_PUBLIC_GA4_MEASUREMENT_ID=$NEXT_PUBLIC_GA4_MEASUREMENT_ID

# Rewrite target for API proxy (build-time for next.config.ts)
ARG MEDUSA_INTERNAL_URL=http://backend:9000
ENV MEDUSA_INTERNAL_URL=$MEDUSA_INTERNAL_URL

# Cache Next.js build output between builds
RUN --mount=type=cache,target=/app/.next/cache \
    npm run build

# Production
FROM node:20-alpine AS production
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=base /app/.next/standalone ./
COPY --from=base /app/.next/static ./.next/static
COPY --from=base /app/public ./public

EXPOSE 3000

CMD ["node", "server.js"]
