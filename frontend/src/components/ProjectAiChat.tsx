import { useMemo, useState } from "react";
import { chatWithProject } from "@/api/client";
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
import Spinner from "@/components/ui/Spinner";
import Textarea from "@/components/ui/Textarea";
import type {
  DocumentInfo,
  Project,
  ProjectChatMessage,
  ProjectChatRole,
} from "@/types/project";

interface ProjectAiChatProps {
  project: Project;
  documents: DocumentInfo[];
}

interface ChatUiMessage extends ProjectChatMessage {
  id: string;
  createdAt: string;
}

const starterQuestions = [
  "What are the biggest delivery risks in this project?",
  "Summarize the implementation plan into a short executive update.",
  "Which assumptions should we validate first with the customer?",
];

function createChatMessage(role: ProjectChatRole, content: string): ChatUiMessage {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    createdAt: new Date().toISOString(),
  };
}

function formatTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export default function ProjectAiChat({ project, documents }: ProjectAiChatProps) {
  const [messages, setMessages] = useState<ChatUiMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const documentNames = useMemo(
    () => documents.map((document) => document.filename),
    [documents],
  );

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed || loading) return;

    const userMessage = createChatMessage("user", trimmed);
    const history: ProjectChatMessage[] = messages.map(({ role, content }) => ({
      role,
      content,
    }));

    setMessages((current) => [...current, userMessage]);
    setDraft("");
    setError("");
    setLoading(true);

    try {
      const response = await chatWithProject(project.id, {
        message: trimmed,
        history,
        include_documents: true,
      });

      setMessages((current) => [
        ...current,
        createChatMessage("assistant", response.answer),
      ]);
    } catch (caughtError) {
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : "Failed to chat with Project AI.",
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLTextAreaElement> = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault();
      void handleSend();
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <CardTitle>Project AI Chat</CardTitle>
            <CardDescription>
              Ask follow-up questions using the generated project record and uploaded
              documents as context.
            </CardDescription>
          </div>

          {messages.length > 0 && (
            <Button tone="secondary" size="sm" onClick={() => setMessages([])}>
              Clear conversation
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge tone="brand">Generated project info</Badge>
          <Badge tone={documentNames.length > 0 ? "teal" : "neutral"}>
            {documentNames.length} uploaded documents
          </Badge>
          <Badge tone="purple">{project.tech_stack.length || 0} tech stack tags</Badge>
        </div>

        {documentNames.length > 0 ? (
          <div className="space-y-2">
            <p className="text-sm font-medium text-primary">Included documents</p>
            <div className="flex flex-wrap gap-2">
              {documentNames.map((filename) => (
                <Badge key={filename} tone="neutral">
                  {filename}
                </Badge>
              ))}
            </div>
          </div>
        ) : (
          <Alert tone="info">
            This project has no uploaded documents yet, so Project AI will answer using the
            generated project information only.
          </Alert>
        )}

        <div className="space-y-3 rounded-3xl border border-secondary bg-secondary/50 p-4">
          <div className="max-h-[32rem] space-y-3 overflow-y-auto pr-1">
            {messages.length === 0 ? (
              <div className="space-y-3 rounded-2xl border border-dashed border-secondary bg-primary px-4 py-5 text-sm text-secondary">
                <p className="font-medium text-primary">
                  Start a conversation about scope, risks, delivery, assumptions, or what the
                  uploaded files actually imply.
                </p>
                <ul className="list-disc space-y-1 pl-5">
                  {starterQuestions.map((question) => (
                    <li key={question}>{question}</li>
                  ))}
                </ul>
              </div>
            ) : (
              messages.map((message) => (
                <div
                  key={message.id}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={
                      message.role === "user"
                        ? "max-w-3xl rounded-3xl border border-brand bg-brand-primary px-4 py-3 text-sm text-primary"
                        : "max-w-3xl rounded-3xl border border-secondary bg-primary px-4 py-3 text-sm text-primary"
                    }
                  >
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">
                      <span>{message.role === "user" ? "You" : "Project AI"}</span>
                      <span>{formatTime(message.createdAt)}</span>
                    </div>
                    <p className="whitespace-pre-line leading-6">{message.content}</p>
                  </div>
                </div>
              ))
            )}

            {loading && (
              <div className="flex justify-start">
                <div className="flex max-w-3xl items-center gap-3 rounded-3xl border border-secondary bg-primary px-4 py-3 text-sm text-secondary">
                  <Spinner size="sm" />
                  <span>Project AI is thinking through the docs and project details…</span>
                </div>
              </div>
            )}
          </div>

          {error && <Alert tone="error">{error}</Alert>}

          <Textarea
            label="Ask Project AI"
            hint="Press Ctrl+Enter (or Cmd+Enter) to send quickly."
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={handleKeyDown}
            rows={5}
            className="min-h-32"
            placeholder="e.g. Which project risks are most likely to impact the timeline, and what evidence in the uploaded documents supports that?"
          />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-tertiary">
              Answers are grounded in the project record and the uploaded files listed above.
            </p>
            <Button onClick={() => void handleSend()} loading={loading} disabled={!draft.trim()}>
              Ask AI
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
