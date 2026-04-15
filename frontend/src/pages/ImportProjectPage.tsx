import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createProject, uploadDocuments } from "../api/client";
import type { DocumentInfo } from "../types/project";

const ACCEPTED = ".pdf,.docx,.doc,.odt,.rtf,.txt,.md,.xlsx,.xls,.csv,.pptx,.ppt";

export default function ImportProjectPage() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [customPrompt, setCustomPrompt] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");

  const addFiles = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    setFiles((prev) => [...prev, ...selected]);
    if (fileRef.current) fileRef.current.value = "";
  }, []);

  const removeFile = useCallback((index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const handleImport = async () => {
    if (!files.length) return;

    setImporting(true);
    setError("");
    try {
      // create a placeholder project first
      const project = await createProject({
        name: "Importing...",
        description: "Extracting from documents...",
        modules: [],
        integrations: [],
        requirements: [],
        tech_stack: [],
        duration_days: 1,
        effort_person_days: 0,
        complexity: "medium",
        constraints: [],
        implementation_plan: [],
        team_composition: [],
        assumptions: [],
        risks: [],
        questions: [],
        notes: "",
      });

      // upload documents - this triggers AI extraction and updates the project
      await uploadDocuments(project.id, files, customPrompt || undefined);
      navigate(`/projects/${project.id}/edit`);
    } catch {
      setError("Failed to import project. Check file types and try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">
        Import Project from Documents
      </h1>
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <p className="text-sm text-gray-600">
          Upload one or more project documents. The system will analyze all
          documents and automatically extract project information.
          <br />
          <span className="text-xs text-gray-400">
            Supported: PDF, DOCX, DOC, ODT, RTF, TXT, MD, XLSX, XLS, CSV, PPTX, PPT
          </span>
        </p>

        {error && (
          <div className="bg-red-50 text-red-700 p-3 rounded text-sm">
            {error}
          </div>
        )}

        {files.length > 0 && (
          <ul className="divide-y">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between py-2 text-sm"
              >
                <span className="text-gray-800 truncate">{file.name}</span>
                <button
                  onClick={() => removeFile(i)}
                  className="text-red-600 hover:text-red-800 text-xs font-medium ml-2"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            AI Instructions (optional)
          </label>
          <p className="text-xs text-gray-500 mb-2">
            Guide the AI analysis. For example: &quot;Focus only on the backend
            modules&quot; or &quot;Ignore the reporting section&quot;.
          </p>
          <textarea
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
            className="w-full border rounded px-3 py-2 text-sm"
            placeholder="e.g. We only focus on the payment and auth modules, ignore the admin dashboard section..."
          />
        </div>

        <div className="flex gap-3">
          <div>
            <input
              ref={fileRef}
              type="file"
              accept={ACCEPTED}
              multiple
              onChange={addFiles}
              className="hidden"
              id="import-upload"
            />
            <label
              htmlFor="import-upload"
              className="inline-flex items-center px-4 py-2 rounded text-sm font-medium cursor-pointer bg-gray-200 hover:bg-gray-300"
            >
              Add Files
            </label>
          </div>

          <button
            onClick={handleImport}
            disabled={!files.length || importing}
            className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {importing ? (
              <>
                <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                Analyzing...
              </>
            ) : (
              "Import Project"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
