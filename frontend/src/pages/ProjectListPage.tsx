import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { getProjects, deleteProject } from "../api/client";
import type { Project } from "../types/project";
import ProjectTable from "../components/ProjectTable";
import ProjectFilters from "../components/ProjectFilters";

export default function ProjectListPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [complexity, setComplexity] = useState("");
  const [techStack, setTechStack] = useState("");

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const data = await getProjects();
      setProjects(data);
    } catch {
      setError("Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this project?")) return;
    try {
      await deleteProject(id);
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch {
      setError("Failed to delete project");
    }
  };

  const filtered = useMemo(() => {
    let result = projects;
    if (search) {
      const q = search.toLowerCase();
      result = result.filter((p) => p.name.toLowerCase().includes(q));
    }
    if (complexity) {
      result = result.filter((p) => p.complexity === complexity);
    }
    if (techStack) {
      result = result.filter((p) => p.tech_stack.includes(techStack));
    }
    return result;
  }, [projects, search, complexity, techStack]);

  if (loading) {
    return <p className="text-gray-500">Loading projects...</p>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Past Projects</h1>
        <Link
          to="/projects/new"
          className="bg-blue-600 text-white px-4 py-2 rounded text-sm font-medium hover:bg-blue-700"
        >
          + Add Project
        </Link>
      </div>
      {error && (
        <div className="bg-red-50 text-red-700 p-3 rounded mb-4">{error}</div>
      )}
      {projects.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <p className="text-lg mb-2">No projects recorded yet</p>
          <p className="text-sm">
            Add your first project to start building your estimation database.
          </p>
        </div>
      ) : (
        <>
          <ProjectFilters
            projects={projects}
            search={search}
            complexity={complexity}
            techStack={techStack}
            onSearchChange={setSearch}
            onComplexityChange={setComplexity}
            onTechStackChange={setTechStack}
          />
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-gray-400 text-sm">
              No projects match the current filters.
            </div>
          ) : (
            <ProjectTable projects={filtered} onDelete={handleDelete} />
          )}
        </>
      )}
    </div>
  );
}
