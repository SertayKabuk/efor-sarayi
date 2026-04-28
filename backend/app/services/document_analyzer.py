import base64
import re
from pathlib import Path
from zipfile import BadZipFile, ZipFile
from xml.etree import ElementTree as ET

from pydantic import BaseModel
from openai import AsyncOpenAI, BadRequestError

from app.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.azure_endpoint)

RAW_FILE_MIME_TYPES = {
    ".pdf": "application/pdf",
}

TEXT_FILE_EXTENSIONS = {".csv", ".md", ".txt"}
LEGACY_BINARY_OFFICE_EXTENSIONS = {".doc", ".ppt", ".xls"}

WORDPROCESSINGML_NAMESPACE = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}
DRAWINGML_NAMESPACE = {"a": "http://schemas.openxmlformats.org/drawingml/2006/main"}
SPREADSHEETML_NAMESPACE = {
    "main": "http://schemas.openxmlformats.org/spreadsheetml/2006/main",
}
PACKAGE_RELATIONSHIP_NAMESPACE = "{http://schemas.openxmlformats.org/package/2006/relationships}"
WORKBOOK_RELATIONSHIP_ID = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}id"
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
    effort_person_days: int
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


def _read_text_file(path: Path) -> str:
    data = path.read_bytes()

    for encoding in ("utf-8", "utf-16", "utf-16-le", "utf-16-be", "cp1254"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue

    return data.decode("latin-1")


def _extract_docx_text(path: Path) -> str:
    try:
        with ZipFile(path) as archive:
            root = ET.fromstring(archive.read("word/document.xml"))
    except (BadZipFile, KeyError, ET.ParseError) as exc:
        raise DocumentAnalysisError(f"'{path.name}' is not a valid DOCX file.") from exc

    paragraphs: list[str] = []
    for paragraph in root.findall(".//w:p", WORDPROCESSINGML_NAMESPACE):
        parts: list[str] = []
        for node in paragraph.iter():
            node_name = _local_name(node.tag)
            if node_name == "t" and node.text:
                parts.append(node.text)
            elif node_name == "tab":
                parts.append("\t")
            elif node_name in {"br", "cr"}:
                parts.append("\n")

        paragraph_text = "".join(parts).strip()
        if paragraph_text:
            paragraphs.append(paragraph_text)

    return "\n".join(paragraphs)


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


def _pptx_slide_sort_key(name: str) -> int:
    match = re.search(r"slide(\d+)\.xml$", name)
    return int(match.group(1)) if match else 0


def _extract_pptx_text(path: Path) -> str:
    try:
        with ZipFile(path) as archive:
            slide_names = sorted(
                (
                    name
                    for name in archive.namelist()
                    if name.startswith("ppt/slides/slide") and name.endswith(".xml")
                ),
                key=_pptx_slide_sort_key,
            )

            slides: list[str] = []
            for index, slide_name in enumerate(slide_names, start=1):
                root = ET.fromstring(archive.read(slide_name))
                texts = [
                    node.text.strip()
                    for node in root.findall(".//a:t", DRAWINGML_NAMESPACE)
                    if node.text and node.text.strip()
                ]
                if texts:
                    slides.append(f"Slide {index}\n" + "\n".join(texts))
    except (BadZipFile, KeyError, ET.ParseError) as exc:
        raise DocumentAnalysisError(f"'{path.name}' is not a valid PPTX file.") from exc

    return "\n\n".join(slides)


def _extract_xlsx_shared_strings(archive: ZipFile) -> list[str]:
    if "xl/sharedStrings.xml" not in archive.namelist():
        return []

    root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
    shared_strings: list[str] = []
    for item in root.findall(".//main:si", SPREADSHEETML_NAMESPACE):
        shared_strings.append(
            "".join(text for text in (node.text for node in item.findall(".//main:t", SPREADSHEETML_NAMESPACE)) if text)
        )

    return shared_strings


def _extract_xlsx_sheet_targets(archive: ZipFile) -> list[tuple[str, str]]:
    workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
    relationships_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))

    relationship_map = {
        relationship.attrib["Id"]: relationship.attrib["Target"]
        for relationship in relationships_root.findall(f".//{PACKAGE_RELATIONSHIP_NAMESPACE}Relationship")
    }

    sheets: list[tuple[str, str]] = []
    for sheet in workbook_root.findall(".//main:sheets/main:sheet", SPREADSHEETML_NAMESPACE):
        name = sheet.attrib.get("name", "Sheet")
        relationship_id = sheet.attrib.get(WORKBOOK_RELATIONSHIP_ID)
        if not relationship_id:
            continue

        target = relationship_map.get(relationship_id)
        if not target:
            continue

        normalized_target = target if target.startswith("xl/") else f"xl/{target.lstrip('/')}"
        sheets.append((name, normalized_target))

    return sheets


