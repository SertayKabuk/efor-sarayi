import tempfile
from pathlib import Path
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.project import Project
from app.schemas.project import EstimationRequest, EstimationResponse
from app.services.document_analyzer import extract_project_info
from app.services.embedding import generate_embedding
from app.services.estimator import estimate_effort
from app.services.vector_store import vector_store

router = APIRouter(prefix="/api/v1", tags=["estimation"])

ALLOWED_EXTENSIONS = {".pdf", ".docx", ".doc", ".odt", ".rtf", ".txt", ".md",
                      ".xlsx", ".xls", ".csv", ".pptx", ".ppt"}
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50 MB


@router.post("/extract")
async def extract_from_documents(files: list[UploadFile]):
    """Extract project info from uploaded documents without persisting anything."""
    if not files:
        raise HTTPException(status_code=400, detail="No files uploaded")

    temp_files: list[Path] = []
    doc_list: list[dict[str, str]] = []
    try:
        for file in files:
            filename = file.filename or "unknown"
            ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            if ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=400,
                    detail=f"Unsupported file type '{ext}'. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}",
                )
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(status_code=400, detail=f"File {filename} exceeds 50 MB limit")

            tmp = Path(tempfile.mktemp(suffix=ext))
            tmp.write_bytes(content)
            temp_files.append(tmp)
            doc_list.append({"filename": filename, "file_path": str(tmp)})

        extracted = await extract_project_info(doc_list)
        return extracted.model_dump()
    finally:
        for tmp in temp_files:
            try:
                tmp.unlink()
            except Exception:
                pass


@router.post("/estimate", response_model=EstimationResponse)
async def estimate(request: EstimationRequest, db: AsyncSession = Depends(get_db)):
    text = (
        f"Project: {request.name}\n"
        f"Description: {request.description}\n"
        f"Modules: {', '.join(request.modules)}\n"
        f"Integrations: {', '.join(request.integrations)}\n"
        f"Requirements: {', '.join(request.requirements)}\n"
        f"Tech Stack: {', '.join(request.tech_stack)}\n"
        f"Complexity: {request.complexity}\n"
        f"Constraints: {', '.join(request.constraints)}\n"
        f"Notes: {request.notes or 'N/A'}"
    )
    embedding = await generate_embedding(text)

    results = vector_store.query_similar(embedding, top_k=5)

    similar_projects = []
    if results["ids"] and results["ids"][0]:
        for i, project_id in enumerate(results["ids"][0]):
            project = await db.get(Project, UUID(project_id))
            if project:
                distance = results["distances"][0][i] if results["distances"] else 0
                similarity = 1 - distance
                similar_projects.append(
                    {
                        "id": project.id,
                        "name": project.name,
                        "description": project.description,
                        "modules": project.modules,
                        "integrations": project.integrations,
                        "requirements": project.requirements,
                        "tech_stack": project.tech_stack,
                        "complexity": project.complexity,
                        "constraints": project.constraints,
                        "duration_days": project.duration_days,
                        "effort_person_days": project.effort_person_days,
                        "similarity_score": round(similarity, 3),
                    }
                )

    return await estimate_effort(request, similar_projects)
