import importlib
import os
import tempfile
import unittest
import uuid
from pathlib import Path

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

project_chat = importlib.import_module("app.services.project_chat")
project_models = importlib.import_module("app.models.project")
project_schemas = importlib.import_module("app.schemas.project")

Project = project_models.Project
Document = project_models.Document
ChatMessage = project_schemas.ChatMessage


class ProjectChatContextTests(unittest.TestCase):
    def _build_project(self) -> Project:
        return Project(
            id=uuid.uuid4(),
            name="Warehouse Modernization",
            description="Rebuild warehouse order picking and reporting workflows.",
            modules=["Order Picking", "Reporting"],
            integrations=["SAP", "Power BI"],
            requirements=["Audit logging", "99.9% uptime"],
            tech_stack=["FastAPI", "React", "PostgreSQL"],
            duration_days=90,
            effort_person_days=180,
            complexity="high",
            constraints=["Fixed go-live date", "Legacy SAP data contracts"],
            implementation_plan=[
                {
                    "phase": "Phase 1: Foundations",
                    "tasks": ["Set up APIs", "Design database schema"],
                    "effort_days": 30,
                },
                {
                    "phase": "Phase 2: Rollout",
                    "tasks": ["Pilot warehouse rollout"],
                    "effort_days": 25,
                },
            ],
            team_composition=["2 Backend Developers", "1 Frontend Developer"],
            assumptions=["SAP APIs remain stable"],
            risks=[{"description": "SAP throttling", "impact": "high"}],
            questions=["What is the fallback for offline scanning?"],
            notes="Customer wants weekly steering updates.",
        )

    def test_build_project_context_text_includes_key_sections(self) -> None:
        context = project_chat.build_project_context_text(self._build_project())

        self.assertIn("Project name: Warehouse Modernization", context)
        self.assertIn("Modules: Order Picking, Reporting", context)
        self.assertIn("Implementation plan:", context)
        self.assertIn("SAP throttling", context)
        self.assertIn("Customer wants weekly steering updates.", context)

    def test_build_project_chat_content_includes_history_and_text_documents(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".md", delete=False, mode="w", encoding="utf-8") as tmp:
            tmp.write("# Scope\nThe rollout starts with one pilot warehouse.")
            tmp_path = Path(tmp.name)

        try:
            document = Document(
                id=uuid.uuid4(),
                project_id=uuid.uuid4(),
                filename="scope.md",
                file_path=str(tmp_path),
            )
            history = [
                ChatMessage(role="user", content="Give me a quick summary."),
                ChatMessage(role="assistant", content="The project is focused on warehouse modernization."),
            ]

            content, included_filenames = project_chat.build_project_chat_content(
                self._build_project(),
                [document],
                "What does the rollout strategy look like?",
                history,
            )
        finally:
            tmp_path.unlink(missing_ok=True)

        joined_text = "\n\n".join(
            block["text"] for block in content if block.get("type") == "input_text"
        )

        self.assertEqual(included_filenames, ["scope.md"])
        self.assertIn("GENERATED PROJECT RECORD", joined_text)
        self.assertIn("UPLOADED DOCUMENTS", joined_text)
        self.assertIn("DOCUMENT: scope.md", joined_text)
        self.assertIn("Assistant: The project is focused on warehouse modernization.", joined_text)
        self.assertIn("CURRENT USER QUESTION:\nWhat does the rollout strategy look like?", joined_text)

    def test_build_document_context_blocks_keeps_pdf_files_as_raw_inputs(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(b"%PDF-1.4\n")
            tmp_path = Path(tmp.name)

        try:
            document = Document(
                id=uuid.uuid4(),
                project_id=uuid.uuid4(),
                filename="blueprint.pdf",
                file_path=str(tmp_path),
            )
            blocks, included_filenames = project_chat.build_document_context_blocks([document])
        finally:
            tmp_path.unlink(missing_ok=True)

        self.assertEqual(included_filenames, ["blueprint.pdf"])
        self.assertEqual(blocks[1]["type"], "input_file")
        self.assertEqual(blocks[1]["filename"], "blueprint.pdf")

    def test_build_document_context_blocks_respects_text_budget(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w", encoding="utf-8") as first_tmp:
            first_tmp.write("Launch plan " * 40)
            first_path = Path(first_tmp.name)
        with tempfile.NamedTemporaryFile(suffix=".txt", delete=False, mode="w", encoding="utf-8") as second_tmp:
            second_tmp.write("Secondary notes " * 20)
            second_path = Path(second_tmp.name)

        try:
            first_document = Document(
                id=uuid.uuid4(),
                project_id=uuid.uuid4(),
                filename="launch.txt",
                file_path=str(first_path),
            )
            second_document = Document(
                id=uuid.uuid4(),
                project_id=uuid.uuid4(),
                filename="notes.txt",
                file_path=str(second_path),
            )

            blocks, included_filenames = project_chat.build_document_context_blocks(
                [first_document, second_document],
                max_text_document_chars=60,
                max_total_text_document_chars=65,
            )
        finally:
            first_path.unlink(missing_ok=True)
            second_path.unlink(missing_ok=True)

        self.assertEqual(included_filenames, ["launch.txt"])
        self.assertIn("[Document truncated for chat context.]", blocks[1]["text"])
        self.assertNotIn("notes.txt", "\n".join(block.get("text", "") for block in blocks))


if __name__ == "__main__":
    unittest.main()
