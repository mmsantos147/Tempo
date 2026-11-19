FROM node:22-alpine AS build
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci
COPY frontend/ ./
RUN npm run build

FROM nginx:stable-alpine
RUN apk add --no-cache openssl && rm /etc/nginx/conf.d/default.conf
COPY deploy/nginx/tempo.conf.template /etc/nginx/templates/tempo.conf.template
COPY deploy/nginx/tempo-tls.sh /usr/local/bin/tempo-tls
COPY deploy/nginx/40-tempo-tls.sh /docker-entrypoint.d/40-tempo-tls.sh
RUN chmod 755 /usr/local/bin/tempo-tls /docker-entrypoint.d/40-tempo-tls.sh
COPY --from=build /app/dist /usr/share/nginx/html
