import { useState } from "react";
import Badge from "@/components/ui/Badge";
import Button from "@/components/ui/Button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/Card";
import type { EstimationResponse } from "../types/project";
import { exportEstimate } from "../api/client";
import ExportModal from "./ExportModal";

interface Props {
  result: EstimationResponse;
}

const confidenceColors: Record<string, string> = {
  low: "danger",
  medium: "warning",
  high: "success",
};

const impactColors: Record<string, string> = {
  low: "success",
  medium: "warning",
  high: "danger",
};

export default function EstimationResult({ result }: Props) {
  const [showExport, setShowExport] = useState(false);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div>
              <CardTitle>Estimation result</CardTitle>
              <CardDescription>
                Generated from the current project brief and similar historical work.
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={(confidenceColors[result.confidence] as never) || "neutral"}>
                {result.confidence} confidence
              </Badge>
              <Button tone="success" size="sm" onClick={() => setShowExport(true)}>
                Export
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-secondary bg-secondary p-5 text-center">
              <p className="text-4xl font-semibold tracking-tight text-brand-primary">
                {result.estimated_days}
              </p>
              <p className="mt-2 text-sm text-secondary">calendar days</p>
            </div>
            <div className="rounded-2xl border border-secondary bg-secondary p-5 text-center">
              <p className="text-4xl font-semibold tracking-tight text-purple-600 dark:text-purple-300">
                {result.effort_person_days}
              </p>
              <p className="mt-2 text-sm text-secondary">person-days</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-primary">Reasoning</h3>
            <p className="mt-2 whitespace-pre-line text-sm leading-6 text-secondary">
              {result.reasoning}
            </p>
          </div>
        </CardContent>
      </Card>

      {result.team_composition.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Team composition</CardTitle>
          </CardHeader>
          <CardContent>
          <div className="flex flex-wrap gap-2">
            {result.team_composition.map((role, i) => (
              <Badge key={i} tone="indigo" className="px-3 py-1 text-sm">
                {role}
              </Badge>
            ))}
          </div>
          </CardContent>
        </Card>
      )}

      {result.implementation_plan.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Implementation plan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.implementation_plan.map((phase, i) => (
              <div key={i} className="rounded-2xl border border-secondary bg-secondary p-4">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <span className="text-sm font-semibold text-primary">
                    {phase.phase}
                  </span>
                  <Badge tone="purple">
                    {phase.effort_days} person-days
                  </Badge>
                </div>
                {phase.tasks.length > 0 && (
                  <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
                    {phase.tasks.map((task, ti) => (
                      <li key={ti}>{task}</li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div className="border-t border-secondary pt-2 text-right text-sm font-semibold text-primary">
              Total:{" "}
              {result.implementation_plan.reduce(
                (sum, p) => sum + p.effort_days,
                0
              )}{" "}
              person-days
            </div>
          </CardContent>
        </Card>
      )}

      {result.assumptions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Assumptions</CardTitle>
          </CardHeader>
          <CardContent>
          <ul className="list-disc space-y-1 pl-5 text-sm text-secondary">
            {result.assumptions.map((a, i) => (
              <li key={i}>{a}</li>
            ))}
          </ul>
          </CardContent>
        </Card>
      )}

      {result.risks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {result.risks.map((risk, i) => (
              <div key={i} className="flex items-start gap-2 text-sm">
                <Badge
                  tone={(impactColors[risk.impact] as never) || "neutral"}
                  className="mt-0.5 shrink-0"
                >
                  {risk.impact}
                </Badge>
                <span className="text-secondary">{risk.description}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {result.questions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Questions & Ambiguities</CardTitle>
          </CardHeader>
          <CardContent>
          <ul className="space-y-2">
            {result.questions.map((q, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-sm text-secondary"
              >
                <span className="mt-0.5 shrink-0 text-brand-primary">?</span>
                {q}
              </li>
            ))}
          </ul>
          </CardContent>
        </Card>
      )}

      {result.similar_projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Similar past projects</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {result.similar_projects.map((proj) => (
              <div
                key={proj.id}
                className="flex items-center justify-between rounded-2xl border border-secondary bg-secondary p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-primary">{proj.name}</p>
                  <div className="mt-1 flex gap-2 text-xs text-tertiary">
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
                  <p className="font-semibold text-primary">
                    {proj.duration_days}d / {proj.effort_person_days}pd
                  </p>
                  <p className="text-xs text-tertiary">
                    {(proj.similarity_score * 100).toFixed(0)}% similar
                  </p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
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
