# Project Edge Cases and Pitfalls Inventory

_Last reviewed: 2026-04-28_

## Scope and method

This document is a whole-project review of the current repository, focused on **high-confidence edge cases and pitfalls that are visible from code, configuration, and tests**.

What was reviewed:

- Backend API, models, schemas, and services in `backend/app/**`
- Frontend routing, auth, pages, and core components in `frontend/src/**`
- Runtime and deployment files in `docker-compose*.yml`, `Dockerfile`, and `docker/**`
- Existing backend unit tests in `backend/tests/**`

Validation performed:

- Backend unit tests passed: **9/9** (`backend/tests/test_document_analyzer.py`, `backend/tests/test_project_chat.py`, `backend/tests/test_project_effort.py`)
- Editor diagnostics reported **no current static errors** in the workspace

## System snapshot

The application is a single-product stack with these major parts:

- **Frontend:** React + TypeScript + Vite SPA served under `/efor-sarayi`
- **Backend:** FastAPI + SQLAlchemy async API served under `/efor-sarayi-api`
- **Persistence:** PostgreSQL for project/document records
- **Similarity search:** ChromaDB for embeddings and nearest-neighbor matching
- **AI dependencies:** Azure OpenAI for extraction, chat, export, and estimation
- **Authentication:** Google OAuth login + JWT cookie

The main architectural coupling points are:

- path/base-path config (`frontend/vite.config.ts`, `frontend/src/main.tsx`, `backend/app/main.py`, `docker/nginx.conf`, `docker-compose*.yml`)
- auth cookie and credentialed fetch behavior (`backend/app/routers/auth.py`, `frontend/src/api/http.ts`)
- AI/document workflows (`backend/app/routers/documents.py`, `backend/app/routers/estimation.py`, `backend/app/services/document_analyzer.py`, `backend/app/services/project_chat.py`, `backend/app/services/estimator.py`)
- similarity sync (`backend/app/routers/projects.py`, `backend/app/services/embedding.py`, `backend/app/services/vector_store.py`)

## Cross-cutting edge cases and pitfalls

### 1. Base-path and proxy configuration must stay perfectly aligned

The repo has several independent knobs that all need to agree:

- Vite build base: `frontend/vite.config.ts`
- React router basename: `frontend/src/main.tsx`
- API base URL: `frontend/src/api/http.ts`
- FastAPI `root_path`: `backend/app/main.py` and `backend/app/config.py`
- Nginx rewrite/proxy rules: `docker/nginx.conf`
- Production Traefik path rules: `docker-compose.prod.yml`

**Pitfall:** a mismatch between any of these values breaks routing, refreshes, downloads, API calls, or auth flows in ways that are hard to diagnose.

Examples:

- frontend assets can resolve correctly while API calls 404
- the app can work in dev but fail behind a reverse proxy
- route links can work while page refreshes break
- `/efor-sarayi` and `/efor-sarayi-api` can drift independently

### 2. Credentialed cross-origin usage is fragile with the current CORS setup

`backend/app/main.py` enables:

- `allow_origins=["*"]`
- `allow_credentials=True`

At the same time, frontend requests use `credentials: "include"` in `frontend/src/api/http.ts`.

**Pitfall:** this works best when frontend and backend are effectively same-origin behind the unified proxy. If the frontend is ever served from a different origin and still relies on cookies, browsers will reject the wildcard-origin + credentials combination.

### 3. Many core features depend on external services, but failure handling is inconsistent

The project depends on:

- Google token verification (`backend/app/auth.py`)
- Azure OpenAI chat/extraction/export/estimation (`backend/app/services/*.py`)
- Azure embeddings (`backend/app/services/embedding.py`)
- ChromaDB (`backend/app/services/vector_store.py`)

**Pitfall:** some failures are gracefully logged or translated, while others bubble up as generic `500`/`502` responses. This creates uneven user experience and can leave data partially updated.

### 4. The app can look “up” before the backend is truly ready

