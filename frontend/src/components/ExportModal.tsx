import { useState } from "react";
import { Download04 } from "@untitledui/icons";
import Alert from "@/components/ui/Alert";
import Button from "@/components/ui/Button";
import ModalDialog from "@/components/ui/ModalDialog";
import Textarea from "@/components/ui/Textarea";

interface Props {
  onExport: (customPrompt: string) => Promise<string>;
  onClose: () => void;
}

export default function ExportModal({ onExport, onClose }: Props) {
  const [customPrompt, setCustomPrompt] = useState("");
  const [markdown, setMarkdown] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await onExport(customPrompt);
      setMarkdown(result);
    } catch {
      setError("Failed to generate export.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "export.md";
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
      description="Generate a shareable markdown snapshot of the current project or estimate."
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
          <Textarea
            label="AI Instructions (optional)"
            hint="Guide the export, e.g. focus on the implementation plan or rewrite it as a client proposal."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={4}
            placeholder="e.g. Format this as a client-facing proposal and exclude internal risks."
          />

          {error && <Alert tone="error">{error}</Alert>}

          <div className="flex justify-end">
            <Button onClick={handleGenerate} loading={loading}>
              Generate Markdown
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
