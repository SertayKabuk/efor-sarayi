import logging
import shutil
from collections.abc import AsyncIterable
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from fastapi.sse import EventSourceResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.project import Project
from app.schemas.project import (
    EmbeddingSyncSummary,
    ProjectCreate,
    ProjectRead,
    ProjectUpdate,
)
from app.sse import single_item_stream
from app.services.embedding import generate_embedding, build_embedding_text
from app.services.vector_store import vector_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/projects", tags=["projects"])


async def _sync_embedding(project: Project):
    try:
        text = build_embedding_text(project)
        embedding = await generate_embedding(text)
        vector_store.upsert_project(
            project_id=str(project.id),
            embedding=embedding,
            document=text,
            metadata={
                "name": project.name,
                "tech_stack": ", ".join(project.tech_stack),
                "modules": ", ".join(project.modules),
                "complexity": project.complexity,
                "duration_days": project.duration_days,
            },
        )
    except Exception:
        logger.warning("Failed to sync embedding for project %s", project.id, exc_info=True)


@router.get("", response_model=list[ProjectRead])
async def list_projects(
    skip: int = 0, limit: int = 50, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Project).order_by(Project.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/{project_id}", response_model=ProjectRead)
async def get_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("", response_class=EventSourceResponse, status_code=201)
async def create_project(
    data: ProjectCreate,
    db: AsyncSession = Depends(get_db),
) -> AsyncIterable[ProjectRead]:
    async def process():
        project = Project(**data.model_dump())
        db.add(project)
        await db.commit()
        await db.refresh(project)
        await _sync_embedding(project)
        return project

    return single_item_stream(await process())


@router.put("/{project_id}", response_class=EventSourceResponse)
async def update_project(
    project_id: UUID,
    data: ProjectUpdate,
    db: AsyncSession = Depends(get_db),
) -> AsyncIterable[ProjectRead]:
    async def process():
        project = await db.get(Project, project_id)
        if not project:
            raise HTTPException(status_code=404, detail="Project not found")

        for field, value in data.model_dump().items():
            setattr(project, field, value)

        await db.commit()
        await db.refresh(project)
        await _sync_embedding(project)
        return project

    return single_item_stream(await process())


@router.delete("/{project_id}", status_code=204)
async def delete_project(project_id: UUID, db: AsyncSession = Depends(get_db)):
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")

    # remove uploaded files
    upload_dir = Path(settings.upload_dir) / str(project_id)
    if upload_dir.exists():
        shutil.rmtree(upload_dir, ignore_errors=True)

    await db.delete(project)
    await db.commit()
    vector_store.delete_project(str(project_id))


@router.post("/sync-embeddings", response_class=EventSourceResponse)
async def sync_embeddings(
    db: AsyncSession = Depends(get_db),
) -> AsyncIterable[EmbeddingSyncSummary]:
    """Regenerate embeddings for all projects."""
    async def process():
        result = await db.execute(select(Project))
        projects = result.scalars().all()
        synced, failed = 0, 0
        for project in projects:
            try:
                await _sync_embedding(project)
                synced += 1
            except Exception:
                logger.warning("Failed to sync embedding for project %s", project.id, exc_info=True)
                failed += 1
        return EmbeddingSyncSummary(synced=synced, failed=failed, total=len(projects))

    return single_item_stream(await process())
