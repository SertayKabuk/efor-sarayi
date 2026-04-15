# Frontend - Effort Estimator

React single-page application for managing projects and generating AI-powered effort estimates.

## Tech Stack

- **React 18** with TypeScript
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **React Router** - Client-side routing
- **Fetch API** - API client
- **Google Identity Services** - OAuth login
- **pnpm** - Package management

## Pages

| Route | Page | Description |
|---|---|---|
| `/` | Project List | Browse all projects with search/filter |
| `/projects/new` | Add Project | Create a new project manually |
| `/projects/import` | Import Project | Upload documents to create a project via AI extraction |
| `/projects/:id` | Project View | Read-only project details with plan, risks, questions |
| `/projects/:id/edit` | Edit Project | Edit project fields and manage documents |
| `/estimate` | Estimate | Upload docs or fill form, get AI estimation |

## Components

- **ProjectTable** - Sortable project list with modules, tech stack, complexity, duration, effort
- **ProjectForm** - Full project editor with all fields including plan, risks, questions
- **ProjectFilters** - Search by name, filter by complexity and tech stack
- **EstimationForm** - Two-step: upload docs to auto-fill, then review and estimate
- **EstimationResult** - Displays estimate with plan, team, assumptions, risks, questions
- **PlanEditor** - Edit implementation phases with tasks and person-day effort
- **RiskEditor** - Edit risks with impact levels (low/medium/high)
- **TagInput** - Reusable tag input for array fields
- **DocumentUpload** - Upload/download/delete project documents

## Local Development

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Type check
pnpm tsc --noEmit

# Build for production
pnpm build
```

## Production

The production build is served by Nginx (see `nginx.conf`). The Nginx config:

- Serves the React SPA from `/`
- Proxies `/api/` requests to the backend
- Sets `client_max_body_size 50M` for file uploads
- Uses `try_files` for client-side routing

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_GOOGLE_CLIENT_ID` | Google OAuth Client ID (build-time) |
