import base64
import importlib
import os
import tempfile
import unittest
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

document_analyzer = importlib.import_module("app.services.document_analyzer")


class DocumentAnalyzerMimeTests(unittest.TestCase):
    def test_guess_supported_mime_type_for_docx(self) -> None:
        mime = document_analyzer._guess_supported_mime_type("requirements.docx")

        self.assertEqual(
            mime,
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        )

    def test_build_file_content_block_uses_docx_data_url(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp.write(b"docx-bytes")
            tmp_path = Path(tmp.name)

        try:
            block = document_analyzer._build_file_content_block("requirements.docx", str(tmp_path))
        finally:
            tmp_path.unlink(missing_ok=True)

        self.assertEqual(block["type"], "input_file")
        self.assertEqual(block["filename"], "requirements.docx")
        self.assertTrue(
            block["file_data"].startswith(
                "data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,"
            )
        )
        payload = block["file_data"].split(",", 1)[1]
        self.assertEqual(base64.b64decode(payload), b"docx-bytes")

    def test_guess_supported_mime_type_raises_for_unknown_extension(self) -> None:
        with self.assertRaises(ValueError):
            document_analyzer._guess_supported_mime_type("archive.unknown")


if __name__ == "__main__":
    unittest.main()
