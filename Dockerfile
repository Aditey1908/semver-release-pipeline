# syntax=docker/dockerfile:1

ARG NODE_VERSION=24

# ---------------------------------------------------------------------------
# Stage 1 — production dependencies only (no test/release tooling)
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
# --ignore-scripts skips the "prepare" (husky) hook, which only matters for local development
RUN npm ci --omit=dev --ignore-scripts && npm cache clean --force

# ---------------------------------------------------------------------------
# Stage 2 — application build: React dashboard bundled by Vite + build metadata
# Runs on the builder's native platform: the output is static files, so
# multi-arch images don't need this stage emulated.
# ---------------------------------------------------------------------------
FROM --platform=$BUILDPLATFORM node:${NODE_VERSION}-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --ignore-scripts
COPY CHANGELOG.md vite.config.js ./
COPY web ./web
COPY src ./src
COPY scripts/build.js ./scripts/build.js
# Supplied by the pipeline; build.js falls back to package.json when empty
ARG APP_VERSION=""
ARG GIT_SHA=""
ARG BUILD_DATE=""
ARG SOURCE_URL=""
RUN node scripts/build.js

# ---------------------------------------------------------------------------
# Stage 3 — minimal runtime image
# ---------------------------------------------------------------------------
FROM node:${NODE_VERSION}-alpine AS runtime
ARG APP_VERSION=""
ARG GIT_SHA=""
ARG BUILD_DATE=""
LABEL org.opencontainers.image.title="semver-release-pipeline" \
      org.opencontainers.image.description="Release dashboard and semantic-version API" \
      org.opencontainers.image.licenses="MIT" \
      org.opencontainers.image.version="${APP_VERSION}" \
      org.opencontainers.image.revision="${GIT_SHA}" \
      org.opencontainers.image.created="${BUILD_DATE}"

ENV NODE_ENV=production \
    PORT=3000 \
    APP_ENV=production
WORKDIR /app

# Files stay owned by root, so the app (running as a non-root user) cannot modify its own code
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
COPY src ./src
COPY --from=build /app/dist ./dist

# 1000 is the unprivileged "node" user that ships with the official image
USER 1000:1000
EXPOSE 3000
HEALTHCHECK --interval=10s --timeout=3s --start-period=5s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:'+(process.env.PORT||3000)+'/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"]

CMD ["node", "src/index.js"]
