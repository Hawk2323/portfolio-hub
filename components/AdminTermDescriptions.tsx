"use client";

import { useMemo, useState } from "react";
import type { ProjectsFile } from "@/lib/schema";
import { addTermToCatalog, getTermCatalog, TERM_CATEGORIES, type TermKind, type TermOption } from "@/lib/termCatalog";

type Props = { data: ProjectsFile; busy: boolean; onChange: (data: ProjectsFile) => void; onSave: () => void };
type Row = TermOption & { kind: TermKind };

export default function AdminTermDescriptions({ data, busy, onChange, onSave }: Props) {
  const [query, setQuery] = useState("");
  const [kindFilter, setKindFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [onlyMissing, setOnlyMissing] = useState(false);
  const [expanded, setExpanded] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);
  const [newKind, setNewKind] = useState<TermKind>("technologies");
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(TERM_CATEGORIES.technologies[0]);
  const [newDescription, setNewDescription] = useState("");
  const [addError, setAddError] = useState("");

  const terms = useMemo<Row[]>(() => [
    ...getTermCatalog(data, "technologies").map((item) => ({ ...item, kind: "technologies" as const })),
    ...getTermCatalog(data, "tools").map((item) => ({ ...item, kind: "tools" as const }))
  ], [data]);
  const missingCount = terms.filter((item) => !item.description.trim()).length;

  const visible = terms.filter((item) => (
    (kindFilter === "all" || item.kind === kindFilter) &&
    (categoryFilter === "all" || item.category === categoryFilter) &&
    (!onlyMissing || !item.description.trim() || expanded.includes(item.kind + ":" + item.name)) &&
    [item.name, item.category, item.description].some((text) => text.toLocaleLowerCase("cs").includes(query.trim().toLocaleLowerCase("cs")))
  ));
  const groups = useMemo(() => {
    const categories = new Map<string, Row[]>();
    for (const term of visible) {
      const key = term.kind + ":" + term.category;
      if (!categories.has(key)) categories.set(key, []);
      categories.get(key)?.push(term);
    }
    return [...categories.entries()];
  }, [visible]);
  const allCategories = [...new Set(terms.map((item) => item.category))].sort((a, b) => a.localeCompare(b, "cs"));

  function updateTerm(kind: TermKind, name: string, field: "category" | "description", value: string) {
    if (field === "category") {
      onChange({
        ...data,
        termCategories: { ...data.termCategories, [kind]: { ...data.termCategories[kind], [name]: value } }
      });
    } else {
      onChange({
        ...data,
        termDescriptions: { ...data.termDescriptions, [kind]: { ...data.termDescriptions[kind], [name]: value } }
      });
    }
  }

  function toggle(key: string) {
    setExpanded((items) => items.includes(key) ? items.filter((item) => item !== key) : [...items, key]);
  }

  function addNewTerm() {
    try {
      const next = addTermToCatalog(data, newKind, newName, newCategory, newDescription);
      onChange(next);
      setCreating(false);
      setNewName("");
      setNewDescription("");
      setAddError("");
    } catch (caught) {
      setAddError(caught instanceof Error ? caught.message : "Položku se nepodařilo přidat.");
    }
  }

  return (
    <section className="grid gap-5 rounded-xl bg-white p-5 shadow-soft ring-1 ring-slate-200 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-ink">Katalog technologií a nástrojů</h2>
          <p className="mt-1 max-w-3xl text-sm text-slate-600">
            Sdílený katalog pro všechny projekty. Každý pojem má kategorii a vysvětlení, které se zobrazí i na veřejném portfoliu.
          </p>
          <p className="mt-2 text-sm text-slate-500">{terms.filter((term) => term.kind === "technologies").length} technologií · {terms.filter((term) => term.kind === "tools").length} nástrojů · {missingCount} bez popisu</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className="admin-button-secondary" type="button" onClick={() => setCreating(!creating)}>{creating ? "Zavřít přidávání" : "+ Nová položka"}</button>
          <button className="admin-button-primary" type="button" disabled={busy} onClick={onSave}>Uložit katalog</button>
        </div>
      </div>
      {creating ? (
        <div className="grid gap-3 rounded-lg border border-pine/20 bg-pine/5 p-4">
          <h3 className="font-semibold text-ink">Přidat pojem do katalogu</h3>
          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-slate-700">Typ položky
              <select className="admin-input" value={newKind} onChange={(event) => {
                const kind = event.target.value as TermKind;
                setNewKind(kind); setNewCategory(TERM_CATEGORIES[kind][0]);
              }}>
                <option value="technologies">Technologie</option>
                <option value="tools">Nástroj</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Kategorie
              <select className="admin-input" value={newCategory} onChange={(event) => setNewCategory(event.target.value)}>
                {TERM_CATEGORIES[newKind].map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Název *
              <input className="admin-input" value={newName} maxLength={80} onChange={(event) => setNewName(event.target.value)} />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Stručný popis *
              <textarea className="admin-input min-h-20" maxLength={500} value={newDescription} onChange={(event) => setNewDescription(event.target.value)} />
            </label>
          </div>
          {addError ? <p role="alert" className="text-sm text-red-700">{addError}</p> : null}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-slate-500">Nová položka bude nabízena v editorech projektů po uložení katalogu.</p>
            <button className="admin-button-primary" type="button" onClick={addNewTerm}>Přidat do katalogu</button>
          </div>
        </div>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <input className="admin-input min-w-48 flex-1" type="search" placeholder="Hledat název, kategorii nebo popis…" aria-label="Hledat položku katalogu" value={query} onChange={(event) => setQuery(event.target.value)} />
        <select className="admin-input" value={kindFilter} aria-label="Filtrovat typ" onChange={(event) => {setKindFilter(event.target.value);setCategoryFilter("all");}}>
          <option value="all">Technologie i nástroje</option>
          <option value="technologies">Technologie</option>
          <option value="tools">Nástroje</option>
        </select>
        <select className="admin-input" value={categoryFilter} aria-label="Filtrovat kategorii" onChange={(event) => setCategoryFilter(event.target.value)}>
          <option value="all">Všechny kategorie</option>
          {allCategories.filter((category) =>
            kindFilter === "all" || terms.some((term) => term.kind === kindFilter && term.category === category)
          ).map((category) => <option key={category} value={category}>{category}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={onlyMissing} onChange={(event) => setOnlyMissing(event.target.checked)} /> Jen bez popisu
        </label>
      </div>
      {visible.length === 0 ? <p className="rounded-lg border border-dashed border-slate-200 p-5 text-sm text-slate-600">Žádné položky neodpovídají filtru.</p> : null}
      <div className="grid gap-5">
        {groups.map(([key,items]) => {
          const kind = items[0].kind;
          const category = items[0].category;
          return (
            <div key={key} className="overflow-hidden rounded-lg border border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-50 px-4 py-3">
                <h3 className="font-semibold text-ink">{kind === "technologies" ? "Technologie" : "Nástroje"} / {category}</h3>
                <span className="text-xs text-slate-500">{items.length} položek</span>
              </div>
              {items.map((term) => {
                const id = term.kind + ":" + term.name;
                const open = expanded.includes(id);
                return (
                  <div key={id} className="border-t border-slate-100">
                    <button type="button" aria-expanded={open} className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left hover:bg-slate-50" onClick={() => toggle(id)}>
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink">{term.name}</span>
                        <span className="mt-0.5 block text-xs text-slate-500">{term.description || "Popis chybí."}</span>
                      </span>
                      <span className="shrink-0 text-xs text-slate-500">{open ? "Skrýt ▲" : "Upravit ▼"}</span>
                    </button>
                    {open ? (
                      <div className="grid gap-3 border-t border-slate-100 bg-white p-4 md:grid-cols-[minmax(160px,1fr)_minmax(0,2fr)]">
                        <label className="grid gap-1 text-sm font-medium text-slate-700">Kategorie
                          <select className="admin-input" value={term.category} onChange={(event) => updateTerm(term.kind, term.name, "category", event.target.value)}>
                            {TERM_CATEGORIES[term.kind].map((category) => <option key={category} value={category}>{category}</option>)}
                          </select>
                        </label>
                        <label className="grid gap-1 text-sm font-medium text-slate-700">Popis
                          <textarea className="admin-input min-h-24" maxLength={500} value={term.description} onChange={(event) => updateTerm(term.kind, term.name, "description", event.target.value)} />
                        </label>
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          );
        })}
      </div>
    </section>
  );
}
