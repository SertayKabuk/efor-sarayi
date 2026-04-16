from enum import Enum
from typing import Any

from openai import AsyncOpenAI

from app.config import settings


class ExportMode(str, Enum):
    AI = "ai"
    DEFINITIONS = "definitions"


client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.azure_endpoint)


def _text(value: Any) -> str:
    if value is None:
        return "N/A"

    text = str(value).strip()
    return text or "N/A"


def _inline_text(value: Any) -> str:
    return _text(value).replace("\r\n", "\n").replace("\n", " ")


def _table_cell(value: Any) -> str:
    return _inline_text(value).replace("|", "\\|")


def _number(value: Any, suffix: str | None = None) -> str:
    if value is None or value == "":
        return "N/A"

    try:
        numeric = float(value)
    except (TypeError, ValueError):
        formatted = _inline_text(value)
    else:
        if numeric.is_integer():
            formatted = str(int(numeric))
        else:
            formatted = f"{numeric:.2f}".rstrip("0").rstrip(".")

    return f"{formatted} {suffix}" if suffix else formatted


def _percentage(value: Any) -> str:
    if value is None or value == "":
        return "N/A"

    try:
        numeric = float(value)
    except (TypeError, ValueError):
        return _inline_text(value)

    return f"{numeric:.0%}"


def _string_list(items: Any) -> list[str]:
    if not items:
        return []

    if isinstance(items, (str, bytes)):
        text = str(items).strip()
        return [text] if text else []

    values: list[str] = []
    for item in items:
        text = str(item).strip()
        if text:
            values.append(text)

    return values


def _bullet_list(items: Any) -> str:
    values = _string_list(items)
    if not values:
        return "- N/A"

    return "\n".join(f"- {value}" for value in values)


def _render_plan(phases: Any) -> str:
    if not phases:
        return "No implementation plan provided."

    lines: list[str] = []
    total_effort = 0.0
    has_phase = False

    for phase in phases:
        if not isinstance(phase, dict):
            continue

        has_phase = True
        effort_value = phase.get("effort_days", 0)
        try:
            total_effort += float(effort_value)
        except (TypeError, ValueError):
            pass

        lines.extend(
            [
                f"### {_inline_text(phase.get('phase'))}",
                "",
                f"- Estimated effort: {_number(effort_value, 'person-days')}",
                "- Tasks:",
            ]
        )

        tasks = _string_list(phase.get("tasks"))
        if tasks:
            lines.extend(f"  - {task}" for task in tasks)
        else:
            lines.append("  - N/A")

        lines.append("")

    if not has_phase:
        return "No implementation plan provided."

    lines.append(f"**Total planned effort:** {_number(total_effort, 'person-days')}")
    return "\n".join(lines).strip()


def _render_risks(risks: Any) -> str:
    if not risks:
        return "- N/A"

    lines: list[str] = []
    for risk in risks:
        if not isinstance(risk, dict):
            continue
        lines.append(
            f"- **{_inline_text(risk.get('impact')).capitalize()}**: {_inline_text(risk.get('description'))}"
        )

    return "\n".join(lines) if lines else "- N/A"


def _render_similar_projects(similar_projects: Any) -> str:
    if not similar_projects:
        return "No similar projects were matched."

    lines = [
        "| Project | Similarity | Duration | Effort | Complexity |",
        "| --- | --- | --- | --- | --- |",
    ]

    has_project = False
    for project in similar_projects:
        if not isinstance(project, dict):
            continue

        has_project = True
        lines.append(
            "| "
            f"{_table_cell(project.get('name'))} | "
            f"{_table_cell(_percentage(project.get('similarity_score')))} | "
            f"{_table_cell(_number(project.get('duration_days'), 'days'))} | "
            f"{_table_cell(_number(project.get('effort_person_days'), 'person-days'))} | "
            f"{_table_cell(project.get('complexity'))} |"
        )

    if not has_project:
        return "No similar projects were matched."

    return "\n".join(lines)


