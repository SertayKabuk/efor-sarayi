import { useCallback, useRef, useState } from "react";
import type { DocumentInfo } from "../types/project";
import {
  deleteDocument,
  getDocumentDownloadUrl,
  uploadDocuments,
} from "../api/client";

interface Props {
  projectId: string;
  documents: DocumentInfo[];
  onProjectUpdated: () => void;
}

const ACCEPTED = ".pdf,.docx,.doc,.odt,.rtf,.txt,.md,.xlsx,.xls,.csv,.pptx,.ppt";

export default function DocumentUpload({
  projectId,
  documents,
  onProjectUpdated,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (!files.length) return;

      setUploading(true);
      setError("");
      try {
        await uploadDocuments(projectId, files);
        onProjectUpdated();
      } catch {
        setError("Failed to upload documents. Check file types and size.");
      } finally {
        setUploading(false);
        if (fileRef.current) fileRef.current.value = "";
      }
    },
    [projectId, onProjectUpdated]
  );

  const handleDelete = useCallback(
    async (docId: string) => {
      setDeleting(docId);
      setError("");
      try {
        await deleteDocument(projectId, docId);
        onProjectUpdated();
      } catch {
        setError("Failed to delete document.");
      } finally {
        setDeleting(null);
      }
    },
    [projectId, onProjectUpdated]
  );

  return (
    <div className="bg-white p-6 rounded-lg shadow space-y-4">
      <h2 className="text-lg font-semibold text-gray-800">Documents</h2>
      <p className="text-xs text-gray-500">
        Upload project documents (PDF, DOCX, XLSX, PPTX, TXT, and more).
        Files are sent directly to the LLM for analysis and project info extraction.
      </p>

      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
          {error}
        </div>
      )}

      {documents.length > 0 && (
        <ul className="divide-y">
          {documents.map((doc) => (
            <li
              key={doc.id}
              className="flex items-center justify-between py-2 text-sm"
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="text-gray-400 shrink-0 uppercase text-xs">
                  {doc.filename.split(".").pop()}
                </span>
                <a
                  href={getDocumentDownloadUrl(projectId, doc.id)}
                  className="text-blue-600 hover:text-blue-800 truncate"
                  download
                >
                  {doc.filename}
                </a>
              </div>
              <button
                onClick={() => handleDelete(doc.id)}
                disabled={deleting === doc.id}
                className="text-red-600 hover:text-red-800 text-xs font-medium shrink-0 ml-2 disabled:opacity-50"
              >
                {deleting === doc.id ? "..." : "Remove"}
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <input
          ref={fileRef}
          type="file"
          accept={ACCEPTED}
          multiple
          onChange={handleUpload}
          className="hidden"
          id="doc-upload"
        />
        <label
          htmlFor="doc-upload"
          className={`inline-flex items-center gap-2 px-4 py-2 rounded text-sm font-medium cursor-pointer ${
            uploading
              ? "bg-gray-200 text-gray-500 cursor-wait"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {uploading ? (
            <>
              <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
              Analyzing...
            </>
          ) : (
            "Upload Documents"
          )}
        </label>
      </div>
    </div>
  );
}
