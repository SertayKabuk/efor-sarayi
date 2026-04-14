import { useState } from "react";
import type { ProjectFormData, PlanPhase, Risk } from "../types/project";
import TagInput from "./TagInput";
import PlanEditor from "./PlanEditor";
import RiskEditor from "./RiskEditor";

interface Props {
  initialData: ProjectFormData;
  onSubmit: (data: ProjectFormData) => void;
  saving: boolean;
}

export default function ProjectForm({ initialData, onSubmit, saving }: Props) {
  const [form, setForm] = useState<ProjectFormData>(initialData);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "duration_days" || name === "effort_person_days"
          ? Number(value)
          : value,
    }));
  };

  const updateList = (field: keyof ProjectFormData) => (values: string[]) => {
    setForm((prev) => ({ ...prev, [field]: values }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Project Name
        </label>
        <input
          name="name"
          value={form.name}
          onChange={handleChange}
          required
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="E-commerce Platform"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description
        </label>
        <textarea
          name="description"
          value={form.description}
          onChange={handleChange}
          required
          rows={3}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Describe the project scope, features, and goals..."
        />
      </div>

      <TagInput
        label="Modules"
        placeholder="e.g. Auth System, Payment Gateway, Admin Dashboard"
        tags={form.modules}
        onChange={updateList("modules")}
      />

      <TagInput
        label="Integrations"
        placeholder="e.g. Stripe, SAP, SendGrid, LDAP"
        tags={form.integrations}
        onChange={updateList("integrations")}
      />

      <TagInput
        label="Requirements"
        placeholder="e.g. HIPAA compliance, 99.9% uptime, Multi-language"
        tags={form.requirements}
        onChange={updateList("requirements")}
      />

      <TagInput
        label="Tech Stack"
        placeholder="e.g. React, FastAPI, PostgreSQL"
        tags={form.tech_stack}
        onChange={updateList("tech_stack")}
      />

      <div className="grid grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Duration (days)
          </label>
          <input
            name="duration_days"
            type="number"
            min={1}
            value={form.duration_days}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Effort (person-days)
          </label>
          <input
            name="effort_person_days"
            type="number"
            min={0}
            value={form.effort_person_days}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Complexity
          </label>
          <select
            name="complexity"
            value={form.complexity}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2 text-sm"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="very_high">Very High</option>
          </select>
        </div>
      </div>

      <TagInput
        label="Constraints"
        placeholder="e.g. Legacy Oracle DB integration, Go-live before Q4"
        tags={form.constraints}
        onChange={updateList("constraints")}
      />

      <TagInput
        label="Team Composition"
        placeholder="e.g. 2 Backend Developers, 1 QA Engineer"
        tags={form.team_composition}
        onChange={updateList("team_composition")}
      />

      <PlanEditor
        phases={form.implementation_plan}
        onChange={(phases: PlanPhase[]) =>
          setForm((prev) => ({ ...prev, implementation_plan: phases }))
        }
      />

      <TagInput
        label="Assumptions"
        placeholder="e.g. APIs are well-documented, No legacy migration"
        tags={form.assumptions}
        onChange={updateList("assumptions")}
      />

      <RiskEditor
        risks={form.risks}
        onChange={(risks: Risk[]) =>
          setForm((prev) => ({ ...prev, risks }))
        }
      />

      <TagInput
        label="Questions & Ambiguities"
        placeholder="e.g. What is the expected user count?"
        tags={form.questions}
        onChange={updateList("questions")}
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Notes (optional)
        </label>
        <textarea
          name="notes"
          value={form.notes}
          onChange={handleChange}
          rows={2}
          className="w-full border rounded px-3 py-2 text-sm"
          placeholder="Any additional context..."
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="bg-blue-600 text-white px-6 py-2 rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
      >
        {saving ? "Saving..." : "Save Project"}
      </button>
    </form>
  );
}
