# Multi-stage Dockerfile for Next.js 15 app targeting ARM64 (Raspberry Pi 5)
# Uses bun for both build and runtime

# ----- Builder -----
FROM --platform=$BUILDPLATFORM oven/bun:1-debian AS builder

ENV NODE_ENV=development \
    NEXT_TELEMETRY_DISABLED=1

WORKDIR /app

# Install deps first (better layer caching)
COPY package.json bun.lock ./
RUN bun install --frozen-lockfile

# Copy the rest of the source
COPY . .

# Accept build args for NEXT_PUBLIC_* variables only
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY

# Make them available to Next.js build
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL \
    NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY

# Build Next.js
RUN NODE_ENV=production bun run build

# ----- Runner -----
FROM --platform=linux/arm64 oven/bun:1-debian AS runner

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

WORKDIR /app

# Create non-root user
RUN groupadd --gid 1001 nodejs && \
    useradd --uid 1001 --gid nodejs --shell /bin/bash --create-home nextjs

# Copy the standalone build and static assets from builder
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

# Expose port
EXPOSE 3000

# Drop privileges
USER nextjs

# Start with Bun runtime (faster startup)
CMD ["bun", "run", "server.js"]