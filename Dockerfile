# Stage 1: Build
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json turbo.json tsconfig.base.json ./
COPY packages/ packages/
COPY apps/ apps/
RUN npm install --legacy-peer-deps
RUN npm run build

# Stage 2: Serve
FROM nginx:1.27-alpine AS runtime
COPY nginx.conf /etc/nginx/nginx.conf
COPY --from=builder /app/apps/console/dist /srv/console
COPY --from=builder /app/apps/control/dist /srv/control
COPY --from=builder /app/apps/engineering/dist /srv/engineering
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
