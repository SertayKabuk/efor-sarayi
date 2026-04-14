from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class PlanPhase(BaseModel):
    phase: str
    tasks: list[str] = []
    effort_days: float = 0


class Risk(BaseModel):
    description: str
    impact: Literal["low", "medium", "high"] = "medium"


class ProjectCreate(BaseModel):
    name: str = Field(max_length=255)
    description: str
    modules: list[str] = []
    integrations: list[str] = []
    requirements: list[str] = []
    tech_stack: list[str] = []
    duration_days: int = Field(ge=1)
    effort_person_days: int = Field(ge=0, default=0)
    complexity: Literal["low", "medium", "high", "very_high"]
    constraints: list[str] = []
    implementation_plan: list[PlanPhase] = []
    team_composition: list[str] = []
    assumptions: list[str] = []
    risks: list[Risk] = []
    questions: list[str] = []
    notes: str | None = None


class ProjectUpdate(BaseModel):
    name: str = Field(max_length=255)
    description: str
    modules: list[str] = []
    integrations: list[str] = []
    requirements: list[str] = []
    tech_stack: list[str] = []
    duration_days: int = Field(ge=1)
    effort_person_days: int = Field(ge=0, default=0)
    complexity: Literal["low", "medium", "high", "very_high"]
    constraints: list[str] = []
    implementation_plan: list[PlanPhase] = []
    team_composition: list[str] = []
    assumptions: list[str] = []
    risks: list[Risk] = []
    questions: list[str] = []
    notes: str | None = None


class ProjectRead(BaseModel):
    id: UUID
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
    implementation_plan: list[PlanPhase]
    team_composition: list[str]
    assumptions: list[str]
    risks: list[Risk]
    questions: list[str]
    notes: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class SimilarProject(BaseModel):
    id: UUID
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
    similarity_score: float


class DocumentRead(BaseModel):
    id: UUID
    project_id: UUID
    filename: str
    created_at: datetime

    model_config = {"from_attributes": True}


class EstimationRequest(BaseModel):
    name: str
    description: str
    modules: list[str] = []
    integrations: list[str] = []
    requirements: list[str] = []
    tech_stack: list[str] = []
    complexity: Literal["low", "medium", "high", "very_high"]
    constraints: list[str] = []
    notes: str | None = None


class EstimationResponse(BaseModel):
    estimated_days: float
    effort_person_days: float
    confidence: Literal["low", "medium", "high"]
    reasoning: str
    implementation_plan: list[PlanPhase]
    team_composition: list[str]
    assumptions: list[str]
    risks: list[Risk]
    questions: list[str]
    similar_projects: list[SimilarProject]
