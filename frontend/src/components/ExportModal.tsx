import { useState } from "react";

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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h2 className="text-lg font-semibold text-gray-800">
            Export as Markdown
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>

        <div className="px-6 py-4 space-y-4 overflow-y-auto flex-1">
          {!markdown && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  AI Instructions (optional)
                </label>
                <p className="text-xs text-gray-500 mb-2">
                  Guide the AI export. For example: &quot;Focus on the
                  implementation plan&quot; or &quot;Write it as a client
                  proposal&quot;.
                </p>
                <textarea
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  rows={3}
                  className="w-full border rounded px-3 py-2 text-sm"
                  placeholder='e.g. Format this as a client-facing proposal, exclude internal risks...'
                />
              </div>

              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}

              <button
                onClick={handleGenerate}
                disabled={loading}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <span className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                    Generating...
                  </>
                ) : (
                  "Generate Markdown"
                )}
              </button>
            </>
          )}

          {markdown && (
            <>
              <pre className="bg-gray-50 border rounded p-4 text-sm text-gray-800 whitespace-pre-wrap overflow-y-auto max-h-[50vh]">
                {markdown}
              </pre>
              <div className="flex gap-3">
                <button
                  onClick={handleDownload}
                  className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
                >
                  Download .md
                </button>
                <button
                  onClick={handleCopy}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-300"
                >
                  Copy to Clipboard
                </button>
                <button
                  onClick={() => setMarkdown("")}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded text-sm font-medium hover:bg-gray-300"
                >
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