def _extract_xlsx_cell_value(cell: ET.Element, shared_strings: list[str]) -> str:
    cell_type = cell.attrib.get("t")

    if cell_type == "inlineStr":
        return "".join(
            text for text in (node.text for node in cell.findall(".//main:t", SPREADSHEETML_NAMESPACE)) if text
        )

    value_node = cell.find("main:v", SPREADSHEETML_NAMESPACE)
    if value_node is None or value_node.text is None:
        return ""

    raw_value = value_node.text.strip()
    if not raw_value:
        return ""

    if cell_type == "s":
        try:
            return shared_strings[int(raw_value)]
        except (IndexError, ValueError):
            return raw_value

    if cell_type == "b":
        return "TRUE" if raw_value == "1" else "FALSE"

    return raw_value


def _extract_xlsx_text(path: Path) -> str:
    try:
        with ZipFile(path) as archive:
            shared_strings = _extract_xlsx_shared_strings(archive)
            sheet_targets = _extract_xlsx_sheet_targets(archive)

            sheet_blocks: list[str] = []
            for sheet_name, sheet_target in sheet_targets:
                if sheet_target not in archive.namelist():
                    continue

                root = ET.fromstring(archive.read(sheet_target))
                row_lines: list[str] = []
                for row in root.findall(".//main:sheetData/main:row", SPREADSHEETML_NAMESPACE):
                    cells: list[str] = []
                    for cell in row.findall("main:c", SPREADSHEETML_NAMESPACE):
                        value = _extract_xlsx_cell_value(cell, shared_strings)
                        if not value:
                            continue

                        reference = cell.attrib.get("r")
                        cells.append(f"{reference}: {value}" if reference else value)

                    if cells:
                        row_lines.append(" | ".join(cells))

                if row_lines:
                    sheet_blocks.append(f"Sheet: {sheet_name}\n" + "\n".join(row_lines))
    except (BadZipFile, KeyError, ET.ParseError) as exc:
        raise DocumentAnalysisError(f"'{path.name}' is not a valid XLSX file.") from exc

    return "\n\n".join(sheet_blocks)


def _extract_text_from_document(filename: str, file_path: str) -> str:
    path = Path(file_path)
    extension = Path(filename).suffix.lower()

    if extension in TEXT_FILE_EXTENSIONS:
        return _read_text_file(path)
    if extension == ".docx":
        return _extract_docx_text(path)
    if extension == ".odt":
        return _extract_odt_text(path)
    if extension == ".rtf":
        return _extract_rtf_text(path)
    if extension == ".pptx":
        return _extract_pptx_text(path)
    if extension == ".xlsx":
        return _extract_xlsx_text(path)
    if extension in LEGACY_BINARY_OFFICE_EXTENSIONS:
        raise DocumentAnalysisError(
            f"'{filename}' uses the legacy {extension} format. Azure Responses accepts PDF as a raw file input, but this backend cannot reliably extract text from legacy Office binaries. Convert it to PDF or a modern Office format and try again."
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


def _build_file_content_block(filename: str, file_path: str) -> dict:
    """Build an input_file content block with base64-encoded file data."""
    path = Path(file_path)
    data = path.read_bytes()
    b64 = base64.b64encode(data).decode("utf-8")
    mime = RAW_FILE_MIME_TYPES[Path(filename).suffix.lower()]
    return {
        "type": "input_file",
        "filename": filename,
        "file_data": f"data:{mime};base64,{b64}",
    }


def build_document_prompt_content_block(
    filename: str,
    file_path: str,
    max_text_chars: int | None = None,
) -> dict:
    extension = Path(filename).suffix.lower()
    if extension in RAW_FILE_MIME_TYPES:
        return _build_file_content_block(filename, file_path)

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
                "The configured Azure Responses API only accepts PDF as a raw file input. Convert unsupported files to PDF, or use text-based formats such as DOCX, PPTX, XLSX, CSV, TXT, MD, ODT, or RTF so the backend can extract their text before analysis."
            ) from exc
        raise

    return response.output_parsed
