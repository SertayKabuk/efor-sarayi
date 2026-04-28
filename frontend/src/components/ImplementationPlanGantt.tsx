import { cx } from "@/utils/cx";
import type { PlanPhase } from "../types/project";

interface Props {
  phases: PlanPhase[];
  className?: string;
  emptyState?: "hide" | "hint";
}

const gridMarkers = [25, 50, 75];
const barColors = [
  "bg-brand-solid",
  "bg-violet-600",
  "bg-sky-600",
  "bg-emerald-600",
  "bg-fuchsia-600",
  "bg-amber-600",
];

function formatDays(value: number) {
  return Number.isInteger(value) ? value.toString() : value.toFixed(1);
}

function formatTaskCount(count: number) {
  return `${count} task${count === 1 ? "" : "s"}`;
}

function buildTicks(totalEffort: number) {
  const tickCount = totalEffort <= 4 ? Math.max(Math.ceil(totalEffort) + 1, 2) : 5;

  return Array.from({ length: tickCount }, (_, index) =>
    formatDays((totalEffort / (tickCount - 1)) * index)
  );
}

export default function ImplementationPlanGantt({
  phases,
  className,
  emptyState = "hide",
}: Props) {
  const totalEffort = phases.reduce(
    (sum, phase) => sum + Math.max(phase.effort_days, 0),
    0
  );

  if (totalEffort <= 0) {
    if (emptyState === "hint" && phases.length > 0) {
      return (
        <div className={cx("rounded-2xl border border-dashed border-primary bg-secondary p-4", className)}>
          <p className="text-sm font-semibold text-primary">Gantt chart preview</p>
          <p className="mt-1 text-xs leading-5 text-tertiary">
            Add effort estimates to one or more phases to render the timeline.
          </p>
        </div>
      );
    }

    return null;
  }

  let cumulativeEffort = 0;
  const timeline = phases.map((phase) => {
    const effort = Math.max(phase.effort_days, 0);
    const start = cumulativeEffort;
    const end = cumulativeEffort + effort;
    const left = totalEffort > 0 ? (start / totalEffort) * 100 : 0;
    const actualWidth = totalEffort > 0 ? (effort / totalEffort) * 100 : 0;
    const right = totalEffort > 0 ? ((totalEffort - end) / totalEffort) * 100 : 0;

    cumulativeEffort = end;

    return {
      phase,
      effort,
      start,
      end,
      left,
      width: Math.max(actualWidth, 0.01),
      align: right < 12 ? "end" : "start",
    };
  });

  const ticks = buildTicks(totalEffort);

  return (
    <div className={cx("rounded-2xl border border-secondary bg-secondary p-4", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-semibold text-primary">Gantt chart</p>
          <p className="text-xs leading-5 text-tertiary">
            Sequential effort timeline derived from the implementation phases.
          </p>
        </div>
        <p className="text-xs text-tertiary">{phases.length} phase(s)</p>
      </div>

      <div className="mt-4 overflow-x-auto">
        <div className="min-w-[680px] space-y-3">
          <div className="grid grid-cols-[minmax(0,13rem)_1fr] gap-4">
            <div className="text-[11px] font-medium uppercase tracking-[0.08em] text-tertiary">
              Phase
            </div>
            <div className="flex justify-between text-[11px] font-medium uppercase tracking-[0.08em] text-tertiary">
              {ticks.map((tick, index) => (
                <span key={`${tick}-${index}`}>{tick} pd</span>
              ))}
            </div>
          </div>

          {timeline.map((entry, index) => {
            const rangeLabel =
              entry.effort > 0
                ? `pd ${formatDays(entry.start + 1)}–${formatDays(entry.end)}`
                : "0 pd";

            return (
              <div
                key={`${entry.phase.phase}-${index}`}
                className="grid grid-cols-[minmax(0,13rem)_1fr] gap-4 items-center"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-primary">
                    {entry.phase.phase}
                  </p>
                  <p className="text-xs text-tertiary">
                    {formatTaskCount(entry.phase.tasks.length)} · {formatDays(entry.phase.effort_days)} pd
                  </p>
                </div>

                <div className="relative h-12 overflow-hidden rounded-2xl border border-secondary bg-primary">
                  {gridMarkers.map((marker) => (
                    <div
                      key={marker}
                      className="pointer-events-none absolute inset-y-0 w-px bg-secondary"
                      style={{ left: `${marker}%` }}
                    />
                  ))}

                  <div
                    className={cx(
                      "absolute inset-y-1.5 flex min-w-0",
                      entry.align === "end" ? "justify-end" : "justify-start"
                    )}
                    style={{
                      left: `${entry.left}%`,
                      width: `${entry.width}%`,
                    }}
                  >
                    <div
                      className={cx(
                        "flex w-max min-w-full items-center rounded-xl px-3 text-xs font-semibold whitespace-nowrap text-primary_on-brand shadow-sm",
                        barColors[index % barColors.length]
                      )}
                      title={`${entry.phase.phase}: ${rangeLabel}`}
                    >
                      <span>{rangeLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}