`docker/entrypoint.sh` starts supervisord immediately, and `docker/supervisord.conf` starts Nginx while Uvicorn first runs `alembic upgrade head`.

**Pitfall:** the SPA may become reachable before API routes are healthy, especially during startup, migration delays, or migration failures.

## Backend edge cases and pitfalls

### 1. Uploaded filenames are not sanitized before filesystem writes

In `backend/app/routers/documents.py`, `_save_file()` writes using the client-provided filename directly.

**Pitfall:** a malicious or non-browser client can send filenames containing path separators or absolute paths. Because the filename is not normalized to a safe basename, this opens the door to path traversal or writes outside the intended project upload directory.

### 2. Multi-file uploads are not transactional

In `backend/app/routers/documents.py`, each file is:

1. read fully into memory
2. written to disk
3. added to the SQLAlchemy session

Only after the full loop does the code commit and then trigger AI extraction.

**Pitfalls:**

- if an early file is saved and a later file fails validation, earlier files may already exist on disk with no database row committed
- if DB commit succeeds but extraction fails, the documents remain persisted but the project refresh fails
- there is no compensating cleanup for partially processed batches

This is one of the highest-risk consistency issues in the repo.

### 3. Import flow can leave behind placeholder projects and partial data

`frontend/src/pages/ImportProjectPage.tsx` creates a placeholder project first, then uploads documents. The backend then re-analyzes the project from documents.

**Pitfall:** if extraction fails after the placeholder project is created, the user gets an error but the project record already exists. If document records were committed before extraction failed, the placeholder project can also keep uploaded documents.

That means a failed import is not truly rolled back.

### 4. Adding or deleting documents overwrites the whole project model

`backend/app/routers/documents.py::_refresh_project_from_documents()` replaces all major project fields from AI output every time documents are reprocessed.

**Pitfall:** manual edits to:

- name
- description
- modules
- requirements
- plan
- risks
- notes

can be silently overwritten by later document uploads or document deletions.

This is especially risky because document deletion also triggers a full refresh from the remaining files.

### 5. Delete flows can leave storage, database, and vector index out of sync

Examples:

- `backend/app/routers/documents.py` deletes the file from disk **before** deleting the DB row
- `backend/app/routers/projects.py` removes the upload directory **before** deleting the DB record
- `backend/app/routers/projects.py` deletes from Chroma **after** the DB commit

**Pitfalls:**

- a DB failure after file deletion leaves metadata pointing to missing files
- a vector-store failure after DB commit makes the API look failed even though the project is already gone from PostgreSQL
- create/update silently tolerate embedding sync failures, but delete does not

This creates asymmetric behavior across create, update, and delete.

### 6. Embedding sync reporting is misleading

`backend/app/routers/projects.py::_sync_embedding()` catches exceptions internally and only logs warnings.

Then `sync_embeddings()` in the same file wraps `_sync_embedding()` in a `try/except` and increments `synced` when `_sync_embedding()` returns.

**Pitfall:** because `_sync_embedding()` already swallows failures, `sync_embeddings()` can report projects as successfully synced even when embedding generation or Chroma upserts failed.

### 7. Similarity score conversion assumes a friendly distance range

`backend/app/routers/estimation.py` computes similarity as:

- `similarity = 1 - distance`

**Pitfall:** this assumes the returned distance maps neatly into a user-friendly similarity score. Depending on Chroma distance semantics, the result may be unintuitive or even negative.

So the UI may display a number that looks precise but is not a normalized similarity metric.

### 8. Large documents cause repeated memory amplification

The backend repeatedly loads file content into memory:

- upload routes call `await file.read()` for full file contents
- PDF processing base64-encodes raw bytes in `backend/app/services/document_analyzer.py`
- extracted text is then injected into prompts

**Pitfall:** the 50 MB per-file limit prevents the worst cases, but several large files in one request can still create high memory pressure.

### 9. Supported extension lists are more permissive than actual analysis support

The frontend and routers advertise support for:

