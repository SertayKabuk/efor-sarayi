import type { EstimationResponse } from "../types/project";

interface Props {
  result: EstimationResponse;
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatNumber(value: number, suffix: string) {
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${formatted} ${suffix}`;
}

function BulletSection({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <section className="pdf-avoid-break rounded-2xl border border-slate-200 bg-slate-50 p-5">
      <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
        {title}
      </h2>
      {items.length > 0 ? (
        <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-700">
          {items.map((item, index) => (
            <li key={`${item}-${index}`} className="flex gap-2">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-400" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-3 text-sm italic text-slate-400">None provided.</p>
      )}
    </section>
  );
}

function SummaryCard({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500">
        {label}
      </p>
      <p className="mt-2 text-base font-semibold text-slate-900">{value}</p>
    </div>
  );
}

export default function EstimatePdfDocument({ result }: Props) {
  const exportedAt = formatDate(new Date().toISOString());

  return (
    <div className="w-[794px] bg-white px-10 py-10 text-slate-900">
      <header className="border-b border-slate-200 pb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Effort estimate export
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              Estimation result
            </h1>
            <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-700">
              {result.reasoning}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-xs text-slate-500">
            <p>Generated {exportedAt}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-3">
          <SummaryCard
            label="Estimated duration"
            value={formatNumber(result.estimated_days, "calendar days")}
          />
          <SummaryCard
            label="Total effort"
            value={formatNumber(result.effort_person_days, "person-days")}
          />
          <SummaryCard label="Confidence" value={result.confidence} />
        </div>
      </header>

      <section className="pdf-avoid-break mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Team composition
        </h2>
        {result.team_composition.length > 0 ? (
          <div className="mt-4 flex flex-wrap gap-2 text-sm text-slate-700">
            {result.team_composition.map((role, index) => (
              <span
                key={`${role}-${index}`}
                className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5"
              >
                {role}
              </span>
            ))}
          </div>
        ) : (
          <p className="mt-4 text-sm italic text-slate-400">No team composition provided.</p>
        )}
      </section>

      <section className="pdf-avoid-break mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-4">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
              Implementation plan
            </h2>
            <p className="mt-1 text-sm text-slate-600">
              Ordered work packages and their estimated effort.
            </p>
          </div>
          <p className="text-sm font-semibold text-slate-900">
            Total planned effort: {formatNumber(result.effort_person_days, "person-days")}
          </p>
        </div>

        {result.implementation_plan.length > 0 ? (
          <div className="mt-5 space-y-4">
            {result.implementation_plan.map((phase, index) => (
              <div
                key={`${phase.phase}-${index}`}
                className="pdf-avoid-break rounded-2xl border border-slate-200 bg-slate-50 p-5"
              >
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">{phase.phase}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">
                      Work package {index + 1}
                    </p>
                  </div>
                  <div className="rounded-full bg-slate-900 px-3 py-1 text-xs font-semibold text-white">
                    {formatNumber(phase.effort_days, "pd")}
                  </div>
                </div>

                {phase.tasks.length > 0 ? (
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-slate-700">
                    {phase.tasks.map((task, taskIndex) => (
                      <li key={`${task}-${taskIndex}`} className="flex gap-2">
                        <span className="mt-2 size-1.5 shrink-0 rounded-full bg-slate-400" />
                        <span>{task}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm italic text-slate-400">No tasks listed.</p>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-5 text-sm italic text-slate-400">No implementation plan provided.</p>
        )}
      </section>

      <div className="mt-8 grid grid-cols-2 gap-4">
        <BulletSection title="Assumptions" items={result.assumptions} />
        <section className="pdf-avoid-break rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Risks
          </h2>
          {result.risks.length > 0 ? (
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
              {result.risks.map((risk, index) => (
                <li key={`${risk.description}-${index}`}>
                  <span className="font-semibold text-slate-900">
                    {risk.impact.charAt(0).toUpperCase() + risk.impact.slice(1)}:
                  </span>{" "}
                  {risk.description}
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-3 text-sm italic text-slate-400">None provided.</p>
          )}
        </section>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <BulletSection title="Questions & ambiguities" items={result.questions} />
        <section className="pdf-avoid-break rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Similar past projects
          </h2>
          {result.similar_projects.length > 0 ? (
            <div className="mt-3 space-y-3">
              {result.similar_projects.map((project) => (
                <div
                  key={project.id}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-semibold text-slate-900">{project.name}</p>
                      <p className="mt-1 text-xs text-slate-500">
                        {project.modules.length} modules · {project.complexity}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-500">
                      <p>{Math.round(project.similarity_score * 100)}% similar</p>
                      <p className="mt-1">
                        {project.duration_days}d / {project.effort_person_days}pd
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-3 text-sm italic text-slate-400">No similar projects matched.</p>
          )}
        </section>
      </div>
    </div>
  );
}