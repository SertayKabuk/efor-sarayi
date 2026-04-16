import { Folder, Plus } from "@untitledui/icons";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Alert from "@/components/ui/Alert";
import { buttonStyles } from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
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
    return (
      <Card>
        <CardContent className="flex items-center gap-3 px-6 py-5 text-sm text-secondary">
          <Folder className="size-5 text-brand-primary" />
          Loading projects...
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-brand-secondary">
            Project intelligence
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-primary">
            Past projects
          </h1>
          <p className="mt-2 text-sm text-secondary">
            Search your delivery history, compare complexity, and reuse team
            knowledge before the next estimate goes full crystal ball.
          </p>
        </div>
        <Link
          to="/projects/new"
          className={buttonStyles({ tone: "primary", className: "w-fit" })}
        >
          <Plus className="size-5" />
          Add Project
        </Link>
      </div>

      {error && <Alert tone="error">{error}</Alert>}

      {projects.length === 0 ? (
        <Card>
          <CardHeader className="items-center text-center">
            <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-brand-primary text-brand-primary">
              <Folder className="size-6" />
            </div>
            <CardTitle className="mt-4">No projects recorded yet</CardTitle>
            <CardDescription>
              Add your first delivery to start building an estimation dataset
              that is a little more scientific and a lot less vibes-based.
            </CardDescription>
          </CardHeader>
        </Card>
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
            <Card>
              <CardContent className="px-6 py-10 text-center text-sm text-secondary">
                No projects match the current filters.
              </CardContent>
            </Card>
          ) : (
            <ProjectTable projects={filtered} onDelete={handleDelete} />
          )}
        </>
      )}
    </div>
  );
}
