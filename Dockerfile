# Dockerfile for Railway deployment
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./

# Copy Prisma schema (needed for postinstall hook)
COPY prisma ./prisma

# Install dependencies (postinstall will run prisma generate)
RUN npm ci

# Rebuild the source code only when needed
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Verify config files are present and show their content
RUN echo "=== Checking config files ===" && \
    ls -la tsconfig.json jsconfig.json && \
    echo "=== tsconfig.json paths ===" && \
    cat tsconfig.json | grep -A 2 paths && \
    echo "=== jsconfig.json paths ===" && \
    cat jsconfig.json | grep -A 2 paths && \
    echo "=== lib directory ===" && \
    ls -la lib/ | head -5 && \
    echo "=== Checking lib files ===" && \
    ls -la lib/polyline.ts lib/strava.ts lib/validation.ts 2>&1 || echo "Some lib files missing"

# Build Next.js with webpack (more stable for module resolution in Docker)
# Using --webpack flag explicitly to force webpack usage
RUN echo "=== Building with webpack ===" && \
    npm run build:webpack 2>&1 | head -30 || (echo "=== Build failed, showing error ===" && npm run build:webpack 2>&1 | tail -50 && exit 1)

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]

