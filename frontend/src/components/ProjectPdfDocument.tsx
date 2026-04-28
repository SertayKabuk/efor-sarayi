import type { DocumentInfo, Project } from "../types/project";

interface Props {
  project: Project;
  documents: DocumentInfo[];
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
  }).format(date);
}

function formatNumber(value: number, suffix: string) {
  const formatted = Number.isInteger(value) ? value.toString() : value.toFixed(1);
  return `${formatted} ${suffix}`;
}

function ListBlock({
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
          {items.map((item) => (
            <li key={item} className="flex gap-2">
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

export default function ProjectPdfDocument({ project, documents }: Props) {
  const plannedEffort = project.implementation_plan.reduce(
    (sum, phase) => sum + Math.max(phase.effort_days, 0),
    0
  );

  return (
    <div className="w-[794px] bg-white px-10 py-10 text-slate-900">
      <header className="border-b border-slate-200 pb-8">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-sky-700">
              Project details export
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">
              {project.name}
            </h1>
            <p className="mt-4 max-w-3xl whitespace-pre-line text-sm leading-6 text-slate-700">
              {project.description}
            </p>
          </div>

          <div className="shrink-0 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-right text-xs text-slate-500">
            <p>Updated {formatDate(project.updated_at)}</p>
            <p className="mt-1">Exported {formatDate(new Date().toISOString())}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-4 gap-3">
          <SummaryCard label="Complexity" value={project.complexity.replace("_", " ")} />
          <SummaryCard
            label="Duration"
            value={formatNumber(project.duration_days, "calendar days")}
          />
          <SummaryCard
            label="Total effort"
            value={formatNumber(project.effort_person_days, "person-days")}
          />
          <SummaryCard
            label="Plan effort"
            value={formatNumber(plannedEffort, "person-days")}
          />
        </div>
      </header>

      <section className="pdf-avoid-break mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Delivery snapshot
        </h2>
        <div className="mt-4 grid grid-cols-2 gap-4">
          <ListBlock title="Modules" items={project.modules} />
          <ListBlock title="Integrations" items={project.integrations} />
          <ListBlock title="Requirements" items={project.requirements} />
          <ListBlock title="Tech stack" items={project.tech_stack} />
          <ListBlock title="Constraints" items={project.constraints} />
          <ListBlock title="Team composition" items={project.team_composition} />
        </div>
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
            Total planned effort: {formatNumber(plannedEffort, "person-days")}
          </p>
        </div>

        {project.implementation_plan.length > 0 ? (
          <div className="mt-5 space-y-4">
            {project.implementation_plan.map((phase, index) => (
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
                    {phase.tasks.map((task) => (
                      <li key={task} className="flex gap-2">
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
        <ListBlock title="Assumptions" items={project.assumptions} />
        <section className="pdf-avoid-break rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Risks
          </h2>
          {project.risks.length > 0 ? (
            <ul className="mt-3 space-y-3 text-sm leading-6 text-slate-700">
              {project.risks.map((risk, index) => (
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
        <ListBlock title="Questions & ambiguities" items={project.questions} />
        <section className="pdf-avoid-break rounded-2xl border border-slate-200 bg-slate-50 p-5">
          <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Notes
          </h2>
          <p className="mt-3 whitespace-pre-line text-sm leading-6 text-slate-700">
            {project.notes?.trim() || "No notes provided."}
          </p>
        </section>
      </div>

      <section className="pdf-avoid-break mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
          Supporting documents
        </h2>
        {documents.length > 0 ? (
          <ul className="mt-4 space-y-3 text-sm text-slate-700">
            {documents.map((document, index) => (
              <li
                key={document.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3"
              >
                <span className="font-medium text-slate-900">{document.filename}</span>
                <span className="shrink-0 text-xs text-slate-500">
                  Added {formatDate(document.created_at)}
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-4 text-sm italic text-slate-400">No documents attached.</p>
        )}
      </section>
    </div>
  );
}