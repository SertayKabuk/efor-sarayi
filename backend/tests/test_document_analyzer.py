import base64
import importlib
import os
import tempfile
import unittest
from pathlib import Path
from zipfile import ZipFile

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
    def test_build_document_content_block_extracts_docx_text(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".docx", delete=False) as tmp:
            tmp_path = Path(tmp.name)

        with ZipFile(tmp_path, "w") as archive:
            archive.writestr(
                "word/document.xml",
                """<?xml version="1.0" encoding="UTF-8"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p><w:r><w:t>Hello</w:t></w:r></w:p>
    <w:p><w:r><w:t>World</w:t></w:r></w:p>
  </w:body>
</w:document>
""",
            )

        try:
            block = document_analyzer._build_document_content_block("requirements.docx", str(tmp_path))
        finally:
            tmp_path.unlink(missing_ok=True)

        self.assertEqual(block["type"], "input_text")
        self.assertIn("DOCUMENT: requirements.docx", block["text"])
        self.assertIn("Hello", block["text"])
        self.assertIn("World", block["text"])

    def test_build_document_content_block_keeps_pdf_as_input_file(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(b"%PDF-1.4\n")
            tmp_path = Path(tmp.name)

        try:
            block = document_analyzer._build_document_content_block("requirements.pdf", str(tmp_path))
        finally:
            tmp_path.unlink(missing_ok=True)

        self.assertEqual(block["type"], "input_file")
        self.assertEqual(block["filename"], "requirements.pdf")
        self.assertTrue(block["file_data"].startswith("data:application/pdf;base64,"))
        payload = block["file_data"].split(",", 1)[1]
        self.assertEqual(base64.b64decode(payload), b"%PDF-1.4\n")

    def test_build_document_content_block_rejects_legacy_doc(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".doc", delete=False) as tmp:
            tmp.write(b"legacy-doc-binary")
            tmp_path = Path(tmp.name)

        try:
            with self.assertRaises(document_analyzer.DocumentAnalysisError):
                document_analyzer._build_document_content_block("legacy.doc", str(tmp_path))
        finally:
            tmp_path.unlink(missing_ok=True)


if __name__ == "__main__":
    unittest.main()
