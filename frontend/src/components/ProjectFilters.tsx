import { SearchLg } from "@untitledui/icons";
import { Card, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
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
    <Card>
      <CardContent className="p-4">
        <div className="grid gap-4 md:grid-cols-[minmax(0,2fr)_1fr_1fr]">
          <Input
            type="search"
            icon={SearchLg}
            placeholder="Search by project name..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <Select
            value={complexity}
            onChange={(e) => onComplexityChange(e.target.value)}
          >
            <option value="">All complexities</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="very_high">Very High</option>
          </Select>
          <Select
            value={techStack}
            onChange={(e) => onTechStackChange(e.target.value)}
          >
            <option value="">All tech stacks</option>
            {allTech.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
