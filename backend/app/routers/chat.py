import logging
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.project import Document, Project
from app.schemas.project import ProjectChatRequest, ProjectChatResponse
from app.services.project_chat import ProjectChatError, answer_project_question

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/projects/{project_id}/chat", tags=["chat"])


async def _get_project(project_id: UUID, db: AsyncSession) -> Project:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


@router.post("", response_model=ProjectChatResponse)
async def chat_with_project(
    project_id: UUID,
    data: ProjectChatRequest,
    db: AsyncSession = Depends(get_db),
) -> ProjectChatResponse:
    project = await _get_project(project_id, db)
    result = await db.execute(
        select(Document).where(Document.project_id == project_id).order_by(Document.created_at)
    )
    documents = result.scalars().all()

    try:
        answer, included_filenames = await answer_project_question(
            project,
            documents,
            data.message,
            data.history,
            include_documents=data.include_documents,
        )
    except ProjectChatError as exc:
        logger.warning("Project chat failed for project %s", project_id, exc_info=True)
        raise HTTPException(status_code=502, detail=str(exc)) from exc

    return ProjectChatResponse(
        answer=answer,
        include_documents=data.include_documents,
        project_context_included=True,
        document_count=len(included_filenames),
        document_filenames=included_filenames,
    )