def _export_project_from_definitions(project: dict[str, Any]) -> str:
    lines = [
        f"# {_inline_text(project.get('name'))}",
        "",
        "_Generated directly from project definitions without AI rewriting._",
        "",
        "## Summary",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Complexity | {_table_cell(project.get('complexity'))} |",
        f"| Duration | {_table_cell(_number(project.get('duration_days'), 'calendar days'))} |",
        f"| Effort | {_table_cell(_number(project.get('effort_person_days'), 'person-days'))} |",
        "",
        "## Description",
        "",
        _text(project.get("description")),
        "",
        "## Scope",
        "",
        "### Modules",
        "",
        _bullet_list(project.get("modules")),
        "",
        "### Integrations",
        "",
        _bullet_list(project.get("integrations")),
        "",
        "### Requirements",
        "",
        _bullet_list(project.get("requirements")),
        "",
        "### Tech Stack",
        "",
        _bullet_list(project.get("tech_stack")),
        "",
        "### Constraints",
        "",
        _bullet_list(project.get("constraints")),
        "",
        "## Delivery Plan",
        "",
        "### Implementation Plan",
        "",
        _render_plan(project.get("implementation_plan")),
        "",
        "### Team Composition",
        "",
        _bullet_list(project.get("team_composition")),
        "",
        "## Assumptions",
        "",
        _bullet_list(project.get("assumptions")),
        "",
        "## Risks",
        "",
        _render_risks(project.get("risks")),
        "",
        "## Questions & Ambiguities",
        "",
        _bullet_list(project.get("questions")),
        "",
        "## Notes",
        "",
        _text(project.get("notes")),
    ]

    return "\n".join(lines).rstrip() + "\n"


def _export_estimate_from_definitions(estimate: dict[str, Any]) -> str:
    lines = [
        "# Effort Estimate",
        "",
        "_Generated directly from the current estimate data without AI rewriting._",
        "",
        "## Summary",
        "",
        "| Field | Value |",
        "| --- | --- |",
        f"| Estimated Duration | {_table_cell(_number(estimate.get('estimated_days'), 'calendar days'))} |",
        f"| Total Effort | {_table_cell(_number(estimate.get('effort_person_days'), 'person-days'))} |",
        f"| Confidence | {_table_cell(estimate.get('confidence'))} |",
        "",
        "## Reasoning",
        "",
        _text(estimate.get("reasoning")),
        "",
        "## Team Composition",
        "",
        _bullet_list(estimate.get("team_composition")),
        "",
        "## Implementation Plan",
        "",
        _render_plan(estimate.get("implementation_plan")),
        "",
        "## Assumptions",
        "",
        _bullet_list(estimate.get("assumptions")),
        "",
        "## Risks",
        "",
        _render_risks(estimate.get("risks")),
        "",
        "## Questions & Ambiguities",
        "",
        _bullet_list(estimate.get("questions")),
        "",
        "## Similar Past Projects",
        "",
        _render_similar_projects(estimate.get("similar_projects")),
    ]

    return "\n".join(lines).rstrip() + "\n"


def _build_project_ai_prompt(project: dict[str, Any], custom_prompt: str | None = None) -> str:
    prompt = f"""You are a technical documentation expert. Generate a well-structured, professional Markdown document for the following project.

PROJECT DATA:
- Name: {project.get('name', 'N/A')}
- Description: {project.get('description', 'N/A')}
- Complexity: {project.get('complexity', 'N/A')}
- Duration: {project.get('duration_days', 'N/A')} calendar days
- Effort: {project.get('effort_person_days', 'N/A')} person-days
- Modules: {', '.join(project.get('modules') or []) or 'N/A'}
- Integrations: {', '.join(project.get('integrations') or []) or 'N/A'}
- Requirements: {', '.join(project.get('requirements') or []) or 'N/A'}
- Tech Stack: {', '.join(project.get('tech_stack') or []) or 'N/A'}
- Constraints: {', '.join(project.get('constraints') or []) or 'N/A'}
- Team Composition: {', '.join(project.get('team_composition') or []) or 'N/A'}
- Assumptions: {', '.join(project.get('assumptions') or []) or 'N/A'}
- Notes: {project.get('notes') or 'N/A'}

IMPLEMENTATION PLAN:
"""

    for phase in project.get("implementation_plan") or []:
        if not isinstance(phase, dict):
            continue
        prompt += f"\n- {phase.get('phase', '')}: {phase.get('effort_days', 0)} person-days"
        for task in phase.get("tasks") or []:
            prompt += f"\n  - {task}"

    prompt += "\n\nRISKS:\n"
    for risk in project.get("risks") or []:
        if not isinstance(risk, dict):
            continue
        prompt += f"- [{risk.get('impact', 'medium')}] {risk.get('description', '')}\n"

    prompt += "\nQUESTIONS & AMBIGUITIES:\n"
    for question in project.get("questions") or []:
        prompt += f"- {question}\n"

    prompt += """
Generate a complete Markdown document with proper headings, tables where appropriate, and clear formatting. Include all the information above in a well-organized structure. Output ONLY the Markdown content, no code fences."""

    if custom_prompt:
        prompt += f"\n\nADDITIONAL USER INSTRUCTIONS:\n{custom_prompt}"

    return prompt


