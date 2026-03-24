# ── Build stage ──
FROM node:20-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# ── Production stage ──
FROM node:20-alpine
WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# Don't run as root
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

EXPOSE 3001
CMD ["node", "dist/main"]
