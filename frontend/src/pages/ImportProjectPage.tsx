import { useCallback, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { File04, UploadCloud01 } from "@untitledui/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Textarea from "@/components/ui/Textarea";
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
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <p className="text-sm font-semibold text-brand-secondary">
          Document-powered onboarding
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight text-primary">
          Import project from documents
        </h1>
        <p className="mt-2 text-sm text-secondary">
          Upload one or more documents and let the app pre-fill the project
          record before you fine-tune the details.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload source material</CardTitle>
          <CardDescription>
            Supported formats: PDF, DOCX, DOC, ODT, RTF, TXT, MD, XLSX, XLS,
            CSV, PPTX, PPT.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && <Alert tone="error">{error}</Alert>}

          <div className="rounded-3xl border border-dashed border-primary bg-secondary p-8">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-primary text-brand-primary">
                <UploadCloud01 className="size-6" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-primary">
                Add project files
              </h2>
              <p className="mt-2 max-w-xl text-sm text-secondary">
                Specs, proposals, spreadsheets, or decks — toss them in here and
                the importer will synthesize them into a draft project record.
              </p>
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
                className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary shadow-xs transition hover:bg-secondary"
              >
                <File04 className="size-5" />
                Choose files
              </label>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-primary">
                  Selected documents
                </h3>
                <p className="text-xs text-tertiary">{files.length} file(s)</p>
              </div>
              <ul className="space-y-2">
                {files.map((file, i) => (
                  <li
                    key={`${file.name}-${i}`}
                    className="flex items-center justify-between rounded-2xl border border-secondary bg-secondary px-4 py-3 text-sm"
                  >
                    <div className="flex min-w-0 items-center gap-3">
                      <Badge tone="neutral" className="uppercase">
                        {file.name.split(".").pop()}
                      </Badge>
                      <span className="truncate text-primary">{file.name}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeFile(i)}
                      className="text-xs font-semibold text-error-primary transition hover:opacity-80"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <Textarea
            label="AI Instructions (optional)"
            hint="Guide the analysis, e.g. focus on backend scope or ignore a reporting section."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Prioritize payment and auth flows, and ignore the admin dashboard section."
          />

          <div className="flex justify-end">
            <Button onClick={handleImport} disabled={!files.length} loading={importing}>
              Import Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
