from openai import AsyncOpenAI

from app.config import settings

client = AsyncOpenAI(api_key=settings.azure_embedding_api_key,
    base_url=settings.azure_embedding_endpoint)


def build_embedding_text(project) -> str:
    tech = project.tech_stack if isinstance(project.tech_stack, list) else [project.tech_stack]
    modules = getattr(project, "modules", None) or []
    integrations = getattr(project, "integrations", None) or []
    requirements = getattr(project, "requirements", None) or []
    constraints = getattr(project, "constraints", None) or []
    notes = getattr(project, "notes", None) or "N/A"
    return (
        f"Project: {project.name}\n"
        f"Description: {project.description}\n"
        f"Modules: {', '.join(modules)}\n"
        f"Integrations: {', '.join(integrations)}\n"
        f"Requirements: {', '.join(requirements)}\n"
        f"Tech Stack: {', '.join(tech)}\n"
        f"Complexity: {project.complexity}\n"
        f"Constraints: {', '.join(constraints)}\n"
        f"Notes: {notes}"
    )


async def generate_embedding(text: str) -> list[float]:
    response = await client.embeddings.create(
        model=settings.azure_embedding_deployment_name,
        input=text,
    )
    return response.data[0].embedding
