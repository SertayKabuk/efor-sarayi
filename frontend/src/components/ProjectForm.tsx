import { useState } from "react";
import Button from "@/components/ui/Button";
import { Card, CardContent } from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
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
    <form onSubmit={handleSubmit}>
      <Card>
        <CardContent className="space-y-6 px-6 py-6">
          <Input
            name="name"
            label="Project Name"
            value={form.name}
            onChange={handleChange}
            required
            placeholder="E-commerce Platform"
          />

          <Textarea
            name="description"
            label="Description"
            value={form.description}
            onChange={handleChange}
            required
            rows={4}
            placeholder="Describe the project scope, features, goals, and success criteria..."
          />

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

          <div className="grid gap-4 md:grid-cols-3">
            <Input
              name="duration_days"
              type="number"
              min={1}
              label="Duration (days)"
              value={form.duration_days}
              onChange={handleChange}
              required
            />
            <Input
              name="effort_person_days"
              type="number"
              min={0}
              label="Effort (person-days)"
              value={form.effort_person_days}
              onChange={handleChange}
              required
            />
            <Select
              name="complexity"
              label="Complexity"
              value={form.complexity}
              onChange={handleChange}
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="very_high">Very High</option>
            </Select>
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

          <Textarea
            name="notes"
            label="Notes (optional)"
            value={form.notes}
            onChange={handleChange}
            rows={3}
            placeholder="Any additional context, internal notes, or delivery caveats..."
          />

          <div className="flex justify-end border-t border-secondary pt-2">
            <Button type="submit" loading={saving}>
              Save Project
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
