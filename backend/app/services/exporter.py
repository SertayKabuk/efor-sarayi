from openai import AsyncOpenAI

from app.config import settings

client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.azure_endpoint)


async def export_project_markdown(project: dict, custom_prompt: str | None = None) -> str:
    """Generate a markdown document from project data using AI."""
    prompt = f"""You are a technical documentation expert. Generate a well-structured, professional Markdown document for the following project.

PROJECT DATA:
- Name: {project.get('name', 'N/A')}
- Description: {project.get('description', 'N/A')}
- Complexity: {project.get('complexity', 'N/A')}
- Duration: {project.get('duration_days', 'N/A')} calendar days
- Effort: {project.get('effort_person_days', 'N/A')} person-days
- Modules: {', '.join(project.get('modules', [])) or 'N/A'}
- Integrations: {', '.join(project.get('integrations', [])) or 'N/A'}
- Requirements: {', '.join(project.get('requirements', [])) or 'N/A'}
- Tech Stack: {', '.join(project.get('tech_stack', [])) or 'N/A'}
- Constraints: {', '.join(project.get('constraints', [])) or 'N/A'}
- Team Composition: {', '.join(project.get('team_composition', [])) or 'N/A'}
- Assumptions: {', '.join(project.get('assumptions', [])) or 'N/A'}
- Notes: {project.get('notes') or 'N/A'}

IMPLEMENTATION PLAN:
"""

    for phase in project.get("implementation_plan", []):
        prompt += f"\n- {phase.get('phase', '')}: {phase.get('effort_days', 0)} person-days"
        for task in phase.get("tasks", []):
            prompt += f"\n  - {task}"

    prompt += "\n\nRISKS:\n"
    for risk in project.get("risks", []):
        prompt += f"- [{risk.get('impact', 'medium')}] {risk.get('description', '')}\n"

    prompt += "\nQUESTIONS & AMBIGUITIES:\n"
    for q in project.get("questions", []):
        prompt += f"- {q}\n"

    prompt += """
Generate a complete Markdown document with proper headings, tables where appropriate, and clear formatting. Include all the information above in a well-organized structure. Output ONLY the Markdown content, no code fences."""

    if custom_prompt:
        prompt += f"\n\nADDITIONAL USER INSTRUCTIONS:\n{custom_prompt}"

    response = await client.responses.create(
        model=settings.azure_deployment_name,
        input=[{"role": "user", "content": prompt}],
    )

    return response.output_text


async def export_estimate_markdown(estimate: dict, custom_prompt: str | None = None) -> str:
    """Generate a markdown document from estimation result data using AI."""
    prompt = f"""You are a technical documentation expert. Generate a well-structured, professional Markdown document for the following project effort estimation.

ESTIMATION SUMMARY:
- Estimated Duration: {estimate.get('estimated_days', 'N/A')} calendar days
- Total Effort: {estimate.get('effort_person_days', 'N/A')} person-days
- Confidence Level: {estimate.get('confidence', 'N/A')}
- Reasoning: {estimate.get('reasoning', 'N/A')}

TEAM COMPOSITION:
{chr(10).join(f'- {role}' for role in estimate.get('team_composition', [])) or 'N/A'}

IMPLEMENTATION PLAN:
"""

    for phase in estimate.get("implementation_plan", []):
        prompt += f"\n- {phase.get('phase', '')}: {phase.get('effort_days', 0)} person-days"
        for task in phase.get("tasks", []):
            prompt += f"\n  - {task}"

    prompt += f"""

ASSUMPTIONS:
{chr(10).join(f'- {a}' for a in estimate.get('assumptions', [])) or 'N/A'}

RISKS:
"""
    for risk in estimate.get("risks", []):
        prompt += f"- [{risk.get('impact', 'medium')}] {risk.get('description', '')}\n"

    prompt += "\nQUESTIONS & AMBIGUITIES:\n"
    for q in estimate.get("questions", []):
        prompt += f"- {q}\n"

    similar = estimate.get("similar_projects", [])
    if similar:
        prompt += "\nSIMILAR PAST PROJECTS:\n"
        for proj in similar:
            prompt += (
                f"- {proj.get('name', 'N/A')} "
                f"(similarity: {proj.get('similarity_score', 0):.0%}, "
                f"duration: {proj.get('duration_days', 'N/A')}d, "
                f"effort: {proj.get('effort_person_days', 'N/A')}pd, "
                f"complexity: {proj.get('complexity', 'N/A')})\n"
            )

    prompt += """
Generate a complete Markdown document with proper headings, tables where appropriate, and clear formatting. Include all the information above in a well-organized structure. Output ONLY the Markdown content, no code fences."""

    if custom_prompt:
        prompt += f"\n\nADDITIONAL USER INSTRUCTIONS:\n{custom_prompt}"

    response = await client.responses.create(
        model=settings.azure_deployment_name,
        input=[{"role": "user", "content": prompt}],
    )

    return response.output_text
