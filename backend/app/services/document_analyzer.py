import logging
import re
from pathlib import Path
from zipfile import BadZipFile, ZipFile
from xml.etree import ElementTree as ET

from markitdown import (
    FileConversionException,
    MarkItDown,
    MissingDependencyException,
    UnsupportedFormatException,
)
from pydantic import BaseModel
from openai import AsyncOpenAI, BadRequestError

from app.config import settings

logger = logging.getLogger(__name__)

client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.azure_endpoint)
_MARKITDOWN = MarkItDown(enable_plugins=False)

MARKITDOWN_EXTENSIONS = {".pdf", ".docx", ".pptx", ".xlsx", ".xls", ".csv", ".md", ".txt"}
LEGACY_BINARY_OFFICE_EXTENSIONS = {".doc", ".ppt"}
ODF_TEXT_NAMESPACE = "urn:oasis:names:tc:opendocument:xmlns:text:1.0"


class DocumentAnalysisError(ValueError):
    """Raised when an uploaded document cannot be prepared for model analysis."""


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
    complexity: str
    constraints: list[str]
    implementation_plan: list[ExtractedPlanPhase]
    team_composition: list[str]
    assumptions: list[str]
    risks: list[ExtractedRisk]
    questions: list[str]
    notes: str


def _local_name(tag: str) -> str:
    return tag.rsplit("}", 1)[-1]


def _normalize_extracted_text(text: str) -> str:
    normalized = text.replace("\r\n", "\n").replace("\r", "\n").replace("\xa0", " ")

    cleaned_lines: list[str] = []
    previous_blank = True
    for raw_line in normalized.split("\n"):
        line = raw_line.strip()
        if line:
            cleaned_lines.append(line)
            previous_blank = False
        elif not previous_blank:
            cleaned_lines.append("")
            previous_blank = True

    return "\n".join(cleaned_lines).strip()


def _extract_odt_text(path: Path) -> str:
    try:
        with ZipFile(path) as archive:
            root = ET.fromstring(archive.read("content.xml"))
    except (BadZipFile, KeyError, ET.ParseError) as exc:
        raise DocumentAnalysisError(f"'{path.name}' is not a valid ODT file.") from exc

    paragraphs: list[str] = []
    for node in root.iter():
        if not node.tag.startswith(f"{{{ODF_TEXT_NAMESPACE}}}"):
            continue
        if _local_name(node.tag) not in {"p", "h"}:
            continue

        paragraph_text = "".join(fragment for fragment in node.itertext()).strip()
        if paragraph_text:
            paragraphs.append(paragraph_text)

    return "\n".join(paragraphs)


def _decode_rtf_hex_escape(match: re.Match[str]) -> str:
    return bytes.fromhex(match.group(1)).decode("cp1252", errors="ignore")


def _extract_rtf_text(path: Path) -> str:
    raw = path.read_text(encoding="utf-8", errors="ignore")
    raw = raw.replace("\r\n", "\n").replace("\r", "\n")
    raw = re.sub(r"\\par[d]?\s?", "\n", raw)
    raw = re.sub(r"\\tab\s?", "\t", raw)
    raw = re.sub(r"\\'([0-9a-fA-F]{2})", _decode_rtf_hex_escape, raw)
    raw = re.sub(r"\\[a-zA-Z]+-?\d*\s?", "", raw)
    raw = raw.replace("\\{", "{").replace("\\}", "}").replace("\\\\", "\\")
    raw = raw.replace("{", "").replace("}", "")
    return raw


def _extract_with_markitdown(filename: str, path: Path) -> str:
    try:
        result = _MARKITDOWN.convert_local(path)
    except (FileConversionException, MissingDependencyException, UnsupportedFormatException, OSError) as exc:
        logger.warning("MarkItDown failed to convert %s", filename, exc_info=True)
        detail = str(exc).strip().replace(str(path), filename)
        if detail:
            raise DocumentAnalysisError(f"Could not convert '{filename}': {detail}") from exc
        raise DocumentAnalysisError(f"Could not convert '{filename}'.") from exc
    except Exception as exc:
        logger.warning("Unexpected MarkItDown error for %s", filename, exc_info=True)
        raise DocumentAnalysisError(
            f"Could not extract readable text from '{filename}'. Verify the file is valid and try again."
        ) from exc

    markdown = getattr(result, "markdown", "")
    if not isinstance(markdown, str) or not markdown.strip():
        raise DocumentAnalysisError(
            f"No readable text could be extracted from '{filename}'. "
            "The file may be empty or image-only; OCR is not enabled."
        )

    return markdown


