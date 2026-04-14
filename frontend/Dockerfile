FROM node:lts-alpine AS build

ARG HTTP_PROXY
ARG HTTPS_PROXY
ARG NO_PROXY
ARG http_proxy
ARG https_proxy
ARG no_proxy

ENV HTTP_PROXY=${HTTP_PROXY} \
	HTTPS_PROXY=${HTTPS_PROXY} \
	NO_PROXY=${NO_PROXY} \
	http_proxy=${http_proxy} \
	https_proxy=${https_proxy} \
	no_proxy=${no_proxy}

COPY BG_SEProxy_CA.crt /tmp/BG_SEProxy_CA.crt
RUN cat /tmp/BG_SEProxy_CA.crt >> /etc/ssl/cert.pem \
	&& mkdir -p /etc/ssl/certs \
	&& cat /tmp/BG_SEProxy_CA.crt >> /etc/ssl/certs/ca-certificates.crt \
	&& mkdir -p /usr/local/share/ca-certificates \
	&& cp /tmp/BG_SEProxy_CA.crt /usr/local/share/ca-certificates/BG_SEProxy_CA.crt \
	&& if command -v update-ca-certificates > /dev/null 2>&1; then update-ca-certificates; fi
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

WORKDIR /app
# Install pnpm via npm (avoids corepack registry fetch issues behind proxy)
RUN npm config set strict-ssl false
RUN npm install -g pnpm
COPY package.json pnpm-lock.yaml ./
RUN NODE_ENV=development pnpm install --frozen-lockfile && pnpm approve-builds esbuild && pnpm install --frozen-lockfile
ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

COPY . .
RUN pnpm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
