# syntax=docker/dockerfile:1
# GoodFunds Help Center — Next.js 16 (standalone) single-image for the goodDEV
# new-deploy flow (build-once-promote: same <sha> image on stage and prod).
# No nginx sidecar — the standalone server serves directly behind proxy13.
# Build context is this directory (apps/help-center); see docker-compose.new-deploy.yml.

# 1) Install dependencies (layer cached unless package*.json changes)
FROM node:22-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json ./
# Skip lifecycle scripts: the fumadocs-mdx postinstall needs the content tree,
# which isn't present in this stage. `.source` is generated during `next build`.
RUN npm ci --ignore-scripts

# 2) Build the app (fumadocs-mdx generates .source as part of `next build`)
FROM node:22-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# 3) Minimal runtime image from the standalone output
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Bind to all interfaces on the label port so proxy13's health-gate can reach it.
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs \
 && adduser --system --uid 1001 nextjs

# Standalone server plus the assets Next does not bundle into it. public/ holds
# the logo, favicon and docs screenshots and is read at runtime.
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

# Writable dir for the chat analytics sink (.data/chat-events.jsonl). Ephemeral
# by design — the new-deploy model is stateless (no volumes).
RUN mkdir -p /app/.data && chown nextjs:nodejs /app/.data

USER nextjs
EXPOSE 3000
CMD ["node", "server.js"]
