import { useState } from "react";
import type { Risk } from "../types/project";

interface Props {
  risks: Risk[];
  onChange: (risks: Risk[]) => void;
}

const impactColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Risks
      </label>
      {risks.length > 0 && (
        <ul className="space-y-1 mb-2">
          {risks.map((risk, i) => (
            <li
              key={i}
              className="flex items-center justify-between bg-gray-50 px-3 py-1.5 rounded text-sm"
            >
              <div className="flex items-center gap-2">
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                    impactColors[risk.impact] || ""
                  }`}
                >
                  {risk.impact}
                </span>
                <span className="text-gray-700">{risk.description}</span>
              </div>
              <button
                type="button"
                onClick={() => remove(i)}
                className="text-red-500 hover:text-red-700 text-xs font-medium ml-2"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-2">
        <input
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Describe the risk..."
          className="flex-1 border rounded px-3 py-1.5 text-sm"
        />
        <select
          value={impact}
          onChange={(e) => setImpact(e.target.value as Risk["impact"])}
          className="border rounded px-2 py-1.5 text-sm"
        >
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <button
          type="button"
          onClick={add}
          className="bg-gray-200 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-300"
        >
          Add
        </button>
      </div>
    </div>
  );
}
