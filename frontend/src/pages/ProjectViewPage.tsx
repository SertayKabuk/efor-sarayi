import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { deleteProject, getDocuments, getProject } from "../api/client";
import { getDocumentDownloadUrl } from "../api/client";
import type { DocumentInfo, Project } from "../types/project";

const complexityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  very_high: "bg-red-100 text-red-800",
};

const impactColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

function TagList({ items, color }: { items: string[]; color: string }) {
  if (!items.length) return <span className="text-sm text-gray-400">--</span>;
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span key={item} className={`${color} px-2 py-0.5 rounded text-xs`}>
          {item}
        </span>
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
    await deleteProject(id);
    navigate("/");
  };

  if (loading)
    return <p className="text-gray-500">Loading...</p>;
  if (error || !project)
    return <div className="bg-red-50 text-red-700 p-4 rounded">{error || "Project not found"}</div>;

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{project.name}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-medium ${
                complexityColors[project.complexity] || ""
              }`}
            >
              {project.complexity}
            </span>
            <span className="text-sm text-gray-500">
              {project.duration_days} days
            </span>
            {project.effort_person_days > 0 && (
              <span className="text-sm text-gray-500">
                {project.effort_person_days} person-days
              </span>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Link
            to={`/projects/${project.id}/edit`}
            className="bg-blue-600 text-white px-4 py-1.5 rounded text-sm font-medium hover:bg-blue-700"
          >
            Edit
          </Link>
          <button
            onClick={handleDelete}
            className="bg-red-50 text-red-600 px-4 py-1.5 rounded text-sm font-medium hover:bg-red-100"
          >
            Delete
          </button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 space-y-5">
        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase mb-1">Description</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>

        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase mb-1">Modules</h2>
          <TagList items={project.modules} color="bg-purple-50 text-purple-700" />
        </div>

        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase mb-1">Integrations</h2>
          <TagList items={project.integrations} color="bg-amber-50 text-amber-700" />
        </div>

        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase mb-1">Requirements</h2>
          <TagList items={project.requirements} color="bg-teal-50 text-teal-700" />
        </div>

        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase mb-1">Tech Stack</h2>
          <TagList items={project.tech_stack} color="bg-blue-50 text-blue-700" />
        </div>

        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase mb-1">Constraints</h2>
          <TagList items={project.constraints} color="bg-red-50 text-red-700" />
        </div>

        <div>
          <h2 className="text-xs font-medium text-gray-500 uppercase mb-1">Team Composition</h2>
          <TagList items={project.team_composition} color="bg-indigo-50 text-indigo-700" />
        </div>
      </div>

      {/* Implementation Plan */}
      {project.implementation_plan.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Implementation Plan</h2>
          <div className="space-y-3">
            {project.implementation_plan.map((phase, i) => (
              <div key={i} className="border rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">
                    {phase.phase}
                  </span>
                  <span className="text-xs text-gray-500">
                    {phase.effort_days} person-days
                  </span>
                </div>
                {phase.tasks.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5 mt-1">
                    {phase.tasks.map((task, ti) => (
                      <li key={ti}>{task}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div className="text-right text-sm font-medium text-gray-700 pt-1 border-t">
              Total: {project.implementation_plan.reduce((sum, p) => sum + p.effort_days, 0)} person-days
            </div>
          </div>
        </div>
      )}

      {/* Assumptions */}
      {project.assumptions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Assumptions</h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {project.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {project.risks.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Risks</h2>
          <div className="space-y-2">
            {project.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 mt-0.5 ${
                    impactColors[risk.impact] || ""
                  }`}
                >
                  {risk.impact}
                </span>
                <span className="text-gray-700">{risk.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions & Ambiguities */}
      {project.questions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Questions & Ambiguities</h2>
          <ul className="space-y-2">
            {project.questions.map((q, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-blue-500 shrink-0 mt-0.5">?</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {project.notes && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xs font-medium text-gray-500 uppercase mb-1">Notes</h2>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-line">
            {project.notes}
          </p>
        </div>
      )}

      {documents.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Documents</h2>
          <ul className="divide-y">
            {documents.map((doc) => (
              <li key={doc.id} className="flex items-center gap-2 py-2 text-sm">
                <span className="text-gray-400 shrink-0 uppercase text-xs">
                  {doc.filename.split(".").pop()}
                </span>
                <a
                  href={getDocumentDownloadUrl(project.id, doc.id)}
                  className="text-blue-600 hover:text-blue-800 truncate"
                  download
                >
                  {doc.filename}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
