import importlib
import os
import tempfile
import unittest
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
from zipfile import ZipFile

from markitdown import FileConversionException

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


def _make_pdf(text: str) -> bytes:
    stream = f"BT /F1 12 Tf 72 720 Td ({text}) Tj ET".encode("ascii")
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
        b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>",
        b"<< /Length " + str(len(stream)).encode("ascii") + b" >>\nstream\n" + stream + b"\nendstream",
        b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
    ]
    data = bytearray(b"%PDF-1.4\n")
    offsets = [0]
    for number, body in enumerate(objects, start=1):
        offsets.append(len(data))
        data.extend(f"{number} 0 obj\n".encode("ascii"))
        data.extend(body)
        data.extend(b"\nendobj\n")

    xref = len(data)
    data.extend(f"xref\n0 {len(objects) + 1}\n".encode("ascii"))
    data.extend(b"0000000000 65535 f \n")
    for offset in offsets[1:]:
        data.extend(f"{offset:010d} 00000 n \n".encode("ascii"))
    data.extend(
        f"trailer\n<< /Size {len(objects) + 1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF\n".encode(
            "ascii"
        )
    )
    return bytes(data)


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

    def test_build_document_content_block_extracts_pdf_text(self) -> None:
        with tempfile.NamedTemporaryFile(suffix=".pdf", delete=False) as tmp:
            tmp.write(_make_pdf("Hello PDF"))
            tmp_path = Path(tmp.name)

        try:
            block = document_analyzer._build_document_content_block("requirements.pdf", str(tmp_path))
        finally:
            tmp_path.unlink(missing_ok=True)

        self.assertEqual(block["type"], "input_text")
        self.assertIn("DOCUMENT: requirements.pdf", block["text"])
        self.assertIn("Hello PDF", block["text"])

    def test_markitdown_conversion_error_becomes_document_analysis_error(self) -> None:
        with patch.object(
            document_analyzer._MARKITDOWN,
            "convert_local",
            side_effect=FileConversionException("invalid package"),
        ):
            with self.assertRaisesRegex(
                document_analyzer.DocumentAnalysisError,
                r"Could not convert 'requirements\.docx': invalid package",
            ):
                document_analyzer._extract_with_markitdown(
                    "requirements.docx", Path("requirements.docx")
                )

    def test_markitdown_empty_output_reports_ocr_is_disabled(self) -> None:
        with patch.object(
            document_analyzer._MARKITDOWN,
            "convert_local",
            return_value=SimpleNamespace(markdown=""),
        ):
            with self.assertRaisesRegex(
                document_analyzer.DocumentAnalysisError,
                r"No readable text.*OCR is not enabled",
            ):
                document_analyzer._extract_with_markitdown(
                    "scanned.pdf", Path("scanned.pdf")
                )

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
