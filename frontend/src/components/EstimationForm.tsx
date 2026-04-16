import { useRef, useState } from "react";
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
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";
import type { EstimationRequest } from "../types/project";
import { extractFromDocuments } from "../api/client";
import TagInput from "./TagInput";

const ALLOWED_EXTENSIONS = [
  ".pdf", ".docx", ".doc", ".odt", ".rtf", ".txt", ".md",
  ".xlsx", ".xls", ".csv", ".pptx", ".ppt",
];

interface Props {
  onSubmit: (data: EstimationRequest) => void;
  loading: boolean;
}

export default function EstimationForm({ onSubmit, loading }: Props) {
  const [form, setForm] = useState<EstimationRequest>({
    name: "",
    description: "",
    modules: [],
    integrations: [],
    requirements: [],
    tech_stack: [],
    complexity: "medium",
    constraints: [],
    notes: "",
    custom_prompt: "",
  });
  const [files, setFiles] = useState<File[]>([]);
  const [extracting, setExtracting] = useState(false);
  const [extractError, setExtractError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const updateList = (field: keyof EstimationRequest) => (values: string[]) => {
    setForm((prev) => ({ ...prev, [field]: values }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleExtract = async () => {
    if (files.length === 0) return;
    setExtracting(true);
    setExtractError("");
    try {
      const extracted = await extractFromDocuments(files, form.custom_prompt || undefined);
      setForm({
        name: extracted.name || form.name,
        description: extracted.description || form.description,
        modules: extracted.modules?.length ? extracted.modules : form.modules,
        integrations: extracted.integrations?.length ? extracted.integrations : form.integrations,
        requirements: extracted.requirements?.length ? extracted.requirements : form.requirements,
        tech_stack: extracted.tech_stack?.length ? extracted.tech_stack : form.tech_stack,
        complexity: extracted.complexity || form.complexity,
        constraints: extracted.constraints?.length ? extracted.constraints : form.constraints,
        notes: extracted.notes || form.notes,
        custom_prompt: form.custom_prompt,
      });
    } catch {
      setExtractError("Failed to extract project info from documents.");
    } finally {
      setExtracting(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Upload documents</CardTitle>
          <CardDescription>
            Add specs or requirements docs to auto-fill the form below.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="rounded-3xl border border-dashed border-primary bg-secondary p-6">
            <div className="flex flex-col items-center justify-center text-center">
              <div className="flex size-14 items-center justify-center rounded-2xl bg-brand-primary text-brand-primary">
                {extracting ? <Spinner className="text-brand-primary" /> : <UploadCloud01 className="size-6" />}
              </div>
              <h2 className="mt-4 text-base font-semibold text-primary">
                Upload source files
              </h2>
              <p className="mt-2 max-w-xl text-sm text-secondary">
                Feed the estimator project documentation and let it pre-populate
                scope, modules, requirements, and notes.
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept={ALLOWED_EXTENSIONS.join(",")}
                onChange={handleFileChange}
                className="hidden"
                id="estimate-upload"
              />
              <label
                htmlFor="estimate-upload"
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
                      className="ml-2 text-xs font-semibold text-error-primary transition hover:opacity-80"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {extractError && <Alert tone="error">{extractError}</Alert>}

          {files.length > 0 && (
            <div className="flex justify-end">
              <Button type="button" tone="secondary" onClick={handleExtract} loading={extracting}>
                Extract & Fill Form
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>AI Instructions (optional)</CardTitle>
          <CardDescription>
            Guide the AI analysis, e.g. focus on backend modules or ignore a
            reporting section.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            name="custom_prompt"
            value={form.custom_prompt}
            onChange={handleChange}
            rows={4}
            placeholder="e.g. Focus on the payment and auth modules, and ignore the admin dashboard section."
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Project details</CardTitle>
          <CardDescription>
            Review and adjust the extracted scope before generating the effort estimate.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Input
            name="name"
            label="Project Name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="Online Marketplace"
          />

          <Textarea
            name="description"
            label="Description"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Describe what the project will involve..."
          />

          <TagInput
            label="Modules"
            placeholder="e.g. Auth System, Payment Gateway, Admin Dashboard"
            tags={form.modules}
            onChange={updateList("modules")}
          />

          <TagInput
            label="Integrations"
            placeholder="e.g. Stripe, SAP, SendGrid"
            tags={form.integrations}
            onChange={updateList("integrations")}
          />

          <TagInput
            label="Requirements"
            placeholder="e.g. HIPAA compliance, 99.9% uptime"
            tags={form.requirements}
            onChange={updateList("requirements")}
          />

          <TagInput
            label="Tech Stack"
            placeholder="e.g. React, FastAPI, PostgreSQL"
            tags={form.tech_stack}
            onChange={updateList("tech_stack")}
          />

          <Select
            name="complexity"
            label="Complexity"
            value={form.complexity}
            onChange={handleChange}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="very_high">Very High</option>
          </Select>

          <TagInput
            label="Constraints"
            placeholder="e.g. Legacy DB integration, Go-live before Q4"
            tags={form.constraints}
            onChange={updateList("constraints")}
          />

          <Textarea
            name="notes"
            label="Notes (optional)"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional context..."
          />

          <div className="flex justify-end border-t border-secondary pt-2">
            <Button type="submit" loading={loading}>
              Get Effort Estimate
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
