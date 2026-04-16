import { useState } from "react";
import { Download04 } from "@untitledui/icons";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ModalDialog from "@/components/ui/ModalDialog";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import type { ExportMode } from "../types/project";

interface Props {
  onExport: (mode: ExportMode, customPrompt?: string) => Promise<string>;
  onClose: () => void;
  definitionsOptionLabel?: string;
}

export default function ExportModal({
  onExport,
  onClose,
  definitionsOptionLabel = "Export from current data",
}: Props) {
  const [mode, setMode] = useState<ExportMode>("ai");
  const [customPrompt, setCustomPrompt] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await onExport(
        mode,
        mode === "ai" ? customPrompt.trim() || undefined : undefined
      );
      setMarkdown(result);
    } catch {
      setError(
        mode === "ai"
          ? "Failed to generate the AI export."
          : "Failed to build the non-AI export."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download =
      mode === "ai" ? "export-with-ai.md" : "export-from-definitions.md";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(markdown);
  };

  return (
    <ModalDialog
      isOpen
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose();
      }}
      title="Export as Markdown"
      description="Choose whether to export with AI or build markdown directly from the current data."
      footer={
        markdown ? (
          <>
            <Button tone="secondary" onClick={() => setMarkdown("")}>
              Regenerate
            </Button>
            <Button tone="secondary" onClick={handleCopy}>
              Copy to Clipboard
            </Button>
            <Button iconLeading={Download04} onClick={handleDownload}>
              Download .md
            </Button>
          </>
        ) : undefined
      }
    >
      {!markdown ? (
        <div className="space-y-4">
          <Select
            label="Export method"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as ExportMode);
              setError("");
            }}
            hint={
              mode === "ai"
                ? "Use AI to rewrite the export into a polished markdown document."
                : "Build a structured markdown export directly from the current fields without using AI."
            }
          >
            <option value="ai">Export with AI</option>
            <option value="definitions">{definitionsOptionLabel}</option>
          </Select>

          {mode === "ai" && (
            <Textarea
              label="AI Instructions (optional)"
              hint="Guide the export, e.g. focus on the implementation plan or rewrite it as a client proposal."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              rows={4}
              placeholder="e.g. Format this as a client-facing proposal and exclude internal risks."
            />
          )}

          {error && <Alert tone="error">{error}</Alert>}

          <div className="flex justify-end">
            <Button onClick={handleGenerate} loading={loading}>
              {mode === "ai" ? "Generate with AI" : "Build from definitions"}
            </Button>
          </div>
        </div>
      ) : (
        <pre className="max-h-[50vh] overflow-y-auto rounded-2xl border border-secondary bg-secondary p-4 text-sm leading-6 whitespace-pre-wrap text-primary">
          {markdown}
        </pre>
      )}
    </ModalDialog>
  );
}
