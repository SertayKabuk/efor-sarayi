import { Link } from "react-router-dom";
import Badge from "@/components/ui/Badge";
import type { Project } from "../types/project";

interface Props {
  projects: Project[];
  onDelete: (id: string) => void;
}

const complexityColors: Record<string, string> = {
  low: "success",
  medium: "warning",
  high: "orange",
  very_high: "danger",
};

export default function ProjectTable({ projects, onDelete }: Props) {
  return (
    <div className="overflow-hidden rounded-3xl border border-secondary bg-primary shadow-sm">
      <table className="w-full min-w-[760px] text-sm">
        <thead>
          <tr className="border-b border-secondary bg-secondary text-left text-xs uppercase tracking-[0.08em] text-tertiary">
            <th className="px-4 py-3 font-semibold">Name</th>
            <th className="px-4 py-3 font-semibold">Modules</th>
            <th className="px-4 py-3 font-semibold">Tech Stack</th>
            <th className="px-4 py-3 font-semibold">Complexity</th>
            <th className="px-4 py-3 font-semibold">Duration</th>
            <th className="px-4 py-3 font-semibold">Effort</th>
            <th className="px-4 py-3 font-semibold">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b border-secondary transition hover:bg-secondary">
              <td className="px-4 py-4 font-medium">
                <Link
                  to={`/projects/${project.id}`}
                  className="text-sm font-semibold text-brand-primary transition hover:text-brand-secondary"
                >
                  {project.name}
                </Link>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-1">
                  {project.modules.slice(0, 3).map((mod) => (
                    <Badge key={mod} tone="purple">
                      {mod}
                    </Badge>
                  ))}
                  {project.modules.length > 3 && (
                    <span className="self-center text-xs text-tertiary">
                      +{project.modules.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <div className="flex flex-wrap gap-1">
                  {project.tech_stack.slice(0, 3).map((tech) => (
                    <Badge key={tech} tone="blue">
                      {tech}
                    </Badge>
                  ))}
                  {project.tech_stack.length > 3 && (
                    <span className="self-center text-xs text-tertiary">
                      +{project.tech_stack.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4">
                <Badge tone={(complexityColors[project.complexity] as never) || "neutral"}>
                  {project.complexity}
                </Badge>
              </td>
              <td className="px-4 py-4 font-medium text-secondary">{project.duration_days}d</td>
              <td className="px-4 py-4 font-medium text-secondary">{project.effort_person_days}pd</td>
              <td className="px-4 py-4">
                <div className="flex gap-2">
                  <Link
                    to={`/projects/${project.id}/edit`}
                    className="text-xs font-semibold text-brand-primary transition hover:text-brand-secondary"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => onDelete(project.id)}
                    className="text-xs font-semibold text-error-primary transition hover:opacity-80"
                  >
                    Delete
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
