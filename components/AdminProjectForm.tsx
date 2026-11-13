"use client";

import Image from "next/image";
import { useEffect, useState, type FormEvent } from "react";
import type { PortfolioProject, PortfolioSection, ProjectSource, ProjectStatus, ProjectVisibility, SectionLinkMode, ThumbnailMode } from "@/lib/schema";
import { slugify } from "@/lib/slug";
import type { TermKind, TermOption } from "@/lib/termCatalog";
import TermPicker from "./TermPicker";

type Props = {
  project: PortfolioProject;
  sections: PortfolioSection[];
  isNew: boolean;
  busy: boolean;
  technologyCatalog: TermOption[];
  toolCatalog: TermOption[];
  onCreateTerm: (kind: TermKind, name: string, category: string, description: string) => void;
  onChange: (project: PortfolioProject) => void;
  onSave: (project: PortfolioProject, file: File | null) => Promise<boolean>;
  onCancel: () => void;
};

const statusOptions: { value: ProjectStatus; label: string }[] = [
  { value: "idea", label: "Nápad" },
  { value: "wip", label: "Ve vývoji" },
  { value: "live", label: "V provozu" },
  { value: "paused", label: "Pozastaveno" },
  { value: "archived", label: "Archivováno" }
];
const visibilityOptions: { value: ProjectVisibility; label: string }[] = [
  { value: "public", label: "Veřejný – zobrazit v portfoliu" },
  { value: "unlisted", label: "Nezařazený – nezobrazovat v přehledu" },
  { value: "private", label: "Soukromý – nezobrazovat v přehledu" }
];
const linkOptions: { value: SectionLinkMode; label: string }[] = [
  { value: "standard", label: "Běžný odkaz" },
  { value: "vpn", label: "Interní / VPN" }
];

export function createEmptyProject(section: string, linkMode: SectionLinkMode = "standard"): PortfolioProject {
  return {
    id: "novy-projekt", title: "", slug: "novy-projekt", section,
    status: "wip", url: "", description: "", linkMode,
    technologies: [], tools: ["AI"], visibility: "private",
    thumbnail: "/thumbnails/_fallback.webp", thumbnailMode: "auto",
    thumbnailLocked: false, thumbnailGeneratedAt: null,
    featured: false, sortOrder: 100, source: "manual", notesPrivate: ""
  };
}

