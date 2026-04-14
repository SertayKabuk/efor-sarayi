import { Link } from "react-router-dom";
import type { Project } from "../types/project";

interface Props {
  projects: Project[];
  onDelete: (id: string) => void;
}

const complexityColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-orange-100 text-orange-800",
  very_high: "bg-red-100 text-red-800",
};

export default function ProjectTable({ projects, onDelete }: Props) {
  return (
    <div className="overflow-x-auto bg-white rounded-lg shadow">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-gray-50 text-left text-gray-600">
            <th className="px-4 py-3 font-medium">Name</th>
            <th className="px-4 py-3 font-medium">Modules</th>
            <th className="px-4 py-3 font-medium">Tech Stack</th>
            <th className="px-4 py-3 font-medium">Complexity</th>
            <th className="px-4 py-3 font-medium">Duration</th>
            <th className="px-4 py-3 font-medium">Effort</th>
            <th className="px-4 py-3 font-medium">Actions</th>
          </tr>
        </thead>
        <tbody>
          {projects.map((project) => (
            <tr key={project.id} className="border-b hover:bg-gray-50">
              <td className="px-4 py-3 font-medium">
                <Link
                  to={`/projects/${project.id}`}
                  className="text-blue-600 hover:text-blue-800"
                >
                  {project.name}
                </Link>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {project.modules.slice(0, 3).map((mod) => (
                    <span
                      key={mod}
                      className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs"
                    >
                      {mod}
                    </span>
                  ))}
                  {project.modules.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{project.modules.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {project.tech_stack.slice(0, 3).map((tech) => (
                    <span
                      key={tech}
                      className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs"
                    >
                      {tech}
                    </span>
                  ))}
                  {project.tech_stack.length > 3 && (
                    <span className="text-xs text-gray-400">
                      +{project.tech_stack.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3">
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium ${
                    complexityColors[project.complexity] || ""
                  }`}
                >
                  {project.complexity}
                </span>
              </td>
              <td className="px-4 py-3">{project.duration_days}d</td>
              <td className="px-4 py-3">{project.effort_person_days}pd</td>
              <td className="px-4 py-3">
                <div className="flex gap-2">
                  <Link
                    to={`/projects/${project.id}/edit`}
                    className="text-blue-600 hover:text-blue-800 text-xs font-medium"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => onDelete(project.id)}
                    className="text-red-600 hover:text-red-800 text-xs font-medium"
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
