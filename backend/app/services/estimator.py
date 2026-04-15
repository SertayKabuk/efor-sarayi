from pydantic import BaseModel
from openai import AsyncOpenAI

from app.config import settings
from app.schemas.project import EstimationRequest, EstimationResponse, SimilarProject, PlanPhase, Risk


class EstimatorPlanPhase(BaseModel):
    phase: str
    tasks: list[str]
    effort_days: float


class EstimatorRisk(BaseModel):
    description: str
    impact: str


class EstimatorResponse(BaseModel):
    estimated_days: float
    effort_person_days: float
    confidence: str
    reasoning: str
    implementation_plan: list[EstimatorPlanPhase]
    team_composition: list[str]
    assumptions: list[str]
    risks: list[EstimatorRisk]
    questions: list[str]


client = AsyncOpenAI(api_key=settings.openai_api_key, base_url=settings.azure_endpoint)


async def estimate_effort(
    request: EstimationRequest,
    similar_projects: list[dict],
) -> EstimationResponse:
    similar_text = ""
    for i, proj in enumerate(similar_projects, 1):
        similar_text += (
            f"\n{i}. {proj['name']}\n"
            f"   Modules: {', '.join(proj['modules'])}\n"
            f"   Integrations: {', '.join(proj['integrations'])}\n"
            f"   Requirements: {', '.join(proj['requirements'])}\n"
            f"   Tech Stack: {', '.join(proj['tech_stack'])}\n"
            f"   Complexity: {proj['complexity']}\n"
            f"   Constraints: {', '.join(proj['constraints'])}\n"
            f"   Duration: {proj['duration_days']} calendar days\n"
            f"   Effort: {proj['effort_person_days']} person-days\n"
            f"   Similarity Score: {proj['similarity_score']:.2f}\n"
        )

    prompt = f"""You are a software project effort estimation expert. Based on the new project details and similar past projects, provide a comprehensive effort estimation.

NEW PROJECT:
- Name: {request.name}
- Description: {request.description}
- Modules: {', '.join(request.modules) or 'N/A'}
- Integrations: {', '.join(request.integrations) or 'N/A'}
- Requirements: {', '.join(request.requirements) or 'N/A'}
- Tech Stack: {', '.join(request.tech_stack) or 'N/A'}
- Complexity: {request.complexity}
- Constraints: {', '.join(request.constraints) or 'N/A'}
- Notes: {request.notes or 'N/A'}

SIMILAR PAST PROJECTS:{similar_text if similar_text else ' None available'}

Provide:
1. **estimated_days**: Total calendar duration in days
2. **effort_person_days**: Total effort in person-days (sum of all phase efforts)
3. **confidence**: "low", "medium", or "high"
4. **reasoning**: Detailed explanation of your estimate
5. **implementation_plan**: Ordered list of phases, each with:
   - phase: Phase name (e.g. "Phase 1: Setup & Infrastructure")
   - tasks: List of concrete tasks in this phase
   - effort_days: Person-days for this phase
6. **team_composition**: Suggested team roles (e.g. "2 Backend Developers", "1 QA Engineer")
7. **assumptions**: What you're assuming to be true for this estimate (e.g. "No legacy data migration needed", "APIs are well-documented")
8. **risks**: Potential risks that could impact timeline, each with description and impact ("low", "medium", "high")
9. **questions**: Ambiguous areas or clarifying questions that should be answered to refine the estimate (e.g. "What is the expected concurrent user count?", "Is there an existing design system?")

Make the implementation plan realistic and actionable. The effort_person_days should equal the sum of all phase effort_days. Questions should identify the most important unknowns that would change the estimate if answered differently."""

    if request.custom_prompt:
        prompt += f"\n\nADDITIONAL USER INSTRUCTIONS:\n{request.custom_prompt}"

    response = await client.responses.parse(
        model=settings.azure_deployment_name,
        input=[{"role": "user", "content": prompt}],
        text_format=EstimatorResponse,
    )

    result = response.output_parsed

    similar_project_models = [
        SimilarProject(
            id=proj["id"],
            name=proj["name"],
            description=proj["description"],
            modules=proj["modules"],
            integrations=proj["integrations"],
            requirements=proj["requirements"],
            tech_stack=proj["tech_stack"],
            duration_days=proj["duration_days"],
            effort_person_days=proj["effort_person_days"],
            complexity=proj["complexity"],
            constraints=proj["constraints"],
            similarity_score=proj["similarity_score"],
        )
        for proj in similar_projects
    ]

    return EstimationResponse(
        estimated_days=result.estimated_days,
        effort_person_days=result.effort_person_days,
        confidence=result.confidence,
        reasoning=result.reasoning,
        implementation_plan=[
            PlanPhase(phase=p.phase, tasks=p.tasks, effort_days=p.effort_days)
            for p in result.implementation_plan
        ],
        team_composition=result.team_composition,
        assumptions=result.assumptions,
        risks=[
            Risk(description=r.description, impact=r.impact)
            for r in result.risks
        ],
        questions=result.questions,
        similar_projects=similar_project_models,
    )
