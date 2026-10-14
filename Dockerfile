# syntax=docker/dockerfile:1

FROM oven/bun:1.2.21 AS bun

FROM node:22-bookworm-slim AS dependencies
WORKDIR /app
COPY --from=bun /usr/local/bin/bun /usr/local/bin/bun
ENV HUSKY=0 \
    NEXT_TELEMETRY_DISABLED=1
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

FROM dependencies AS builder
COPY . .
# Keep the asset copy valid even when the repository has no public directory.
RUN mkdir -p public && bun run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    HOSTNAME=0.0.0.0 \
    PORT=3000

COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
COPY --from=builder --chown=node:node /app/public ./public
# The API falls back to these files when the remote data source is unavailable.
COPY --from=builder --chown=node:node /app/data ./data

USER node
EXPOSE 3000
CMD ["node", "server.js"]
