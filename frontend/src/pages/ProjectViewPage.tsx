import { useEffect, useRef, useState } from "react";
import { Download04, File04 } from "@untitledui/icons";
import { Link, useNavigate, useParams } from "react-router-dom";
import Alert from "@/components/ui/Alert";
import Badge, { type BadgeTone } from "@/components/ui/Badge";
import Button, { buttonStyles } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import { deleteProject, exportProject, getDocuments, getProject } from "../api/client";
import { getDocumentDownloadUrl } from "../api/client";
import type { DocumentInfo, Project } from "../types/project";
import ExportModal from "../components/ExportModal";
import ImplementationPlanGantt from "../components/ImplementationPlanGantt";
import ProjectPdfDocument from "../components/ProjectPdfDocument";
import ProjectAiChat from "../components/ProjectAiChat";
import { buildPdfFilename, downloadElementAsPdf } from "../utils/pdf";

const complexityColors: Record<string, BadgeTone> = {
  low: "success",
  medium: "warning",
  high: "orange",
  very_high: "danger",
};

const impactColors: Record<string, BadgeTone> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

function TagList({ items, tone }: { items: string[]; tone: BadgeTone }) {
  if (!items.length) return <span className="text-sm text-tertiary">—</span>;
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <Badge key={item} tone={tone}>
          {item}
        </Badge>
      ))}
    </div>
  );
}

export default function ProjectViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [pdfError, setPdfError] = useState("");
  const [pdfLoading, setPdfLoading] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const pdfContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!id) return;
    Promise.all([getProject(id), getDocuments(id)])
      .then(([p, d]) => {
        setProject(p);
        setDocuments(d);
      })
      .catch(() => setError("Failed to load project"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleDelete = async () => {
    if (!id || !confirm("Delete this project?")) return;
    try {
      await deleteProject(id);
      navigate("/");
    } catch {
      setError("Failed to delete project");
    }
  };

  const handleDownloadPdf = async () => {
    if (!project || !pdfContentRef.current) return;

    setPdfLoading(true);
    setPdfError("");

    try {
      await downloadElementAsPdf(pdfContentRef.current, buildPdfFilename(project.name));
    } catch {
      setPdfError("Failed to generate the PDF export.");
    } finally {
      setPdfLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="px-6 py-5 text-sm text-secondary">
          Loading project details...
        </CardContent>
      </Card>
    );
  }

  if (error || !project) {
    return <Alert tone="error">{error || "Project not found"}</Alert>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {pdfError && <Alert tone="error">{pdfError}</Alert>}

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-sm font-semibold text-brand-secondary">
                Project record
              </p>
              <CardTitle className="mt-1 text-3xl">{project.name}</CardTitle>
              <CardDescription className="mt-2 max-w-3xl whitespace-pre-line">
                {project.description}
              </CardDescription>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <Badge tone={complexityColors[project.complexity] || "neutral"}>
                  {project.complexity}
                </Badge>
                <Badge tone="neutral">{project.duration_days} days</Badge>
                {project.effort_person_days > 0 && (
                  <Badge tone="purple">{project.effort_person_days} person-days</Badge>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button
                tone="secondary"
                size="sm"
                iconLeading={Download04}
                onClick={handleDownloadPdf}
                loading={pdfLoading}
              >
                PDF
              </Button>
              <Button tone="success" size="sm" iconLeading={Download04} onClick={() => setShowExport(true)}>
                Export
              </Button>
              <Link
                to={`/projects/${project.id}/edit`}
                className={buttonStyles({ tone: "secondary", size: "sm" })}
              >
                Edit
              </Link>
              <Button tone="destructive" size="sm" onClick={handleDelete}>
                Delete
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5 md:grid-cols-2">
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Modules</h2>
            <TagList items={project.modules} tone="purple" />
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Integrations</h2>
            <TagList items={project.integrations} tone="orange" />
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Requirements</h2>
            <TagList items={project.requirements} tone="teal" />
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Tech Stack</h2>
            <TagList items={project.tech_stack} tone="blue" />
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Constraints</h2>
            <TagList items={project.constraints} tone="danger" />
          </div>
          <div>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-tertiary">Team Composition</h2>
            <TagList items={project.team_composition} tone="indigo" />
          </div>
        </CardContent>
      </Card>

      <ProjectAiChat project={project} documents={documents} />

      {project.implementation_plan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Implementation plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <ImplementationPlanGantt phases={project.implementation_plan} />
            {project.implementation_plan.map((phase, i) => (
              <div key={i} className="rounded-2xl border border-secondary bg-secondary p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-primary">
                    {phase.phase}
                  </span>
                  <Badge tone="purple">
                    {phase.effort_days} person-days
                  </Badge>
                </div>
                {phase.tasks.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
                    {phase.tasks.map((task, ti) => (
                      <li key={ti}>{task}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {project.assumptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
            {project.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          </CardContent>
        </Card>
      )}

      {project.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {project.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Badge
                  tone={impactColors[risk.impact] || "neutral"}
                  className="mt-0.5 shrink-0"
                >
                  {risk.impact}
                </Badge>
                <span className="text-secondary">{risk.description}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {project.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Questions & Ambiguities</CardTitle>
          </CardHeader>
          <CardContent>
          <ul className="space-y-2">
            {project.questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-secondary">
                <span className="mt-0.5 shrink-0 text-brand-primary">?</span>
                {q}
              </li>
            ))}
          </ul>
          </CardContent>
        </Card>
      )}

      {project.notes && (
        <Card>
          <CardHeader>
            <CardTitle>Notes</CardTitle>
          </CardHeader>
          <CardContent>
          <p className="whitespace-pre-line text-sm leading-6 text-secondary">
            {project.notes}
          </p>
          </CardContent>
        </Card>
      )}

      {documents.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
          </CardHeader>
          <CardContent>
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center gap-3 rounded-2xl border border-secondary bg-secondary px-4 py-3 text-sm"
              >
                <div className="flex size-9 items-center justify-center rounded-xl bg-primary text-brand-primary">
                  <File04 className="size-4.5" />
                </div>
                <a
                  href={getDocumentDownloadUrl(project.id, doc.id)}
                  className="truncate font-medium text-brand-primary transition hover:text-brand-secondary"
                  download
                >
                  {doc.filename}
                </a>
                <Badge tone="neutral" className="ml-auto uppercase">
                  {doc.filename.split(".").pop()}
                </Badge>
              </li>
            ))}
          </ul>
          </CardContent>
        </Card>
      )}

      {showExport && (
        <ExportModal
          onExport={(mode, customPrompt) => exportProject(project, mode, customPrompt)}
          definitionsOptionLabel="Export from project definitions"
          onClose={() => setShowExport(false)}
        />
      )}

      <div
        aria-hidden="true"
        className="pointer-events-none fixed top-0"
        style={{ left: "-200vw" }}
      >
        <div ref={pdfContentRef}>
          <ProjectPdfDocument project={project} documents={documents} />
        </div>
      </div>
    </div>
  );
}
