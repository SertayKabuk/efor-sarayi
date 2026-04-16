import { useCallback, useRef, useState } from "react";
import { File04, UploadCloud01 } from "@untitledui/icons";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import Spinner from "@/components/ui/Spinner";
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
    <Card>
      <CardHeader>
        <CardTitle>Documents</CardTitle>
        <CardDescription>
          Upload project files to enrich the record with extracted scope,
          context, and supporting detail.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-5">
        {error && <Alert tone="error">{error}</Alert>}

        {documents.length > 0 && (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between rounded-2xl border border-secondary bg-secondary px-4 py-3 text-sm"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <Badge tone="neutral" className="uppercase">
                    {doc.filename.split(".").pop()}
                  </Badge>
                  <a
                    href={getDocumentDownloadUrl(projectId, doc.id)}
                    className="truncate font-medium text-brand-primary transition hover:text-brand-secondary"
                    download
                  >
                    {doc.filename}
                  </a>
                </div>
                <button
                  onClick={() => handleDelete(doc.id)}
                  disabled={deleting === doc.id}
                  className="ml-2 shrink-0 text-xs font-semibold text-error-primary transition hover:opacity-80 disabled:opacity-50"
                >
                  {deleting === doc.id ? "Removing..." : "Remove"}
                </button>
              </li>
            ))}
          </ul>
        )}

        <div className="rounded-3xl border border-dashed border-primary bg-secondary p-6">
          <div className="flex flex-col items-center justify-center text-center">
            <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-primary text-brand-primary">
              {uploading ? <Spinner className="text-brand-primary" /> : <UploadCloud01 className="size-6" />}
            </div>
            <h3 className="mt-4 text-base font-semibold text-primary">
              Upload additional documents
            </h3>
            <p className="mt-2 max-w-xl text-sm text-secondary">
              New files are sent to the analyzer and can update the project with
              additional scope or requirement details.
            </p>
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
              className="mt-5 inline-flex cursor-pointer items-center gap-2 rounded-xl border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary shadow-xs transition hover:bg-secondary"
            >
              <File04 className="size-5" />
              {uploading ? "Analyzing..." : "Upload Documents"}
            </label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
