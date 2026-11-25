# syntax=docker/dockerfile:1
# POWER WEB STUDIO AI — Google Cloud Run Production Multi-Stage Dockerfile
# BHANU RAM BARIHA DIGITAL TECHNOLOGIES
# Runtime: Node.js 24 LTS (>=24.12.0 required by @firebase/* SDK dependencies; >=22 required by firebase-admin & @google-cloud/storage)

FROM node:24-slim AS builder
WORKDIR /app

# Install full dependencies (devDependencies required for Vite production build)
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# Copy application source & build Vite client bundle -> dist/
ARG VITE_RECAPTCHA_SITE_KEY=""
ARG VITE_FIREBASE_MEASUREMENT_ID=""
ARG SITE_URL=""
ENV VITE_RECAPTCHA_SITE_KEY=${VITE_RECAPTCHA_SITE_KEY}
ENV VITE_FIREBASE_MEASUREMENT_ID=${VITE_FIREBASE_MEASUREMENT_ID}
ENV SITE_URL=${SITE_URL}

COPY index.html vite.config.ts tsconfig.json firebase-applet-config.json ./
COPY scripts/generate-seo-files.ts ./scripts/generate-seo-files.ts
COPY public ./public
COPY src ./src

RUN npm run build

FROM node:24-slim AS prod-deps
WORKDIR /app

# Install production-only dependencies (server.ts runs natively on Node 24 without tsx/vite in production)
COPY package.json package-lock.json ./
RUN npm ci --omit=dev --ignore-scripts --no-audit --no-fund && npm cache clean --force

FROM node:24-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Copy runtime artifacts owned by unprivileged `node` user
COPY --from=prod-deps --chown=node:node /app/node_modules ./node_modules
COPY --from=builder --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json package-lock.json firebase-applet-config.json server.ts ./
COPY --chown=node:node src/config/siteConfig.ts ./src/config/siteConfig.ts
COPY --chown=node:node src/data/demoSites.ts src/data/blogData.ts ./src/data/
COPY --from=builder --chown=node:node /app/public/robots.txt /app/public/sitemap.xml ./public/

USER node
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 8080) + '/api/health').then(r => process.exit(r.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "server.ts"]
