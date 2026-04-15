from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.auth import get_current_user
from app.config import settings
from app.routers import auth, documents, estimation, export, projects


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(
    title="Effort Estimator API",
    version="1.0.0",
    lifespan=lifespan,
    root_path=settings.root_path,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# public routes
app.include_router(auth.router)

# protected routes — all require authentication
for router in [projects.router, estimation.router, documents.router, export.router]:
    app.include_router(router, dependencies=[Depends(get_current_user)])


@app.get("/health")
async def health():
    return {"status": "ok"}
