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

```bash
# Install dependencies
uv sync

# Run migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload --port 8080
```

## Database Migrations

```bash
# Create a new migration
alembic revision --autogenerate -m "description"

# Apply migrations
alembic upgrade head

# Rollback one step
alembic downgrade -1
```

## Supported File Types

PDF, DOCX, DOC, ODT, RTF, TXT, MD, XLSX, XLS, CSV, PPTX, PPT (max 50 MB per file).

Files are sent directly to the LLM as base64-encoded content blocks (no server-side parsing).
