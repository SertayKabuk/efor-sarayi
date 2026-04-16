import { Plus } from "@untitledui/icons";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import Input from "@/components/ui/Input";
import { useState } from "react";
import type { PlanPhase } from "../types/project";

interface Props {
  phases: PlanPhase[];
  onChange: (phases: PlanPhase[]) => void;
}

export default function PlanEditor({ phases, onChange }: Props) {
  const [newPhase, setNewPhase] = useState("");

  const addPhase = () => {
    const name = newPhase.trim();
    if (!name) return;
    onChange([...phases, { phase: name, tasks: [], effort_days: 0 }]);
    setNewPhase("");
  };

  const removePhase = (index: number) => {
    onChange(phases.filter((_, i) => i !== index));
  };

  const updatePhase = (index: number, updated: PlanPhase) => {
    onChange(phases.map((p, i) => (i === index ? updated : p)));
  };

  const addTask = (phaseIndex: number, task: string) => {
    const phase = phases[phaseIndex];
    updatePhase(phaseIndex, { ...phase, tasks: [...phase.tasks, task] });
  };

  const removeTask = (phaseIndex: number, taskIndex: number) => {
    const phase = phases[phaseIndex];
    updatePhase(phaseIndex, {
      ...phase,
      tasks: phase.tasks.filter((_, i) => i !== taskIndex),
    });
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-primary">Implementation Plan</p>
        <p className="text-xs text-tertiary">{phases.length} phase(s)</p>
      </div>
      <div className="space-y-3">
        {phases.map((phase, pi) => (
          <PhaseCard
            key={pi}
            phase={phase}
            onUpdate={(p) => updatePhase(pi, p)}
            onRemove={() => removePhase(pi)}
            onAddTask={(t) => addTask(pi, t)}
            onRemoveTask={(ti) => removeTask(pi, ti)}
          />
        ))}
      </div>
      <div className="rounded-2xl border border-dashed border-primary bg-secondary p-4">
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={newPhase}
            onChange={(e) => setNewPhase(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addPhase();
              }
            }}
            placeholder="Add phase name..."
            wrapperClassName="sm:flex-1"
          />
          <Button type="button" tone="secondary" iconLeading={Plus} onClick={addPhase}>
            Add Phase
          </Button>
        </div>
      </div>
    </div>
  );
}

function PhaseCard({
  phase,
  onUpdate,
  onRemove,
  onAddTask,
  onRemoveTask,
}: {
  phase: PlanPhase;
  onUpdate: (p: PlanPhase) => void;
  onRemove: () => void;
  onAddTask: (task: string) => void;
  onRemoveTask: (index: number) => void;
}) {
  const [newTask, setNewTask] = useState("");

  const handleAddTask = () => {
    const t = newTask.trim();
    if (!t) return;
    onAddTask(t);
    setNewTask("");
  };

  return (
    <div className="rounded-2xl border border-secondary bg-secondary p-4">
      <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">{phase.phase}</p>
          <p className="text-xs text-tertiary">Tasks and effort estimate</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge tone="purple">{phase.effort_days} day(s)</Badge>
          <input
            type="number"
            min={0}
            value={phase.effort_days}
            onChange={(e) =>
              onUpdate({ ...phase, effort_days: Number(e.target.value) })
            }
            className="w-20 rounded-lg border border-primary bg-primary px-2.5 py-2 text-xs text-primary outline-hidden focus:border-brand focus:outline-2 focus:-outline-offset-2 focus:outline-brand"
          />
          <button
            type="button"
            onClick={onRemove}
            className="text-xs font-semibold text-error-primary transition hover:opacity-80"
          >
            Remove
          </button>
        </div>
      </div>
      {phase.tasks.length > 0 && (
        <ul className="mb-3 space-y-2">
          {phase.tasks.map((task, ti) => (
            <li
              key={ti}
              className="flex items-center justify-between rounded-xl border border-secondary bg-primary px-3 py-2 text-sm"
            >
              <span className="text-primary">{task}</span>
              <button
                type="button"
                onClick={() => onRemoveTask(ti)}
                className="ml-2 text-xs font-semibold text-error-primary transition hover:opacity-80"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTask();
            }
          }}
          placeholder="Add task..."
          wrapperClassName="sm:flex-1"
        />
        <Button type="button" tone="tertiary" onClick={handleAddTask}>
          Add task
        </Button>
      </div>
    </div>
  );
}
