# ── Stage 1: Build ────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install dependencies first (layer cache)
COPY package*.json bun.lock* ./
RUN npm ci --frozen-lockfile

# Copy source and build
COPY . .

ARG VITE_API_URL=/
ARG VITE_APP_ENV=staging
ENV VITE_API_URL=$VITE_API_URL
ENV VITE_APP_ENV=$VITE_APP_ENV

RUN npm run build

# ── Stage 2: Serve with Nginx ─────────────────────────────────────────────────
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
