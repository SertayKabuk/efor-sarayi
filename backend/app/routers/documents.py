import logging
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from fastapi.responses import FileResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.models.project import Document, Project
from app.schemas.project import DocumentRead, ProjectRead
from app.services.document_analyzer import extract_project_info
from app.services.embedding import build_embedding_text, generate_embedding
from app.services.vector_store import vector_store

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/v1/projects/{project_id}/documents", tags=["documents"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".odt", ".rtf", ".txt", ".md",
                      ".xlsx", ".xls", ".csv", ".pptx", ".ppt"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB (OpenAI limit)


def _check_extension(filename: str) -> None:
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
        )


async def _get_project(project_id: UUID, db: AsyncSession) -> Project:
    project = await db.get(Project, project_id)
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return project


def _save_file(project_id: UUID, filename: str, content: bytes) -> str:
    """Save file to uploads/<project_id>/<filename> and return the path."""
    directory = Path(settings.upload_dir) / str(project_id)
    directory.mkdir(parents=True, exist_ok=True)

    file_path = directory / filename
    counter = 1
    stem = file_path.stem
    suffix = file_path.suffix
    while file_path.exists():
        file_path = directory / f"{stem}_{counter}{suffix}"
        counter += 1

    file_path.write_bytes(content)
    return str(file_path)


def _delete_file(file_path: str) -> None:
    try:
        path = Path(file_path)
        if path.exists():
            path.unlink()
            parent = path.parent
            if parent.exists() and not any(parent.iterdir()):
                parent.rmdir()
    except Exception:
        logger.warning("Failed to delete file %s", file_path, exc_info=True)


async def _refresh_project_from_documents(project: Project, db: AsyncSession) -> Project:
    """Send all documents to the LLM and update project fields."""
    result = await db.execute(
        select(Document).where(Document.project_id == project.id).order_by(Document.created_at)
    )
    docs = result.scalars().all()

    if not docs:
        return project

    doc_list = [{"filename": d.filename, "file_path": d.file_path} for d in docs]
    extracted = await extract_project_info(doc_list)

    project.name = extracted.name
    project.description = extracted.description
    project.modules = extracted.modules
    project.integrations = extracted.integrations
    project.requirements = extracted.requirements
    project.tech_stack = extracted.tech_stack
    project.duration_days = extracted.duration_days
    project.effort_person_days = extracted.effort_person_days
    project.complexity = extracted.complexity
    project.constraints = extracted.constraints
    project.implementation_plan = [p.model_dump() for p in extracted.implementation_plan]
    project.team_composition = extracted.team_composition
    project.assumptions = extracted.assumptions
    project.risks = [r.model_dump() for r in extracted.risks]
    project.questions = extracted.questions
    project.notes = extracted.notes

    await db.commit()
    await db.refresh(project)

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

    return project


@router.get("", response_model=list[DocumentRead])
async def list_documents(project_id: UUID, db: AsyncSession = Depends(get_db)):
    await _get_project(project_id, db)
    result = await db.execute(
        select(Document).where(Document.project_id == project_id).order_by(Document.created_at)
    )
    return result.scalars().all()


@router.post("", response_model=ProjectRead)
async def upload_documents(
    project_id: UUID,
    files: list[UploadFile],
    db: AsyncSession = Depends(get_db),
):
    project = await _get_project(project_id, db)

    for file in files:
        filename = file.filename or "unknown"
        _check_extension(filename)
        content = await file.read()
        if len(content) > MAX_FILE_SIZE:
            raise HTTPException(status_code=400, detail=f"File {filename} exceeds 50 MB limit")

        file_path = _save_file(project_id, filename, content)
        doc = Document(
            project_id=project.id,
            filename=filename,
            file_path=file_path,
        )
        db.add(doc)

    await db.commit()

    project = await _refresh_project_from_documents(project, db)
    return project


@router.get("/{document_id}/download")
async def download_document(
    project_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    await _get_project(project_id, db)
    doc = await db.get(Document, document_id)
    if not doc or doc.project_id != project_id:
        raise HTTPException(status_code=404, detail="Document not found")

    path = Path(doc.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="File not found on disk")

    return FileResponse(path, filename=doc.filename)


@router.delete("/{document_id}", response_model=ProjectRead)
async def delete_document(
    project_id: UUID,
    document_id: UUID,
    db: AsyncSession = Depends(get_db),
):
    project = await _get_project(project_id, db)
    doc = await db.get(Document, document_id)
    if not doc or doc.project_id != project_id:
        raise HTTPException(status_code=404, detail="Document not found")

    _delete_file(doc.file_path)
    await db.delete(doc)
    await db.commit()

    project = await _refresh_project_from_documents(project, db)
    return project
