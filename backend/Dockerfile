FROM python:3.13-slim

RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=ghcr.io/astral-sh/uv:latest /uv /bin/uv
COPY uv.lock pyproject.toml README.md ./
ENV UV_INSECURE_HOST=pypi.org,pypi.python.org,files.pythonhosted.org
RUN uv sync --frozen --no-cache --no-dev --no-install-project --trusted-host pypi.org --trusted-host pypi.python.org --trusted-host files.pythonhosted.org

ENV PATH="/app/.venv/bin:$PATH"
ENV PYTHONPATH="/app"

COPY ./app ./app
COPY ./alembic ./alembic
COPY ./alembic.ini ./alembic.ini

CMD ["sh", "-c", "alembic upgrade head && uvicorn app.main:app --host 0.0.0.0 --port 8080 --proxy-headers"]
