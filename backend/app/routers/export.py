from pydantic import BaseModel
from fastapi import APIRouter
from fastapi.responses import PlainTextResponse

from app.services.exporter import export_project_markdown, export_estimate_markdown

router = APIRouter(prefix="/api/v1/export", tags=["export"])


class ExportProjectRequest(BaseModel):
    project: dict
    custom_prompt: str | None = None


class ExportEstimateRequest(BaseModel):
    estimate: dict
    custom_prompt: str | None = None


@router.post("/project", response_class=PlainTextResponse)
async def export_project(data: ExportProjectRequest) -> str:
    return await export_project_markdown(data.project, data.custom_prompt)


@router.post("/estimate", response_class=PlainTextResponse)
async def export_estimate(data: ExportEstimateRequest) -> str:
    return await export_estimate_markdown(data.estimate, data.custom_prompt)
