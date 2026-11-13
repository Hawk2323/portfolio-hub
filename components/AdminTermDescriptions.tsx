"use client";

import { useMemo, useState } from "react";
import type { ProjectsFile } from "@/lib/schema";

type TermKind = "technologies" | "tools";
type TermRow = { kind: TermKind; name: string; sections: string[]; description: string };
type Props = { data: ProjectsFile; busy: boolean; onChange: (data: ProjectsFile) => void; onSave: () => void };

export default function AdminTermDescriptions({ data, busy, onChange, onSave }: Props) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(true);
  const [expanded, setExpanded] = useState<string[]>([]);

  const terms = useMemo<TermRow[]>(() => {
    const results: TermRow[] = [];
    for (const kind of ["technologies", "tools"] as TermKind[]) {
      const usage = new Map<string, Set<string>>();
      for (const project of data.projects) {
        for (const name of project[kind]) {
          if (!usage.has(name)) usage.set(name, new Set<string>());
          const title = data.sections.find((section) => section.id === project.section)?.title ?? project.section;
          usage.get(name)?.add(title);
        }
      }
      for (const [name, sections] of usage) {
        results.push({ kind, name, sections: [...sections], description: data.termDescriptions[kind][name] ?? "" });
      }
    }
    return results.sort((a, b) => a.name.localeCompare(b.name, "cs") || a.kind.localeCompare(b.kind));
  }, [data]);

  const missingCount = terms.filter((term) => !term.description.trim()).length;
  const visible = terms.filter((term) =>
    (kindFilter === "all" || term.kind === kindFilter) &&
    (!onlyMissing || !term.description.trim()) &&
    (term.name.toLocaleLowerCase("cs").includes(query.toLocaleLowerCase("cs")) || term.sections.some((section) => section.toLocaleLowerCase("cs").includes(query.toLocaleLowerCase("cs"))))
  );

  function updateDescription(kind: TermKind, name: string, description: string) {
    onChange({
      ...data,
      termDescriptions: {
        ...data.termDescriptions,
        [kind]: { ...data.termDescriptions[kind], [name]: description }
      }
    });
  }

  function toggle(key: string) {
    setExpanded((previous) => previous.includes(key) ? previous.filter((item) => item !== key) : [...previous, key]);
  }

  return (
    <div className="grid gap-5 rounded-xl bg-white p-5 shadow-soft ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Technologie a nástroje</h2>
          <p className="mt-1 text-sm text-slate-600">Každá technologie má jeden společný popis pro všechny projekty. Popis se na veřejném webu zobrazí po najetí myší.</p>
          <p className="mt-2 text-sm font-medium text-slate-600">{terms.length} unikátních pojmů · {missingCount} bez popisu</p>
        </div>
        <button className="admin-button-primary" type="button" disabled={busy} onClick={onSave}>Uložit popisy</button>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <input className="admin-input min-w-48 flex-1" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hledat technologii nebo nástroj…" aria-label="Hledat technologii nebo nástroj" />
        <select className="admin-input" value={kindFilter} onChange={(event) => setKindFilter(event.target.value)} aria-label="Typ pojmu">
          <option value="all">Vše</option><option value="technologies">Technologie</option><option value="tools">Nástroje</option>
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={onlyMissing} onChange={(event) => setOnlyMissing(event.target.checked)} /> Jen bez popisu
        </label>
      </div>
      <div className="grid gap-2">
        {visible.length === 0 ? <p className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-500">Žádné odpovídající položky.</p> : null}
        {visible.map((term) => {
          const key = term.kind + ":" + term.name;
          const open = expanded.includes(key);
          const missing = !term.description.trim();
          return (
            <div className="rounded-lg border border-slate-200" key={key}>
              <button type="button" className="flex w-full flex-wrap items-center justify-between gap-2 px-4 py-3 text-left hover:bg-slate-50" onClick={() => toggle(key)} aria-expanded={open}>
                <span className="flex flex-wrap items-center gap-2">
                  <span className="font-semibold text-ink">{term.name}</span>
                  <span className="text-xs text-slate-500">{term.kind === "tools" ? "Nástroj" : "Technologie"} · {term.sections.join(", ")}</span>
                </span>
                <span className="flex items-center gap-2 text-xs">
                  {missing ? <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">Bez popisu</span> : <span className="text-pine">Vyplněno</span>}
                  <span className="text-slate-500">{open ? "▲" : "▼"}</span>
                </span>
              </button>
              {open ? (
                <div className="border-t border-slate-100 p-3">
                  <textarea aria-label={"Popis: " + term.name} className="admin-input min-h-24 w-full" value={term.description} onChange={(event) => updateDescription(term.kind, term.name, event.target.value)} placeholder="Co to je a jakou roli to má v projektu?" />
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
