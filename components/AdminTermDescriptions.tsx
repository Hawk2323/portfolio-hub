"use client";

import type { ProjectsFile } from "@/lib/schema";

type TermKind = "technologies" | "tools";

type Props = {
  data: ProjectsFile;
  busy: boolean;
  onChange: (data: ProjectsFile) => void;
  onSave: () => void;
};

export default function AdminTermDescriptions({ data, busy, onChange, onSave }: Props) {
  const sections = [...data.sections].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
  const usedTerms = collectAllTerms(data);
  const missingCount = countMissingDescriptions(data, usedTerms);

  function updateDescription(kind: TermKind, term: string, description: string) {
    onChange({
      ...data,
      termDescriptions: {
        ...data.termDescriptions,
        [kind]: {
          ...data.termDescriptions[kind],
          [term]: description
        }
      }
    });
  }

  return (
    <div className="rounded-lg bg-white p-5 shadow-soft ring-1 ring-slate-200">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Technology &amp; tool descriptions</h2>
          <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-600">
            Descriptions are shared globally by exact name. The same technology or tool therefore uses one tooltip text everywhere it appears.
          </p>
          <p className="mt-1 text-xs font-semibold text-slate-500">
            Missing descriptions: {missingCount}
          </p>
        </div>
        <button type="button" className="admin-button-primary" onClick={onSave} disabled={busy}>
          Save descriptions
        </button>
      </div>

      <div className="grid gap-5">
        {sections.map((section) => {
          const sectionProjects = data.projects.filter((project) => project.section === section.id);
          const technologies = uniqueSorted(sectionProjects.flatMap((project) => project.technologies));
          const tools = uniqueSorted(sectionProjects.flatMap((project) => project.tools));

          if (technologies.length === 0 && tools.length === 0) return null;

          return (
            <section key={section.id} className="rounded-lg border border-slate-200 p-4">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-lg font-semibold text-ink">{section.title}</h3>
                <span className="text-xs font-semibold text-slate-500">
                  {technologies.length} technologies · {tools.length} tools
                </span>
              </div>

              <div className="grid gap-5 lg:grid-cols-2">
                <TermGroup
                  label="Technologies"
                  kind="technologies"
                  terms={technologies}
                  descriptions={data.termDescriptions.technologies}
                  onChange={updateDescription}
                />
                <TermGroup
                  label="Tools"
                  kind="tools"
                  terms={tools}
                  descriptions={data.termDescriptions.tools}
                  onChange={updateDescription}
                />
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function TermGroup({
  label,
  kind,
  terms,
  descriptions,
  onChange
}: {
  label: string;
  kind: TermKind;
  terms: string[];
  descriptions: Record<string, string>;
  onChange: (kind: TermKind, term: string, description: string) => void;
}) {
  if (terms.length === 0) {
    return (
      <div>
        <h4 className="mb-2 text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</h4>
        <p className="text-sm text-slate-400">None used in this section.</p>
      </div>
    );
  }

  return (
    <div className="grid content-start gap-3">
      <h4 className="text-sm font-semibold uppercase tracking-wide text-slate-500">{label}</h4>
      {terms.map((term) => {
        const description = descriptions[term] ?? "";
        const missing = description.trim().length === 0;

        return (
          <label key={term} className="grid gap-1 rounded-md bg-slate-50 p-3 ring-1 ring-slate-200">
            <span className="flex flex-wrap items-center justify-between gap-2 text-sm font-semibold text-slate-700">
              {term}
              {missing ? (
                <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-700 ring-1 ring-amber-200">
                  Missing
                </span>
              ) : null}
            </span>
            <textarea
              className="admin-input min-h-20 resize-y"
              value={description}
              placeholder="Short tooltip explanation: what it is, what it is used for, and its role in the project."
              onChange={(event) => onChange(kind, term, event.target.value)}
            />
          </label>
        );
      })}
    </div>
  );
}

function collectAllTerms(data: ProjectsFile) {
  return {
    technologies: uniqueSorted(data.projects.flatMap((project) => project.technologies)),
    tools: uniqueSorted(data.projects.flatMap((project) => project.tools))
  };
}

function countMissingDescriptions(data: ProjectsFile, terms: { technologies: string[]; tools: string[] }) {
  return terms.technologies.filter((term) => !(data.termDescriptions.technologies[term] ?? "").trim()).length
    + terms.tools.filter((term) => !(data.termDescriptions.tools[term] ?? "").trim()).length;
}

function uniqueSorted(items: string[]) {
  return [...new Set(items)].sort((a, b) => a.localeCompare(b));
}
