# ---- build stage ----
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY tsconfig.json drizzle.config.ts ./
COPY src ./src
COPY drizzle ./drizzle
RUN npm run build

# ---- runtime stage ----
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY package.json package-lock.json ./
RUN npm ci --omit=dev && npm cache clean --force
COPY --from=build /app/dist ./dist
# committed SQL migrations, applied with: node dist/scripts/migrate.js
COPY --from=build /app/drizzle ./drizzle

RUN addgroup -S arena && adduser -S arena -G arena \
  && mkdir -p logs && chown -R arena:arena /app
USER arena

EXPOSE 3001
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -qO- http://127.0.0.1:${PORT:-3001}/ready || exit 1

CMD ["node", "dist/server.js"]
