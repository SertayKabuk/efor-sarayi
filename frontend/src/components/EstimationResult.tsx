import { useState } from "react";
import type { EstimationResponse } from "../types/project";
import { exportEstimate } from "../api/client";
import ExportModal from "./ExportModal";

interface Props {
  result: EstimationResponse;
}

const confidenceColors: Record<string, string> = {
  low: "bg-red-100 text-red-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-green-100 text-green-800",
};

const impactColors: Record<string, string> = {
  low: "bg-green-100 text-green-800",
  medium: "bg-yellow-100 text-yellow-800",
  high: "bg-red-100 text-red-800",
};

export default function EstimationResult({ result }: Props) {
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-800">
            Estimation Result
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowExport(true)}
              className="bg-green-600 text-white px-3 py-1 rounded text-xs font-medium hover:bg-green-700"
            >
              Export
            </button>
            <span
              className={`px-3 py-1 rounded-full text-xs font-medium ${
                confidenceColors[result.confidence] || ""
              }`}
            >
              {result.confidence} confidence
            </span>
          </div>
        </div>
        <div className="flex justify-center gap-8 py-4">
          <div className="text-center">
            <p className="text-4xl font-bold text-blue-600">
              {result.estimated_days}
            </p>
            <p className="text-sm text-gray-500 mt-1">calendar days</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-purple-600">
              {result.effort_person_days}
            </p>
            <p className="text-sm text-gray-500 mt-1">person-days</p>
          </div>
        </div>
        <div className="mt-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Reasoning</h3>
          <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
            {result.reasoning}
          </p>
        </div>
      </div>

      {/* Team Composition */}
      {result.team_composition.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Team Composition
          </h2>
          <div className="flex flex-wrap gap-2">
            {result.team_composition.map((role, i) => (
              <span
                key={i}
                className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded text-sm"
              >
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Implementation Plan */}
      {result.implementation_plan.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Implementation Plan
          </h2>
          <div className="space-y-3">
            {result.implementation_plan.map((phase, i) => (
              <div key={i} className="border rounded p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">
                    {phase.phase}
                  </span>
                  <span className="text-xs font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                    {phase.effort_days} person-days
                  </span>
                </div>
                {phase.tasks.length > 0 && (
                  <ul className="list-disc list-inside text-xs text-gray-600 space-y-0.5 mt-1">
                    {phase.tasks.map((task, ti) => (
                      <li key={ti}>{task}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div className="text-right text-sm font-medium text-gray-700 pt-1 border-t">
              Total:{" "}
              {result.implementation_plan.reduce(
                (sum, p) => sum + p.effort_days,
                0
              )}{" "}
              person-days
            </div>
          </div>
        </div>
      )}

      {/* Assumptions */}
      {result.assumptions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Assumptions
          </h2>
          <ul className="list-disc list-inside text-sm text-gray-700 space-y-1">
            {result.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Risks */}
      {result.risks.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">Risks</h2>
          <div className="space-y-2">
            {result.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <span
                  className={`px-1.5 py-0.5 rounded text-xs font-medium shrink-0 mt-0.5 ${
                    impactColors[risk.impact] || ""
                  }`}
                >
                  {risk.impact}
                </span>
                <span className="text-gray-700">{risk.description}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Questions & Ambiguities */}
      {result.questions.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-3">
            Questions & Ambiguities
          </h2>
          <ul className="space-y-2">
            {result.questions.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-gray-700"
              >
                <span className="text-blue-500 shrink-0 mt-0.5">?</span>
                {q}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Similar Projects */}
      {result.similar_projects.length > 0 && (
        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Similar Past Projects
          </h2>
          <div className="space-y-3">
            {result.similar_projects.map((proj) => (
              <div
                key={proj.id}
                className="border rounded p-3 flex items-center justify-between"
              >
                <div>
                  <p className="font-medium text-gray-800 text-sm">
                    {proj.name}
                  </p>
                  <div className="flex gap-2 mt-1 text-xs text-gray-500">
                    <span>{proj.modules.length} modules</span>
                    <span>|</span>
                    <span>{proj.complexity}</span>
                    {proj.integrations.length > 0 && (
                      <>
                        <span>|</span>
                        <span>{proj.integrations.length} integrations</span>
                      </>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-gray-800">
                    {proj.duration_days}d / {proj.effort_person_days}pd
                  </p>
                  <p className="text-xs text-gray-500">
                    {(proj.similarity_score * 100).toFixed(0)}% similar
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showExport && (
        <ExportModal
          onExport={(customPrompt) => exportEstimate(result, customPrompt || undefined)}
          onClose={() => setShowExport(false)}
        />
      )}
    </div>
  );
}