- `.doc`
- `.xls`
- `.ppt`

However, `backend/app/services/document_analyzer.py` explicitly rejects legacy binary Office formats and tells the user to convert them.

**Pitfall:** the upload UI says these files are supported, but the analyzer can still reject them later. This is a UX mismatch that will look like a broken feature to users.

### 10. Text extraction can silently degrade quality

`backend/app/services/document_analyzer.py` falls back across encodings and eventually decodes with `latin-1`.

**Pitfall:** extraction may “succeed” with garbled characters instead of failing clearly, which can poison downstream AI interpretation without an obvious error message.

### 11. Chat context is intentionally lossy for long histories and many files

`backend/app/services/project_chat.py` enforces:

- max 10 history messages
- max 6000 chars per text document
- max 24000 chars total across text documents
- silent skipping of documents after the total budget is exhausted

**Pitfall:** users can assume the AI saw the full conversation and all uploaded documents when, in reality, older history and some documents may be truncated or omitted.

This behavior is sensible for token control, but it should be treated as a design constraint.

### 12. Some AI-heavy endpoints have thin error translation

Examples:

- `backend/app/routers/estimation.py` does not wrap embedding generation, Chroma queries, or estimation model calls with targeted user-facing error handling
- `backend/app/routers/export.py` delegates directly to exporter services
- `backend/app/services/exporter.py` returns raw AI output without structural validation

**Pitfall:** provider failures can surface as generic server errors, and malformed AI output can be harder to distinguish from transport issues.

## Frontend edge cases and pitfalls

### 1. The edit form can become stale after project data changes

`frontend/src/components/ProjectForm.tsx` initializes local state with `useState(initialData)` and does not resync when `initialData` changes.

Meanwhile, `frontend/src/pages/ProjectFormPage.tsx` updates `initialData` after fetching project changes or after document re-analysis.

**Pitfall:** the screen can show an out-of-date form after documents are uploaded or refreshed, because the parent has fresh data but the child form keeps its original local copy.

This is the most important frontend state bug in the repo.

### 2. Any `401` triggers a full page reload

`frontend/src/api/http.ts` reloads the window on unauthorized responses.

**Pitfall:** users can lose unsaved form edits, prompts, or in-progress work when the session expires.

This is especially painful on:

- project edit forms
- import prompts
- estimate forms
- export prompt text

### 3. Error handling is often too generic to help users recover

Examples:

- import page: “Failed to import project. Check file types and try again.”
- estimate extract form: “Failed to extract project info from documents.”
- export calls throw only `Export failed`

**Pitfall:** the backend often has more specific messages than the UI surfaces, so users lose actionable guidance such as unsupported legacy format vs. oversized file vs. provider failure.

### 4. Runtime base path and build base can drift

The app uses:

- hard-coded Vite `base: "/efor-sarayi/"` in `frontend/vite.config.ts`
- runtime router basename from `VITE_APP_BASE_PATH` in `frontend/src/main.tsx`

**Pitfall:** if `VITE_APP_BASE_PATH` changes without rebuilding with a matching Vite base, routes and static assets can disagree.

### 5. Login failure modes are not fully surfaced ahead of time

`frontend/src/main.tsx` passes `VITE_GOOGLE_CLIENT_ID || ""` into `GoogleOAuthProvider`.

**Pitfall:** if the client ID is missing or wrong, the app reaches the login page but cannot complete authentication reliably. The failure is only visible at runtime.

### 6. PDF export is browser- and DOM-sensitive

`frontend/src/utils/pdf.ts` relies on DOM cloning, stylesheet loading, font readiness, canvas rendering, and JPEG pagination.

**Pitfalls:**

- CSS differences between live DOM and cloned iframe can change layout
- large documents can generate large canvases and slow exports
- browser limitations or third-party content/CORS constraints can break rendering

The current implementation is thoughtful, but PDF generation remains inherently fragile.

### 7. Clipboard export has no guarded fallback

