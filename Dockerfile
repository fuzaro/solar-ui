# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app

# Match packageManager field declared in package.json
RUN npm install -g npm@11.14.1

COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/ apps/
RUN npm install --legacy-peer-deps

ENV TURBO_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 2: Serve
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/apps/console/dist /srv/console
COPY --from=builder /app/apps/control/dist /srv/control
COPY --from=builder /app/apps/engineering/dist /srv/engineering

# Merge all _astro assets into shared dir (unique hashes = no conflicts)
RUN mkdir -p /srv/shared_astro && \
    cp -r /srv/console/_astro/* /srv/shared_astro/ 2>/dev/null || true && \
    cp -r /srv/control/_astro/* /srv/shared_astro/ 2>/dev/null || true && \
    cp -r /srv/engineering/_astro/* /srv/shared_astro/ 2>/dev/null || true

COPY entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh
EXPOSE 8080
CMD ["/entrypoint.sh"]
