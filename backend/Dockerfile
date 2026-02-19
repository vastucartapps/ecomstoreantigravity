FROM node:20-alpine AS base
WORKDIR /app

# Install dependencies
COPY package.json package-lock.json* ./
COPY .npmrc* ./
RUN npm install --legacy-peer-deps

# Copy source
COPY . .

# Build
RUN npm run build

# Production
FROM node:20-alpine AS production
WORKDIR /app

COPY --from=base /app/.medusa ./.medusa
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/package.json ./
COPY --from=base /app/medusa-config.ts ./
COPY --from=base /app/tsconfig.json ./
COPY --from=base /app/src ./src

EXPOSE 9000

CMD ["npm", "run", "start"]
