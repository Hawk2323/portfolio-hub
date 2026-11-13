"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { TermKind, TermOption } from "@/lib/termCatalog";
import { TERM_CATEGORIES } from "@/lib/termCatalog";

type Props = {
  kind: TermKind;
  title: string;
  selected: string[];
  catalog: TermOption[];
  disabled?: boolean;
  onChange: (items: string[]) => void;
  onCreate: (kind: TermKind, name: string, category: string, description: string) => void;
};

export default function TermPicker({ kind, title, selected, catalog, disabled = false, onChange, onCreate }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [newCategory, setNewCategory] = useState(TERM_CATEGORIES[kind][0]);
  const [newDescription, setNewDescription] = useState("");
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const searchInput = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !root.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [open]);

  useEffect(() => {
    if (open && !creating) searchInput.current?.focus();
  }, [open, creating]);

  const byName = useMemo(
    () => new Map(catalog.map((item) => [item.name, item])),
    [catalog]
  );
  const filtered = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("cs");
    return catalog.filter((item) =>
      !q || [item.name, item.category, item.description].some((text) => text.toLocaleLowerCase("cs").includes(q))
    );
  }, [catalog, search]);

  const groups = useMemo(() => {
    const mapping = new Map<string, TermOption[]>();
    for (const item of filtered) {
      if (!mapping.has(item.category)) mapping.set(item.category, []);
      mapping.get(item.category)?.push(item);
    }
    return [...mapping.entries()];
  }, [filtered]);

  function toggleSelected(name: string) {
    if (disabled) return;
    onChange(selected.includes(name) ? selected.filter((item) => item !== name) : [...selected, name]);
  }

  function beginCreate() {
    setNewName(search.trim());
    setNewCategory(TERM_CATEGORIES[kind][0]);
    setNewDescription("");
    setError("");
    setCreating(true);
  }

  function createTerm() {
    if (disabled) return;
    const name = newName.trim().replace(/\s+/g, " ");
    if (!name || !newDescription.trim()) {
      setError("Vyplň název i stručný popis nové položky.");
      return;
    }
    const duplicate = catalog.find((item) => item.name.toLocaleLowerCase("cs") === name.toLocaleLowerCase("cs"));
    if (duplicate) {
      setError("Položka už existuje. Vyber ji ze seznamu: " + duplicate.name);
      return;
    }
    try {
      onCreate(kind, name, newCategory, newDescription);
      onChange([...selected, name]);
      setCreating(false);
      setSearch("");
      setNewName("");
      setNewDescription("");
      setError("");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Položku se nepodařilo přidat.");
    }
  }

  return (
    <div className="grid min-w-0 gap-2" ref={root} onKeyDown={(event) => {
      if (event.key === "Escape" && open) { event.stopPropagation(); setOpen(false); }
    }}>
      <span className="text-sm font-medium text-slate-700">{title}</span>
      <div className="flex min-h-11 flex-wrap items-center gap-1.5 rounded-lg border border-slate-200 bg-white p-2">
        {selected.map((name) => (
          <span key={name} title={byName.get(name)?.description ?? "Bez popisu"} className="inline-flex max-w-full items-center gap-1 rounded-full bg-pine/10 px-2.5 py-1 text-xs font-semibold text-pine">
            <span className="truncate">{name}</span>
            <button type="button" disabled={disabled} className="rounded-full px-1 hover:bg-pine/10 disabled:opacity-50" aria-label={"Odebrat " + name} onClick={() => toggleSelected(name)}>×</button>
          </span>
        ))}
        <button type="button" disabled={disabled} aria-expanded={open} aria-haspopup="listbox"
          className="min-h-7 flex-1 rounded px-2 text-left text-sm text-slate-500 hover:bg-slate-50 disabled:opacity-50"
          onClick={() => { setOpen((previous) => !previous); setCreating(false); setError(""); }}>
          {selected.length ? "+ Přidat další" : "Vybrat ze seznamu…"} <span aria-hidden="true">▾</span>
        </button>
      </div>
      {open ? (
        <div className="z-30 rounded-lg border border-slate-200 bg-white p-3 shadow-lg">
          {!creating ? (
            <div className="grid gap-3">
              <input ref={searchInput} type="search" className="admin-input w-full" placeholder={"Hledat " + (kind === "tools" ? "nástroj…" : "technologii…")}
                aria-label={"Hledat " + title.toLocaleLowerCase("cs")} value={search} onChange={(event) => setSearch(event.target.value)} />
              <div role="listbox" aria-multiselectable="true" aria-label={title} className="max-h-72 overflow-auto rounded border border-slate-100">
                {groups.length === 0 ? <p className="px-3 py-4 text-sm text-slate-500">Žádná položka neodpovídá hledání.</p> : null}
                {groups.map(([category, terms]) => (
                  <div key={category}>
                    <p className="sticky top-0 bg-slate-100 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600">{category}</p>
                    {terms.map((term) => {
                      const checked = selected.includes(term.name);
                      return (
                        <button key={term.name} type="button" role="option" aria-selected={checked} onClick={() => toggleSelected(term.name)}
                          className={"flex w-full items-start gap-2 border-b border-slate-50 px-3 py-2.5 text-left hover:bg-slate-50 " + (checked ? "bg-pine/5" : "")}>
                          <span aria-hidden="true" className={"mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border text-xs " + (checked ? "border-pine bg-pine text-white" : "border-slate-300")}>{checked ? "✓" : ""}</span>
                          <span className="grid gap-0.5">
                            <span className="text-sm font-semibold text-ink">{term.name}</span>
                            <span className="text-xs leading-5 text-slate-500">{term.description || "Popis zatím není vyplněn."}</span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
              <div className="flex flex-wrap justify-between gap-2">
                <button type="button" className="admin-button-secondary" onClick={beginCreate}>+ Nová položka</button>
                <button type="button" className="admin-button-secondary" onClick={() => setOpen(false)}>Hotovo</button>
              </div>
            </div>
          ) : (
            <div className="grid gap-3">
              <h4 className="text-sm font-semibold text-ink">Nová {kind === "tools" ? "položka – nástroj" : "technologie / vlastnost"}</h4>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Název *
                <input className="admin-input" value={newName} maxLength={80} onChange={(event) => setNewName(event.target.value)} />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Kategorie *
                <select className="admin-input" value={newCategory} onChange={(event) => setNewCategory(event.target.value)}>
                  {TERM_CATEGORIES[kind].map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Stručný popis *
                <textarea className="admin-input min-h-20" value={newDescription} maxLength={500} placeholder="Jednou větou vysvětli, o co jde." onChange={(event) => setNewDescription(event.target.value)} />
              </label>
              {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
              <p className="text-xs text-slate-500">Položka se přidá do výběru a katalogu. Do GitHubu se uloží až při uložení projektu.</p>
              <div className="flex flex-wrap justify-end gap-2">
                <button type="button" className="admin-button-secondary" onClick={() => {setCreating(false);setError("");}}>Zpět na seznam</button>
                <button type="button" className="admin-button-primary" onClick={createTerm}>Přidat položku</button>
              </div>
            </div>
          )}
        </div>
      ) : null}
      <p className="text-xs font-normal text-slate-500">Můžeš vybrat více položek. U každé vidíš kategorii a vysvětlení.</p>
    </div>
  );
}
