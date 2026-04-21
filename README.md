# Efor Sarayi - Effort Estimator

AI-powered software project effort estimation tool. Upload project documents or describe your project, and get detailed estimates with implementation plans, risk analysis, and team composition suggestions.

## Features

- **Project Management** - Create, edit, import, and browse past projects with full details
- **AI Estimation** - Get effort estimates powered by Azure OpenAI with structured output
- **Document Import** - Upload project specs (PDF, DOCX, DOC, ODT, RTF, TXT, MD, XLSX, XLS, CSV, PPTX, PPT (max 50 MB per file)) and auto-extract project info
- **Implementation Plans** - Phase-by-phase breakdown with tasks and person-day effort
- **Risk & Assumptions** - Identify risks, assumptions, and ambiguous areas
- **Similar Project Matching** - Vector similarity search finds comparable past projects
- **Google SSO** - Domain-restricted authentication (@d-teknoloji.com.tr)

## Architecture

```
frontend/     React 18 + TypeScript + Vite + Tailwind CSS
backend/      FastAPI + SQLAlchemy (async) + PostgreSQL
              Azure OpenAI (LLM + embeddings)
              ChromaDB (vector store)
```

Deployment packages the frontend and backend into a single app container.
Nginx serves the SPA at `/efor-sarayi/` and proxies `/efor-sarayi-api` to FastAPI.

## Quick Start

### Prerequisites

- Docker & Docker Compose
- Google OAuth Client ID (restricted to your domain)
- Azure OpenAI API key

### Setup

1. Copy and configure environment variables:

```bash
cp .env.example .env
# Edit .env with your values
```

2. Start all services:

```bash
docker compose up --build
```

3. Open http://localhost:3000 (it redirects to `/efor-sarayi/`)

### Seed Data (optional)

Populate the database with sample projects:

```bash
# Set ALLOW_SEED_BYPASS_AUTH=true and SEED_AUTH_TOKEN in .env first
bash seed.sh
```

## Environment Variables

| Variable | Description |
|---|---|
| `POSTGRES_USER` | PostgreSQL username |
| `POSTGRES_PASSWORD` | PostgreSQL password |
| `POSTGRES_DB` | PostgreSQL database name |
| `GOOGLE_CLIENT_ID` | Google OAuth 2.0 Client ID |
| `JWT_SECRET` | JWT signing secret (long random value) |
| `OPENAI_API_KEY` | Azure OpenAI API key |
| `UPLOADS_DIR` | Directory for uploaded files (default: `uploads`) |
| `ALLOW_SEED_BYPASS_AUTH` | Enable seed bypass auth (default: `false`) |
| `SEED_AUTH_TOKEN` | Token for seed script authentication |

## Services

| Service | Port | Description |
|---|---|---|
| App | 3000 | Single container: Nginx serves the React SPA and proxies `/efor-sarayi-api` to FastAPI |
| PostgreSQL | 5432 | Primary database |
| ChromaDB | 8000 | Vector similarity search |

## Project Structure

```
efor-sarayi/
  backend/          FastAPI backend
    app/
      models/       SQLAlchemy models (Project, Document)
      routers/      API endpoints (auth, projects, estimation, documents)
      schemas/      Pydantic schemas
      services/     Business logic (estimator, document analyzer, embeddings, vector store)
    alembic/        Database migrations
  frontend/         React frontend
    src/
      api/          API client (fetch)
      auth/         Google OAuth context
      components/   Reusable UI components
      pages/        Route pages
      types/        TypeScript interfaces
  docker/           Nginx, supervisor and startup config
  Dockerfile        Unified frontend + backend container build
  docker-compose.yml
  seed.sh           Sample data seeder
```
