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

# Copy all source files - ensure lib/ directory is included
COPY . .

# Verify that lib files are actually copied
RUN echo "=== Verifying files are copied ===" && \
    ls -la && \
    echo "=== lib directory contents ===" && \
    ls -la lib/ 2>&1 || echo "lib directory not found!" && \
    echo "=== Checking specific lib files ===" && \
    test -f lib/api.ts && echo "✓ lib/api.ts exists" || echo "✗ lib/api.ts MISSING" && \
    test -f lib/polyline.ts && echo "✓ lib/polyline.ts exists" || echo "✗ lib/polyline.ts MISSING" && \
    test -f lib/db.ts && echo "✓ lib/db.ts exists" || echo "✗ lib/db.ts MISSING"

# Set environment variables for build
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production
ENV DOCKER_BUILD=1

# Verify config files are present and show their content
RUN echo "=== Checking config files ===" && \
    ls -la tsconfig.json jsconfig.json next.config.ts && \
    echo "=== tsconfig.json paths ===" && \
    cat tsconfig.json | grep -A 2 paths && \
    echo "=== jsconfig.json paths ===" && \
    cat jsconfig.json | grep -A 2 paths && \
    echo "=== lib directory ===" && \
    ls -la lib/ && \
    echo "=== Checking lib files ===" && \
    ls -la lib/polyline.ts lib/strava.ts lib/validation.ts lib/api.ts lib/db.ts 2>&1 && \
    echo "=== Current working directory ===" && \
    pwd && \
    echo "=== Verifying lib files exist ===" && \
    test -f lib/polyline.ts && echo "✓ lib/polyline.ts exists" || echo "✗ lib/polyline.ts missing" && \
    test -f lib/api.ts && echo "✓ lib/api.ts exists" || echo "✗ lib/api.ts missing" && \
    test -f lib/db.ts && echo "✓ lib/db.ts exists" || echo "✗ lib/db.ts missing"

# Build Next.js with webpack (more stable for module resolution in Docker)
# Using --webpack flag explicitly to force webpack usage
RUN echo "=== Building with webpack ===" && \
    npm run build:webpack || (echo "=== Build failed, showing error ===" && npm run build:webpack 2>&1 | tail -50 && exit 1)

# Create public directory if it doesn't exist (Next.js may not require it with App Router)
RUN mkdir -p public || true

# Verify build output exists
RUN echo "=== Verifying build output ===" && \
    ls -la .next/ 2>&1 | head -10 && \
    if [ -d ".next/standalone" ]; then \
      echo "✓ Standalone output found"; \
      ls -la .next/standalone/ | head -10; \
    else \
      echo "⚠ Standalone output NOT found - will use regular build structure"; \
      echo "Checking .next directory structure:"; \
      find .next -type d -maxdepth 2 2>&1 | head -20; \
    fi

# Production image, copy all the files and run next
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
# Copy .next directory first
COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next

# Copy public directory (created in builder stage, even if empty)
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Copy standalone if it exists, otherwise we'll use regular structure
# Also copy node_modules and package.json for fallback
COPY --from=builder --chown=nextjs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nextjs:nodejs /app/package.json ./package.json

# Check if standalone exists and use it, otherwise use regular structure
RUN if [ -d "./.next/standalone" ]; then \
      echo "Using standalone output"; \
      cp -r ./.next/standalone/* . && \
      rm -rf ./.next/standalone; \
    else \
      echo "Using regular build structure with node_modules"; \
    fi

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Try standalone server.js first, fallback to next start
CMD ["sh", "-c", "if [ -f './server.js' ]; then node server.js; else npm run start; fi"]

