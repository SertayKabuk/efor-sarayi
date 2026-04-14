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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Implementation Plan
      </label>
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
      <div className="flex gap-2 mt-2">
        <input
          value={newPhase}
          onChange={(e) => setNewPhase(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              addPhase();
            }
          }}
          placeholder="Add phase name..."
          className="flex-1 border rounded px-3 py-1.5 text-sm"
        />
        <button
          type="button"
          onClick={addPhase}
          className="bg-gray-200 px-3 py-1.5 rounded text-sm font-medium hover:bg-gray-300"
        >
          Add Phase
        </button>
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
    <div className="border rounded p-3 bg-gray-50">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium text-gray-800">{phase.phase}</span>
        <div className="flex items-center gap-2">
          <label className="text-xs text-gray-500">Days:</label>
          <input
            type="number"
            min={0}
            value={phase.effort_days}
            onChange={(e) =>
              onUpdate({ ...phase, effort_days: Number(e.target.value) })
            }
            className="w-16 border rounded px-2 py-1 text-xs"
          />
          <button
            type="button"
            onClick={onRemove}
            className="text-red-500 hover:text-red-700 text-xs font-medium"
          >
            Remove
          </button>
        </div>
      </div>
      {phase.tasks.length > 0 && (
        <ul className="space-y-1 mb-2">
          {phase.tasks.map((task, ti) => (
            <li
              key={ti}
              className="flex items-center justify-between text-xs bg-white px-2 py-1 rounded"
            >
              <span className="text-gray-700">{task}</span>
              <button
                type="button"
                onClick={() => onRemoveTask(ti)}
                className="text-red-400 hover:text-red-600 ml-2"
              >
                x
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-1">
        <input
          value={newTask}
          onChange={(e) => setNewTask(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAddTask();
            }
          }}
          placeholder="Add task..."
          className="flex-1 border rounded px-2 py-1 text-xs"
        />
        <button
          type="button"
          onClick={handleAddTask}
          className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2"
        >
          Add
        </button>
      </div>
    </div>
  );
}
