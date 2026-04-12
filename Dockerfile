FROM node:22-alpine AS base
RUN corepack enable

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
ENV OPENROUTER_API_KEY=build_dummy
ENV AUTH_SECRET=build_dummy_secret_for_build_only_min_32_chars!!
ENV NEXT_PUBLIC_APP_URL=http://localhost:3000

RUN pnpm run build

FROM base AS runner
WORKDIR /app

RUN apk add --no-cache tzdata

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV TZ=Asia/Seoul

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 appuser

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/server.ts ./server.ts
COPY --from=builder /app/server-entry.cjs ./server-entry.cjs
COPY --from=builder /app/server.compiled.cjs ./server.compiled.cjs
COPY --from=builder /app/src/db ./src/db
COPY --from=builder /app/drizzle.config.ts ./drizzle.config.ts
COPY --from=builder /app/drizzle ./drizzle
COPY --from=builder /app/tsconfig.json ./tsconfig.json
COPY docker-entrypoint.sh ./docker-entrypoint.sh

RUN mkdir -p .next/cache/images data && \
    chown -R appuser:nodejs .next/cache data

USER appuser

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

ENTRYPOINT ["sh", "docker-entrypoint.sh"]