`frontend/src/components/ExportModal.tsx` calls `navigator.clipboard.writeText(markdown)` directly.

**Pitfall:** browsers with denied clipboard permissions or insecure contexts can fail here without a fallback path.

### 8. Document support messaging is misleading in more than one place

The import page, estimation form, and document upload component all present the same accepted extension list, including legacy Office formats.

**Pitfall:** the UI sets an expectation that the backend does not actually fulfill for `.doc`, `.xls`, and `.ppt` analysis.

## Deployment and operational pitfalls

### 1. Development and production routing are similar in outcome but different in mechanism

- local/container runtime uses Nginx proxying in `docker/nginx.conf`
- production compose uses Traefik labels in `docker-compose.prod.yml`

**Pitfall:** engineers can debug the wrong layer if they assume all routing lives in Nginx.

### 2. Documentation and deployment assumptions can drift

The root `README.md` describes the unified app container and Nginx proxying behavior, while production routing is also encoded in Traefik labels.

**Pitfall:** repo documentation can become partially true depending on the environment, which makes operations debugging slower.

### 3. Startup depends on successful migrations every time

`docker/supervisord.conf` runs `alembic upgrade head` before Uvicorn starts.

**Pitfall:** a migration failure prevents the API from becoming available and can lead to restart loops under container orchestration.

### 4. Settings accept duplicate upload directory variable names

`backend/app/config.py` accepts both `UPLOAD_DIR` and `UPLOADS_DIR`, and `.env.example` defines both.

**Pitfall:** duplicated configuration knobs invite drift and confusion about which value is authoritative.

### 5. Seed data currently relies on ignored extra fields

`seed.sh` includes `effort_person_days` in POST payloads even though project creation is defined by `backend/app/schemas/project.py::ProjectCreate`, which does not declare that field.

**Pitfall:** the script works today because extra fields are ignored, but it depends on permissive model behavior. If validation becomes stricter later, seeding will break.

## Existing test coverage and notable gaps

### Verified coverage already present

The current backend tests cover:

- document parsing behavior for PDF and DOCX
- rejection of legacy `.doc`
- chat context construction and truncation budgets
- derived effort calculation and `ProjectRead` serialization

### Important gaps

There is no visible automated coverage for:

- transactional safety of document upload/import flows
- rollback/cleanup behavior when extraction fails after partial progress
- vector-store inconsistency during delete or sync failures
- CORS + credential behavior across split origins
- frontend state resync after project refreshes
- frontend auth/session-expiry data loss scenarios
- PDF/export browser behavior
- end-to-end routing under production-style path prefixes

## Highest-priority improvements

If this repo is going to be hardened, these are the best first moves:

1. **Sanitize uploaded filenames** and force safe basenames before filesystem writes.
2. **Make document upload/import transactional** or add compensating cleanup for disk + DB partial failures.
3. **Stop overwriting the whole project record automatically** after every document change; use merge/review flows instead.
4. **Fix embedding sync semantics** so failures are reported accurately and create/update/delete behave consistently.
5. **Fix stale form state** in `ProjectForm` when `initialData` changes.
6. **Replace wildcard credentialed CORS** with explicit allowed origins if split-origin operation is needed.
7. **Unify supported file messaging** so the UI does not advertise legacy formats the analyzer rejects.
8. **Improve user-facing error propagation** in import, extract, estimate, and export flows.
9. **Consolidate base-path configuration** so runtime and build-time routing cannot drift.
10. **Add end-to-end tests** for import failure recovery, document overwrite behavior, and delete consistency.

## Bottom line

The project is structurally solid and the currently checked-in backend unit tests pass, but the biggest risks are not syntax or type issues—they are **consistency, state synchronization, and multi-system failure handling**.

If only a few issues are addressed, the most valuable ones are:

- upload/import rollback safety
- manual-data overwrite behavior after document changes
- stale form state on the frontend
- embedding/index consistency and truthful sync reporting
- path/cookie/CORS configuration drift across environments