def _build_estimate_ai_prompt(estimate: dict[str, Any], custom_prompt: str | None = None) -> str:
    prompt = f"""You are a technical documentation expert. Generate a well-structured, professional Markdown document for the following project effort estimation.

ESTIMATION SUMMARY:
- Estimated Duration: {estimate.get('estimated_days', 'N/A')} calendar days
- Total Effort: {estimate.get('effort_person_days', 'N/A')} person-days
- Confidence Level: {estimate.get('confidence', 'N/A')}
- Reasoning: {estimate.get('reasoning', 'N/A')}

TEAM COMPOSITION:
{chr(10).join(f'- {role}' for role in estimate.get('team_composition') or []) or 'N/A'}

IMPLEMENTATION PLAN:
"""

    for phase in estimate.get("implementation_plan") or []:
        if not isinstance(phase, dict):
            continue
        prompt += f"\n- {phase.get('phase', '')}: {phase.get('effort_days', 0)} person-days"
        for task in phase.get("tasks") or []:
            prompt += f"\n  - {task}"

    prompt += f"""

ASSUMPTIONS:
{chr(10).join(f'- {assumption}' for assumption in estimate.get('assumptions') or []) or 'N/A'}

RISKS:
"""
    for risk in estimate.get("risks") or []:
        if not isinstance(risk, dict):
            continue
        prompt += f"- [{risk.get('impact', 'medium')}] {risk.get('description', '')}\n"

    prompt += "\nQUESTIONS & AMBIGUITIES:\n"
    for question in estimate.get("questions") or []:
        prompt += f"- {question}\n"

    similar = estimate.get("similar_projects") or []
    if similar:
        prompt += "\nSIMILAR PAST PROJECTS:\n"
        for project in similar:
            if not isinstance(project, dict):
                continue
            prompt += (
                f"- {project.get('name', 'N/A')} "
                f"(similarity: {project.get('similarity_score', 0):.0%}, "
                f"duration: {project.get('duration_days', 'N/A')}d, "
                f"effort: {project.get('effort_person_days', 'N/A')}pd, "
                f"complexity: {project.get('complexity', 'N/A')})\n"
            )

    prompt += """
Generate a complete Markdown document with proper headings, tables where appropriate, and clear formatting. Include all the information above in a well-organized structure. Output ONLY the Markdown content, no code fences."""

    if custom_prompt:
        prompt += f"\n\nADDITIONAL USER INSTRUCTIONS:\n{custom_prompt}"

    return prompt


async def _generate_markdown_with_ai(prompt: str) -> str:
    response = await client.responses.create(
        model=settings.azure_deployment_name,
        input=[{"role": "user", "content": prompt}],
    )

    return response.output_text


async def export_project_markdown(
    project: dict[str, Any],
    mode: ExportMode,
    custom_prompt: str | None = None,
) -> str:
    if mode == ExportMode.DEFINITIONS:
        return _export_project_from_definitions(project)

    return await _generate_markdown_with_ai(_build_project_ai_prompt(project, custom_prompt))


async def export_estimate_markdown(
    estimate: dict[str, Any],
    mode: ExportMode,
    custom_prompt: str | None = None,
) -> str:
    if mode == ExportMode.DEFINITIONS:
        return _export_estimate_from_definitions(estimate)

    return await _generate_markdown_with_ai(_build_estimate_ai_prompt(estimate, custom_prompt))
