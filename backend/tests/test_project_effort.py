import importlib
import os
import unittest
import uuid
from datetime import datetime, timezone

_REQUIRED_ENV = {
    "DATABASE_URL": "postgresql+asyncpg://user:pass@localhost:5432/testdb",
    "OPENAI_API_KEY": "test-openai-key",
    "AZURE_ENDPOINT": "https://example.openai.azure.com/openai/v1/",
    "AZURE_DEPLOYMENT_NAME": "test-chat-deployment",
    "AZURE_EMBEDDING_ENDPOINT": "https://example-embedding.openai.azure.com/openai/v1/",
    "AZURE_EMBEDDING_DEPLOYMENT_NAME": "test-embedding-deployment",
    "AZURE_EMBEDDING_API_KEY": "test-embedding-key",
    "CHROMA_HOST": "localhost",
    "CHROMA_PORT": "8000",
    "UPLOAD_DIR": "uploads",
    "GOOGLE_CLIENT_ID": "test-google-client-id",
    "JWT_SECRET": "test-jwt-secret",
    "ALLOWED_DOMAIN": "example.com",
    "ALLOW_SEED_BYPASS_AUTH": "false",
    "SEED_AUTH_TOKEN": "test-seed-auth-token",
}

for key, value in _REQUIRED_ENV.items():
    os.environ.setdefault(key, value)

project_models = importlib.import_module("app.models.project")
project_schemas = importlib.import_module("app.schemas.project")
effort_service = importlib.import_module("app.services.effort")

Project = project_models.Project
ProjectRead = project_schemas.ProjectRead
calculate_implementation_plan_effort = effort_service.calculate_implementation_plan_effort


class ProjectEffortTests(unittest.TestCase):
    def test_calculate_implementation_plan_effort_sums_positive_phase_effort(self) -> None:
        total = calculate_implementation_plan_effort(
            [
                {"effort_days": 10},
                {"effort_days": "5.5"},
                {"effort_days": -3},
                {"effort_days": "invalid"},
            ]
        )

        self.assertEqual(total, 15.5)

    def test_project_read_serializes_derived_effort_person_days(self) -> None:
        now = datetime.now(timezone.utc)
        project = Project(
            id=uuid.uuid4(),
            name="Vehicle Platform",
            description="Centralize registration and identification workflows.",
            modules=["Registration", "Verification"],
            integrations=["Insurance DB"],
            requirements=["Audit logging"],
            tech_stack=["FastAPI", "React"],
            duration_days=120,
            complexity="high",
            constraints=["Go-live before Q4"],
            implementation_plan=[
                {"phase": "Phase 1", "tasks": ["Discovery"], "effort_days": 30},
                {"phase": "Phase 2", "tasks": ["Build"], "effort_days": 45},
            ],
            team_composition=["2 Backend Developers"],
            assumptions=["Existing APIs remain stable"],
            risks=[{"description": "Vendor delay", "impact": "medium"}],
            questions=["What is the expected peak traffic?"],
            notes="Weekly steering committee updates.",
            created_at=now,
            updated_at=now,
        )

        payload = ProjectRead.model_validate(project)

        self.assertEqual(payload.effort_person_days, 75)


if __name__ == "__main__":
    unittest.main()