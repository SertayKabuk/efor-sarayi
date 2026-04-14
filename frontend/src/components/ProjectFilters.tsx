import type { Project } from "../types/project";

interface Props {
  projects: Project[];
  search: string;
  complexity: string;
  techStack: string;
  onSearchChange: (v: string) => void;
  onComplexityChange: (v: string) => void;
  onTechStackChange: (v: string) => void;
}

export default function ProjectFilters({
  projects,
  search,
  complexity,
  techStack,
  onSearchChange,
  onComplexityChange,
  onTechStackChange,
}: Props) {
  const allTech = Array.from(
    new Set(projects.flatMap((p) => p.tech_stack))
  ).sort();

  return (
    <div className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        placeholder="Search by name..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        className="border rounded px-3 py-1.5 text-sm w-56"
      />
      <select
        value={complexity}
        onChange={(e) => onComplexityChange(e.target.value)}
        className="border rounded px-3 py-1.5 text-sm"
      >
        <option value="">All complexities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
        <option value="very_high">Very High</option>
      </select>
      <select
        value={techStack}
        onChange={(e) => onTechStackChange(e.target.value)}
        className="border rounded px-3 py-1.5 text-sm"
      >
        <option value="">All tech stacks</option>
        {allTech.map((t) => (
          <option key={t} value={t}>
            {t}
          </option>
        ))}
      </select>
    </div>
  );
}
