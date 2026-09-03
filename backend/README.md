# Backend - Effort Estimator API

FastAPI backend with async SQLAlchemy, Azure OpenAI integration, and ChromaDB vector search.

## Tech Stack

- **FastAPI** with async endpoints
- **SQLAlchemy 2.0** (async) + **PostgreSQL**
- **Azure OpenAI** - GPT for structured extraction/estimation, text-embedding-3-large for similarity
- **ChromaDB** - Vector store for similar project matching
- **Alembic** - Database migrations
- **uv** - Package management

## API Endpoints

### Auth

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/auth/google` | Google OAuth login |
| GET | `/api/v1/auth/me` | Get current user |
| POST | `/api/v1/auth/logout` | Logout (clear cookie) |

### Projects

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/projects` | List all projects |
| GET | `/api/v1/projects/{id}` | Get project by ID |
| POST | `/api/v1/projects` | Create project |
| PUT | `/api/v1/projects/{id}` | Update project |
| DELETE | `/api/v1/projects/{id}` | Delete project |
| POST | `/api/v1/projects/sync-embeddings` | Regenerate all embeddings |

### Documents

| Method | Path | Description |
|---|---|---|
| GET | `/api/v1/projects/{id}/documents` | List documents |
| POST | `/api/v1/projects/{id}/documents` | Upload documents (triggers AI extraction) |
| GET | `/api/v1/projects/{id}/documents/{doc_id}/download` | Download file |
| DELETE | `/api/v1/projects/{id}/documents/{doc_id}` | Delete document |

### Estimation

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/estimate` | Generate effort estimation |
| POST | `/api/v1/extract` | Extract project info from documents |

### Health

| Method | Path | Description |
|---|---|---|
| GET | `/health` | Health check |

## Project Model

```
Project
  name, description
  modules[], integrations[], requirements[], tech_stack[]
  duration_days, effort_person_days, complexity
  constraints[]
  implementation_plan[]    # {phase, tasks[], effort_days}
  team_composition[]
  assumptions[]
  risks[]                  # {description, impact}
  questions[]
  notes
```

## Estimation Response

The estimation endpoint returns:

- **estimated_days** - Calendar duration
- **effort_person_days** - Total person-day effort
- **confidence** - low / medium / high
- **reasoning** - Detailed explanation
- **implementation_plan** - Phases with tasks and effort
- **team_composition** - Suggested team roles
- **assumptions** - What the estimate assumes
- **risks** - Potential risks with impact levels
- **questions** - Ambiguous areas needing clarification
- **similar_projects** - Past projects ranked by similarity

## Local Development

From the repository root, start the PostgreSQL and ChromaDB services first:

```powershell
docker compose up -d postgres chromadb
```

Then, from the `backend` directory:

```bash
# Install dependencies
uv sync

# Run migrations
uv run python -m alembic upgrade head

# Start the FastAPI server
uv run uvicorn app.main:app --reload --port 8080
```

The API is available at `http://localhost:8080`, with interactive documentation at
`http://localhost:8080/docs`. The application entry point is `app.main:app`; do not
run `main.py` directly.

## Native SSE Responses

The AI-backed mutating endpoints stream native FastAPI SSE responses (`fastapi.sse.EventSourceResponse`).
Each stream emits a single JSON message payload and does not include legacy custom event names or non-SSE fallbacks.

## Database Migrations

Use Alembic through Python so the local `app` package is available on the import path:

```bash
# Create a new migration
uv run python -m alembic revision --autogenerate -m "description"

# Apply migrations
uv run python -m alembic upgrade head

# Rollback one step
uv run python -m alembic downgrade -1
```

## Supported File Types

PDF, DOCX, DOC, ODT, RTF, TXT, MD, XLSX, XLS, CSV, PPTX, PPT (max 50 MB per file).

MarkItDown converts PDF, DOCX, PPTX, XLSX, XLS, CSV, TXT, and MD files to Markdown locally before AI analysis. ODT and RTF files use the backend's dedicated text parsers. OCR is not enabled, so scanned or image-only PDFs may produce no readable text. Legacy Word and PowerPoint binaries (`.doc`, `.ppt`) must be converted to PDF or a modern Office format first.
