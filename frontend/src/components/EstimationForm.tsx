import { useRef, useState } from "react";
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
    <form
      onSubmit={handleSubmit}
      className="space-y-4 bg-white p-6 rounded-lg shadow"
    >
      {/* Step 1: Document Upload */}
      <div className="border-b pb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          Upload Documents
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Upload project specs or requirements docs to auto-fill the form below.
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ALLOWED_EXTENSIONS.join(",")}
          onChange={handleFileChange}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        {files.length > 0 && (
          <ul className="mt-2 space-y-1">
            {files.map((file, i) => (
              <li
                key={`${file.name}-${i}`}
                className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded text-sm"
              >
                <span className="truncate text-gray-700">{file.name}</span>
                <button
                  type="button"
                  onClick={() => removeFile(i)}
                  className="text-red-500 hover:text-red-700 ml-2 text-xs font-medium"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
        {files.length > 0 && (
          <button
            type="button"
            onClick={handleExtract}
            disabled={extracting}
            className="mt-3 bg-purple-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
          >
            {extracting ? "Extracting..." : "Extract & Fill Form"}
          </button>
        )}
        {extractError && (
          <p className="mt-2 text-sm text-red-600">{extractError}</p>
        )}
      </div>

      {/* Custom AI Instructions */}
      <div className="border-b pb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-1">
          AI Instructions (optional)
        </h2>
        <p className="text-xs text-gray-500 mb-3">
          Guide the AI analysis. For example: &quot;Focus only on the backend
          modules&quot; or &quot;Ignore the reporting section&quot;.
        </p>
        <textarea
          name="custom_prompt"
          value={form.custom_prompt}
          onChange={handleChange}
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="e.g. We only focus on the payment and auth modules, ignore the admin dashboard section..."
        />
      </div>

      {/* Step 2: Review / Edit */}
      <h2 className="text-lg font-semibold text-gray-800">Project Details</h2>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Name
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Online Marketplace"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Describe what the project will involve..."
        />
      </div>

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

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Complexity
        </label>
        <select
          name="complexity"
          value={form.complexity}
          onChange={handleChange}
          className="w-full border rounded px-3 py-2 text-sm"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="very_high">Very High</option>
        </select>
      </div>

      <TagInput
        label="Constraints"
        placeholder="e.g. Legacy DB integration, Go-live before Q4"
        tags={form.constraints}
        onChange={updateList("constraints")}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Any additional context..."
        />
      </div>

      {/* Step 3: Estimate */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-600 text-white px-6 py-2.5 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? "Estimating..." : "Get Effort Estimate"}
      </button>
    </form>
  );
}
