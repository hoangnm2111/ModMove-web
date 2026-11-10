# ModMove web image: static build served by Caddy on port 80. HTTPS and /api routing are done by the
# front Caddy of ModMove-backend/deploy, so this image only serves files.
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Uses .env.production (API on the same origin, /api). .env and .env.local are kept out by .dockerignore.
RUN npm run build

FROM caddy:2.10
LABEL org.opencontainers.image.source="https://github.com/hoangnm2111/ModMove-web"
COPY Caddyfile /etc/caddy/Caddyfile
COPY --from=build /app/dist /srv
