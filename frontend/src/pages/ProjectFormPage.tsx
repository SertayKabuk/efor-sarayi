import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createProject,
  getProject,
  getDocuments,
  updateProject,
} from "../api/client";
import type { ProjectFormData, DocumentInfo } from "../types/project";
import ProjectForm from "../components/ProjectForm";
import DocumentUpload from "../components/DocumentUpload";

const emptyForm: ProjectFormData = {
  name: "",
  description: "",
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
};

export default function ProjectFormPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [projectId, setProjectId] = useState<string | undefined>(id);
  const [initialData, setInitialData] = useState<ProjectFormData>(emptyForm);
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [loading, setLoading] = useState(!!id);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadProject = useCallback(async (pid: string) => {
    try {
      const [project, docs] = await Promise.all([
        getProject(pid),
        getDocuments(pid),
      ]);
      setInitialData({
        name: project.name,
        description: project.description,
        modules: project.modules,
        integrations: project.integrations,
        requirements: project.requirements,
        tech_stack: project.tech_stack,
        duration_days: project.duration_days,
        effort_person_days: project.effort_person_days,
        complexity: project.complexity,
        constraints: project.constraints,
        implementation_plan: project.implementation_plan,
        team_composition: project.team_composition,
        assumptions: project.assumptions,
        risks: project.risks,
        questions: project.questions,
        notes: project.notes || "",
      });
      setDocuments(docs);
    } catch {
      setError("Failed to load project");
    }
  }, []);

  useEffect(() => {
    if (!id) return;
    loadProject(id).finally(() => setLoading(false));
  }, [id, loadProject]);

  const handleSubmit = async (data: ProjectFormData) => {
    setSaving(true);
    setError("");
    try {
      if (projectId) {
        await updateProject(projectId, data);
        navigate("/");
      } else {
        const created = await createProject(data);
        setProjectId(created.id);
        setInitialData(data);
      }
    } catch {
      setError("Failed to save project. Make sure the backend is running.");
    } finally {
      setSaving(false);
    }
  };

  const handleProjectUpdated = useCallback(() => {
    if (projectId) loadProject(projectId);
  }, [projectId, loadProject]);

  if (loading) return <p className="text-gray-500">Loading...</p>;

  return (
    <div className="max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">
        {id ? "Edit Project" : projectId ? "Project Created" : "Add Project"}
      </h1>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded">{error}</div>
      )}
      <ProjectForm
        initialData={initialData}
        onSubmit={handleSubmit}
        saving={saving}
      />
      {projectId && (
        <DocumentUpload
          projectId={projectId}
          documents={documents}
          onProjectUpdated={handleProjectUpdated}
        />
      )}
      {projectId && !id && (
        <div className="flex justify-end">
          <button
            onClick={() => navigate("/")}
            className="bg-gray-200 px-4 py-2 rounded text-sm font-medium hover:bg-gray-300"
          >
            Done
          </button>
        </div>
      )}
    </div>
  );
}