def _extract_text_from_document(filename: str, file_path: str) -> str:
    path = Path(file_path)
    extension = Path(filename).suffix.lower()

    if extension in MARKITDOWN_EXTENSIONS:
        return _extract_with_markitdown(filename, path)
    if extension == ".odt":
        return _extract_odt_text(path)
    if extension == ".rtf":
        return _extract_rtf_text(path)
    if extension in LEGACY_BINARY_OFFICE_EXTENSIONS:
        raise DocumentAnalysisError(
            f"'{filename}' uses the legacy {extension} format. This backend cannot reliably extract text from legacy Word or PowerPoint binaries. Convert it to PDF or a modern Office format and try again."
        )

    raise DocumentAnalysisError(f"Unsupported file type '{extension or filename}'.")


def _build_text_content_block(filename: str, text: str) -> dict:
    normalized = _normalize_extracted_text(text)
    if not normalized:
        raise DocumentAnalysisError(
            f"No readable text could be extracted from '{filename}'. Convert it to PDF and try again."
        )

    return {
        "type": "input_text",
        "text": f"DOCUMENT: {filename}\n\n{normalized}",
    }


def _truncate_text_for_prompt(
    text: str,
    max_chars: int,
    *,
    suffix: str = "\n\n[Document truncated for chat context.]",
) -> str:
    if max_chars <= 0:
        return suffix.strip()

    if len(text) <= max_chars:
        return text

    content_limit = max_chars - len(suffix)
    if content_limit <= 0:
        return suffix.strip()

    truncated = text[:content_limit].rstrip()
    last_space = truncated.rfind(" ")
    if last_space >= max(0, content_limit - 200):
        truncated = truncated[:last_space].rstrip()

    return f"{truncated}{suffix}"


def extract_document_text(
    filename: str,
    file_path: str,
    max_chars: int | None = None,
) -> str:
    extracted_text = _extract_text_from_document(filename, file_path)
    normalized = _normalize_extracted_text(extracted_text)

    if not normalized:
        raise DocumentAnalysisError(
            f"No readable text could be extracted from '{filename}'. Convert it to PDF and try again."
        )

    if max_chars is not None:
        normalized = _truncate_text_for_prompt(normalized, max_chars)

    return normalized


def build_document_prompt_content_block(
    filename: str,
    file_path: str,
    max_text_chars: int | None = None,
) -> dict:
    extracted_text = extract_document_text(filename, file_path, max_chars=max_text_chars)
    return _build_text_content_block(filename, extracted_text)


def _build_document_content_block(filename: str, file_path: str) -> dict:
    return build_document_prompt_content_block(filename, file_path)


async def extract_project_info(
    documents: list[dict[str, str]],
    custom_prompt: str | None = None,
) -> ExtractedProjectInfo:
    """Extract project info by sending provider-compatible document content to the LLM.

    Args:
        documents: list of {"filename": str, "file_path": str}
        custom_prompt: optional user instructions to guide the extraction
    """
    content: list[dict] = []

    for doc in documents:
        content.append(_build_document_content_block(doc["filename"], doc["file_path"]))

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

    try:
        response = await client.responses.parse(
            model=settings.azure_deployment_name,
            input=[{"role": "user", "content": content}],
            text_format=ExtractedProjectInfo,
        )
    except BadRequestError as exc:
        message = str(exc)
        if "unsupported_file" in message or "Please try again with a pdf" in message:
            raise DocumentAnalysisError(
                "The AI provider rejected the extracted document content. Verify the document contains readable text and try again."
            ) from exc
        raise

    return response.output_parsed
