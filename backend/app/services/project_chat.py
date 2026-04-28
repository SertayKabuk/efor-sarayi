import logging
from pathlib import Path
from typing import Any, Sequence

from openai import AsyncOpenAI

from app.config import settings
from app.models.project import Document, Project
from app.schemas.project import ChatMessage
from app.services.document_analyzer import (
    RAW_FILE_MIME_TYPES,
    DocumentAnalysisError,
    build_document_prompt_content_block,
)

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.azure_endpoint)

MAX_HISTORY_MESSAGES = 10
MAX_TEXT_DOCUMENT_CHARS = 6000
MAX_TOTAL_TEXT_DOCUMENT_CHARS = 24000


class ProjectChatError(RuntimeError):
    """Raised when the project chat service cannot produce a response."""


def _format_list(title: str, items: Sequence[str]) -> str:
    return f"{title}: {', '.join(items) if items else 'N/A'}"


def _format_implementation_plan(phases: Sequence[dict[str, Any]]) -> str:
    if not phases:
        return "Implementation plan: N/A"

    lines = ["Implementation plan:"]
    for index, phase in enumerate(phases, start=1):
        phase_name = str(phase.get("phase") or f"Phase {index}").strip()
        effort_days = phase.get("effort_days", 0)
        lines.append(f"{index}. {phase_name} ({effort_days} person-days)")
        for task in phase.get("tasks") or []:
            lines.append(f"   - {task}")

    return "\n".join(lines)


def _format_risks(risks: Sequence[dict[str, Any]]) -> str:
    if not risks:
        return "Risks: N/A"

    lines = ["Risks:"]
    for risk in risks:
        description = str(risk.get("description") or "").strip()
        if not description:
            continue
        impact = str(risk.get("impact") or "medium").strip()
        lines.append(f"- ({impact}) {description}")

    return "\n".join(lines) if len(lines) > 1 else "Risks: N/A"


def _format_history(history: Sequence[ChatMessage]) -> str:
    recent_history = history[-MAX_HISTORY_MESSAGES:]
    if not recent_history:
        return "No prior conversation."

    lines: list[str] = []
    for item in recent_history:
        speaker = "User" if item.role == "user" else "Assistant"
        lines.append(f"{speaker}: {item.content}")

    return "\n\n".join(lines)


def build_project_context_text(project: Project) -> str:
    lines = [
        f"Project name: {project.name}",
        f"Description: {project.description or 'N/A'}",
        _format_list("Modules", project.modules),
        _format_list("Integrations", project.integrations),
        _format_list("Requirements", project.requirements),
        _format_list("Tech stack", project.tech_stack),
        f"Duration (days): {project.duration_days}",
        f"Effort (person-days): {project.effort_person_days}",
        f"Complexity: {project.complexity}",
        _format_list("Constraints", project.constraints),
        _format_implementation_plan(project.implementation_plan or []),
        _format_list("Team composition", project.team_composition),
        _format_list("Assumptions", project.assumptions),
        _format_risks(project.risks or []),
        _format_list("Questions", project.questions),
        f"Notes: {project.notes or 'N/A'}",
    ]
    return "\n".join(lines)


def build_document_context_blocks(
    documents: Sequence[Document],
    include_documents: bool = True,
    *,
    max_text_document_chars: int = MAX_TEXT_DOCUMENT_CHARS,
    max_total_text_document_chars: int = MAX_TOTAL_TEXT_DOCUMENT_CHARS,
) -> tuple[list[dict[str, Any]], list[str]]:
    if not include_documents or not documents:
        return [], []

    blocks: list[dict[str, Any]] = []
    included_filenames: list[str] = []
    remaining_text_chars = max_total_text_document_chars

    for document in documents:
        extension = Path(document.filename).suffix.lower()
        try:
            if extension in RAW_FILE_MIME_TYPES:
                block = build_document_prompt_content_block(document.filename, document.file_path)
            else:
                if remaining_text_chars <= 0:
                    continue
                block = build_document_prompt_content_block(
                    document.filename,
                    document.file_path,
                    max_text_chars=min(max_text_document_chars, remaining_text_chars),
                )
                remaining_text_chars -= len(block["text"])
        except DocumentAnalysisError:
            logger.warning(
                "Skipping document %s during project chat context build",
                document.filename,
                exc_info=True,
            )
            continue

        blocks.append(block)
        included_filenames.append(document.filename)

    if not included_filenames:
        return [], []

    blocks.insert(
        0,
        {
            "type": "input_text",
            "text": (
                "UPLOADED DOCUMENTS:\n"
                "Use the following documents as supporting context. "
                "Cite filenames in plain text when referring to document-specific details."
            ),
        },
    )
    return blocks, included_filenames


def build_project_chat_content(
    project: Project,
    documents: Sequence[Document],
    message: str,
    history: Sequence[ChatMessage],
    include_documents: bool = True,
) -> tuple[list[dict[str, Any]], list[str]]:
    content: list[dict[str, Any]] = [
        {
            "type": "input_text",
            "text": (
                "You are the AI assistant for a software project workspace. "
                "Answer the user's question using the generated project record and uploaded documents as the source of truth. "
                "If the generated project record and the documents disagree, briefly call out the conflict. "
                "If the provided context is insufficient, explicitly say what is missing instead of inventing details."
            ),
        },
        {
            "type": "input_text",
            "text": f"GENERATED PROJECT RECORD:\n{build_project_context_text(project)}",
        },
    ]

    document_blocks, included_filenames = build_document_context_blocks(
        documents,
        include_documents=include_documents,
    )
    content.extend(document_blocks)
    content.append(
        {
            "type": "input_text",
            "text": (
                f"CONVERSATION HISTORY:\n{_format_history(history)}\n\n"
                f"CURRENT USER QUESTION:\n{message}\n\n"
                "Write a direct, helpful answer. Prefer bullet lists when summarizing risks, phases, assumptions, or open questions."
            ),
        }
    )

    return content, included_filenames


async def answer_project_question(
    project: Project,
    documents: Sequence[Document],
    message: str,
    history: Sequence[ChatMessage],
    include_documents: bool = True,
) -> tuple[str, list[str]]:
    content, included_filenames = build_project_chat_content(
        project,
        documents,
        message,
        history,
        include_documents=include_documents,
    )

    try:
        response = await client.responses.create(
            model=settings.azure_deployment_name,
            input=[{"role": "user", "content": content}],
        )
    except Exception as exc:
        logger.warning("Project chat request failed for project %s", project.id, exc_info=True)
        raise ProjectChatError("Failed to generate a response from Project AI.") from exc

    answer = (getattr(response, "output_text", "") or "").strip()
    if not answer:
        raise ProjectChatError("Project AI returned an empty response.")

    return answer, included_filenames
