# syntax=docker/dockerfile:1.7
#
# ytcpm.online — production image for Coolify / Docker.
# Next.js standalone output, non-root user, built-in healthcheck.
#
# Build:  docker build -t ytcpm .
# Run:    docker run -p 3000:3000 -e DATABASE_URL=... ytcpm
# Docs:   deployment.md

# ─── Stage 1: dependencies ───────────────────────────────────────────────────
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# `npm ci` is deterministic and fails if the lockfile and package.json drift.
RUN npm ci --no-audit --no-fund

# ─── Stage 2: build ──────────────────────────────────────────────────────────
FROM node:22-alpine AS builder
RUN apk add --no-cache libc6-compat
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# The app builds without a database (lazy pool). The placeholder keeps any
# future build-time query from failing; it is NOT baked into the runtime image.
ENV DATABASE_URL="postgresql://build:build@127.0.0.1:5432/build"
RUN npm run build

# ─── Stage 3: runtime ────────────────────────────────────────────────────────
FROM node:22-alpine AS runner
RUN apk add --no-cache libc6-compat curl
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 --ingroup nodejs nextjs

# Standalone server + static assets (no node_modules copy needed).
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Migration runner + generated SQL (idempotent; runs on boot when DATABASE_URL is set).
COPY --from=builder --chown=nextjs:nodejs /app/scripts ./scripts
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle
COPY --from=builder --chown=nextjs:nodejs /app/docker-entrypoint.sh ./docker-entrypoint.sh

# `pg` lives in the standalone node_modules; verify at build time.
RUN node -e "require('pg'); console.log('pg ok')" \
 && chmod +x ./docker-entrypoint.sh

USER nextjs
EXPOSE 3000

# Liveness only: a database outage must not restart-loop the container.
# `/api/health` is the readiness probe for uptime monitoring (see deployment.md).
# Output is discarded so a failing probe never dumps the whole page into Docker logs.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fs -o /dev/null --max-time 4 "http://127.0.0.1:${PORT}/" || exit 1

ENTRYPOINT ["./docker-entrypoint.sh"]
