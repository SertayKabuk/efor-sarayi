import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useState } from "react";
import type { Risk } from "../types/project";

interface Props {
  risks: Risk[];
  onChange: (risks: Risk[]) => void;
}

const impactColors: Record<string, string> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

export default function RiskEditor({ risks, onChange }: Props) {
  const [desc, setDesc] = useState("");
  const [impact, setImpact] = useState<Risk["impact"]>("medium");

  const add = () => {
    const d = desc.trim();
    if (!d) return;
    onChange([...risks, { description: d, impact }]);
    setDesc("");
    setImpact("medium");
  };

  const remove = (index: number) => {
    onChange(risks.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-primary">Risks</p>

      {risks.length > 0 && (
        <ul className="space-y-2">
          {risks.map((risk, i) => (
            <li
              key={i}
              className="flex items-center justify-between rounded-2xl border border-secondary bg-secondary px-4 py-3 text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge tone={(impactColors[risk.impact] as never) || "neutral"}>
                  {risk.impact}
                </Badge>
                <span className="text-primary">{risk.description}</span>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="ml-2 text-xs font-semibold text-error-primary transition hover:opacity-80"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl border border-dashed border-primary bg-secondary p-4">
        <div className="grid gap-2 md:grid-cols-[minmax(0,2fr)_140px_auto]">
          <Input
            value={desc}
            onChange={(e) => setDesc(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder="Describe the risk..."
          />
          <Select
            value={impact}
            onChange={(e) => setImpact(e.target.value as Risk["impact"])}
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </Select>
          <Button type="button" tone="secondary" onClick={add}>
            Add Risk
          </Button>
        </div>
      </div>
    </div>
  );
}
