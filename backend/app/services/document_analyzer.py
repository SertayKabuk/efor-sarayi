import base64
import mimetypes
from pathlib import Path

from pydantic import BaseModel
from openai import AsyncOpenAI

from app.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.azure_endpoint)

MIME_FALLBACK = "application/octet-stream"


class ExtractedPlanPhase(BaseModel):
    phase: str
    tasks: list[str]
    effort_days: float


class ExtractedRisk(BaseModel):
    description: str
    impact: str


class ExtractedProjectInfo(BaseModel):
    name: str
    description: str
    modules: list[str]
    integrations: list[str]
    requirements: list[str]
    tech_stack: list[str]
    duration_days: int
    effort_person_days: int
    complexity: str
    constraints: list[str]
    implementation_plan: list[ExtractedPlanPhase]
    team_composition: list[str]
    assumptions: list[str]
    risks: list[ExtractedRisk]
    questions: list[str]
    notes: str


def _build_file_content_block(filename: str, file_path: str) -> dict:
    """Build an input_file content block with base64-encoded file data."""
    path = Path(file_path)
    data = path.read_bytes()
    b64 = base64.b64encode(data).decode("utf-8")
    mime = mimetypes.guess_type(filename)[0] or MIME_FALLBACK
    return {
        "type": "input_file",
        "filename": filename,
        "file_data": f"data:{mime};base64,{b64}",
    }


async def extract_project_info(
    documents: list[dict[str, str]],
    custom_prompt: str | None = None,
) -> ExtractedProjectInfo:
    """Extract project info by sending files directly to the LLM.

    Args:
        documents: list of {"filename": str, "file_path": str}
        custom_prompt: optional user instructions to guide the extraction
    """
    content: list[dict] = []

    for doc in documents:
        content.append(_build_file_content_block(doc["filename"], doc["file_path"]))

    content.append({
        "type": "input_text",
        "text": """You are a project information extraction expert. Analyze the uploaded project documents and extract structured project information.

Extract the following:
- name: The project name
- description: A comprehensive project description combining information from all documents
- modules: List of feature modules/components (e.g. "Auth System", "Payment Gateway", "Admin Dashboard", "Reporting")
- integrations: List of external systems, APIs, and third-party services the project integrates with (e.g. "Stripe", "SAP", "LDAP", "SendGrid")
- requirements: List of non-functional requirements like security, compliance, performance, accessibility, i18n (e.g. "HIPAA compliance", "99.9% uptime SLA", "WCAG 2.1 AA", "Multi-language support")
- tech_stack: List of technologies, frameworks, and tools
- duration_days: Project duration in calendar days (estimate from context if not explicitly stated, default to 30)
- effort_person_days: Total effort in person-days (estimate from context, default to duration_days)
- complexity: One of "low", "medium", "high", "very_high" based on the project scope
- constraints: List of constraints like deadlines, regulations, legacy system dependencies
- implementation_plan: List of phases, each with:
  - phase: Phase name (e.g. "Phase 1: Setup & Infrastructure")
  - tasks: List of concrete tasks in this phase
  - effort_days: Person-days for this phase
- team_composition: Suggested team roles (e.g. "2 Backend Developers", "1 QA Engineer")
- assumptions: What is assumed to be true (e.g. "APIs are well-documented", "No legacy migration")
- risks: Potential risks, each with description and impact ("low", "medium", "high")
- questions: Ambiguous areas or clarifying questions that need answers for accurate estimation
- notes: Any additional important context not captured above

Combine and synthesize information from all documents into a single coherent project definition."""
        + (f"\n\nADDITIONAL USER INSTRUCTIONS:\n{custom_prompt}" if custom_prompt else ""),
    })

    response = await client.responses.parse(
        model=settings.azure_deployment_name,
        input=[{"role": "user", "content": content}],
        text_format=ExtractedProjectInfo,
    )

    return response.output_parsed