export default function AdminProjectForm({ project, sections, isNew, busy, technologyCatalog, toolCatalog, onCreateTerm, onChange, onSave, onCancel }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [advanced, setAdvanced] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!file) {
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setFilePreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  function update<K extends keyof PortfolioProject>(key: K, value: PortfolioProject[K]) {
    onChange({ ...project, [key]: value });
  }

  function updateTitle(title: string) {
    if (isNew) {
      const slug = slugify(title.trim() || "novy-projekt");
      onChange({ ...project, title, slug, id: slug });
    } else {
      update("title", title);
    }
  }

  function cancel() {
    if (file && !window.confirm("Zahodit vybraný obrázek a odejít bez uložení?")) return;
    onCancel();
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (file && file.size > 6 * 1024 * 1024) {
      setError("Obrázek může mít nejvýše 6 MB.");
      return;
    }
    await onSave(project, file);
  }

  return (
    <form className="grid gap-5" onSubmit={(event) => void submit(event)}>
      <div className="sticky top-0 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white/95 px-4 py-3 shadow-sm backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-pine">{isNew ? "Nový projekt" : "Úprava projektu"}</p>
          <h2 className="text-xl font-semibold text-ink">{project.title || "Nový projekt"}</h2>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={cancel} className="admin-button-secondary" disabled={busy}>Zpět bez uložení</button>
          <button type="submit" className="admin-button-primary" disabled={busy}>{busy ? "Ukládám…" : "Uložit změny"}</button>
        </div>
      </div>

      <section className="rounded-xl bg-white p-5 shadow-soft ring-1 ring-slate-200 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">Základní údaje</h3>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Název projektu *
            <input className="admin-input" required maxLength={160} value={project.title} onChange={(event) => updateTitle(event.target.value)} placeholder="Např. Přehled docházky" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            URL projektu *
            <input className="admin-input" type="url" required value={project.url} onChange={(event) => update("url", event.target.value)} placeholder="https://…" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700 md:col-span-2">
            Popis projektu *
            <textarea className="admin-input min-h-28" required value={project.description} onChange={(event) => update("description", event.target.value)} placeholder="Stručně: k čemu projekt slouží?" />
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Sekce
            <select className="admin-input" value={project.section} onChange={(event) => {
              const section = sections.find((item) => item.id === event.target.value);
              onChange({ ...project, section: event.target.value, linkMode: isNew ? (section?.linkMode ?? project.linkMode) : project.linkMode });
            }}>
              {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Stav projektu
            <select className="admin-input" value={project.status} onChange={(event) => update("status", event.target.value as ProjectStatus)}>
              {statusOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Viditelnost
            <select className="admin-input" value={project.visibility} onChange={(event) => update("visibility", event.target.value as ProjectVisibility)}>
              {visibilityOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <span className="text-xs font-normal text-slate-500">Na veřejné stránce se zobrazují pouze veřejné projekty.</span>
          </label>
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">
            Typ odkazu
            <select className="admin-input" value={project.linkMode} onChange={(event) => update("linkMode", event.target.value as SectionLinkMode)}>
              {linkOptions.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
            <span className="text-xs font-normal text-slate-500">Interní / VPN na veřejném webu zobrazí náhled namísto otevření interní adresy.</span>
          </label>
        </div>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-soft ring-1 ring-slate-200 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">Náhled projektu</h3>
        <div className="grid items-start gap-5 md:grid-cols-[minmax(0,320px)_1fr]">
          <div className="overflow-hidden rounded-lg bg-slate-100 p-2 ring-1 ring-slate-200">
            <Image src={filePreview ?? project.thumbnail ?? "/thumbnails/_fallback.webp"} alt="Náhled projektu" width={1200} height={760} unoptimized className="aspect-[1200/760] w-full rounded-md bg-white object-contain" />
          </div>
          <div className="grid gap-3">
            <label className="grid gap-1.5 text-sm font-medium text-slate-700">
              Nahrát vlastní obrázek
              <input className="admin-input w-full" type="file" accept="image/png,image/jpeg,image/webp" disabled={busy} onChange={(event) => setFile(event.target.files?.[0] ?? null)} />
            </label>
            {file ? <p className="text-sm text-pine">Vybráno: {file.name}. Obrázek se nahraje až po kliknutí na „Uložit změny“.</p> : null}
            <p className="text-xs leading-5 text-slate-500">PNG, JPG nebo WebP, maximálně 6 MB. Vlastní obrázek zůstane chráněný před automatickým přegenerováním.</p>
            {file ? <button type="button" className="admin-button-secondary justify-self-start" onClick={() => setFile(null)}>Zrušit výběr obrázku</button> : null}
          </div>
        </div>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-soft ring-1 ring-slate-200 sm:p-6">
        <h3 className="mb-4 text-lg font-semibold text-ink">Technologie a nástroje</h3>
        <div className="grid items-start gap-4 md:grid-cols-2">
          <TermPicker kind="technologies" title="Technologie a vlastnosti"
            selected={project.technologies} catalog={technologyCatalog} disabled={busy}
            onChange={(items) => update("technologies", items)} onCreate={onCreateTerm} />
          <TermPicker kind="tools" title="Použité nástroje"
            selected={project.tools} catalog={toolCatalog} disabled={busy}
            onChange={(items) => update("tools", items)} onCreate={onCreateTerm} />
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={project.featured} onChange={(event) => update("featured", event.target.checked)} />
          Zvýraznit projekt na začátku sekce
        </label>
      </section>

      <section className="rounded-xl bg-white p-5 shadow-soft ring-1 ring-slate-200 sm:p-6">
        <label className="grid gap-1.5 text-sm font-medium text-slate-700">
          Poznámky (nezobrazují se na webu; jsou ale v GitHub repozitáři)
          <textarea className="admin-input min-h-24" value={project.notesPrivate} onChange={(event) => update("notesPrivate", event.target.value)} />
        </label>
      </section>

      <section className="rounded-xl bg-white shadow-soft ring-1 ring-slate-200">
        <button type="button" className="flex w-full items-center justify-between p-5 text-left font-semibold text-ink" onClick={() => setAdvanced(!advanced)} aria-expanded={advanced}>
          Pokročilé nastavení <span className="text-sm font-normal text-slate-500">{advanced ? "Skrýt −" : "Zobrazit +"}</span>
        </button>
        {advanced ? (
          <div className="grid gap-4 border-t border-slate-100 p-5 md:grid-cols-2">
            <label className="grid gap-1 text-sm font-medium text-slate-700">Interní ID
              <input className="admin-input bg-slate-50" value={project.id} readOnly title="Interní ID zůstává u existujících projektů neměnné." />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Slug náhledu
              <input className="admin-input bg-slate-50" value={project.slug} readOnly />
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Zdroj
              <select className="admin-input" value={project.source} onChange={(event) => update("source", event.target.value as ProjectSource)}>
                <option value="manual">Ručně</option><option value="pact">PACT</option><option value="external">Externí</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700">Režim náhledu
              <select className="admin-input" disabled={Boolean(file)} value={file ? "manual" : project.thumbnailMode} onChange={(event) => update("thumbnailMode", event.target.value as ThumbnailMode)}>
                <option value="auto">Automatický</option><option value="manual">Vlastní</option><option value="fallback">Zástupný</option>
              </select>
            </label>
            <label className="grid gap-1 text-sm font-medium text-slate-700 md:col-span-2">Cesta k obrázku / URL
              <input className="admin-input" value={project.thumbnail} onChange={(event) => update("thumbnail", event.target.value)} disabled={Boolean(file)} />
            </label>
            <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
              <input type="checkbox" checked={file ? true : project.thumbnailLocked} disabled={Boolean(file)} onChange={(event) => update("thumbnailLocked", event.target.checked)} />
              Zamknout náhled proti automatické aktualizaci
            </label>
            <p className="text-sm text-slate-500">Pořadí projektu se mění šipkami v seznamu projektů.</p>
          </div>
        ) : null}
      </section>
      {error ? <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
      <div className="flex justify-end gap-2 pb-8">
        <button type="button" className="admin-button-secondary" onClick={cancel} disabled={busy}>Zrušit</button>
        <button type="submit" className="admin-button-primary" disabled={busy}>{busy ? "Ukládám…" : "Uložit změny"}</button>
      </div>
    </form>
  );
}
