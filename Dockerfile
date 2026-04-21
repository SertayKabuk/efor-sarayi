# syntax=docker/dockerfile:1.7

FROM node:lts-alpine AS frontend-build

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

COPY frontend/BG_SEProxy_CA.crt /tmp/BG_SEProxy_CA.crt
RUN cat /tmp/BG_SEProxy_CA.crt >> /etc/ssl/cert.pem \
    && mkdir -p /etc/ssl/certs \
    && cat /tmp/BG_SEProxy_CA.crt >> /etc/ssl/certs/ca-certificates.crt \
    && mkdir -p /usr/local/share/ca-certificates \
    && cp /tmp/BG_SEProxy_CA.crt /usr/local/share/ca-certificates/BG_SEProxy_CA.crt \
    && if command -v update-ca-certificates > /dev/null 2>&1; then update-ca-certificates; fi
ENV NODE_EXTRA_CA_CERTS=/etc/ssl/certs/ca-certificates.crt

WORKDIR /frontend
RUN npm config set strict-ssl false
RUN npm install -g pnpm
COPY frontend/package.json frontend/pnpm-lock.yaml ./
RUN NODE_ENV=development pnpm install --frozen-lockfile \
    && pnpm approve-builds esbuild \
    && pnpm install --frozen-lockfile

ARG VITE_GOOGLE_CLIENT_ID=""
ENV VITE_GOOGLE_CLIENT_ID=${VITE_GOOGLE_CLIENT_ID}

COPY frontend/ ./
RUN pnpm run build

FROM python:3.13-slim AS backend-build

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
COPY backend/uv.lock backend/pyproject.toml backend/README.md ./
ENV UV_INSECURE_HOST=pypi.org,pypi.python.org,files.pythonhosted.org
RUN uv sync --frozen --no-cache --no-dev --no-install-project \
    --trusted-host pypi.org \
    --trusted-host pypi.python.org \
    --trusted-host files.pythonhosted.org

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"

COPY backend/app ./app
COPY backend/alembic ./alembic
COPY backend/alembic.ini ./alembic.ini

FROM python:3.13-slim AS runtime

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl nginx supervisor tini \
    && rm -rf /var/lib/apt/lists/* \
    && rm -f /etc/nginx/sites-enabled/default

WORKDIR /app

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"
ENV PYTHONUNBUFFERED=1

COPY --from=backend-build /app /app
COPY --from=frontend-build /frontend/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf
COPY docker/supervisord.conf /etc/supervisor/supervisord.conf
COPY docker/entrypoint.sh /usr/local/bin/entrypoint.sh

RUN chmod +x /usr/local/bin/entrypoint.sh

EXPOSE 80

ENTRYPOINT ["/usr/bin/tini", "--", "/usr/local/bin/entrypoint.sh"]
