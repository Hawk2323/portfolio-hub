"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import type { PortfolioProject, PortfolioSection, ProjectsFile, SectionLinkMode } from "@/lib/schema";
import { slugify } from "@/lib/slug";
import AdminProjectForm, { createEmptyProject } from "./AdminProjectForm";
import AdminTermDescriptions from "./AdminTermDescriptions";

type Tab = "projects" | "sections" | "terms";
type Props = { editProjectId?: string };
const statusNames: Record<PortfolioProject["status"], string> = {
  idea: "Nápad", wip: "Ve vývoji", live: "V provozu", paused: "Pozastaveno", archived: "Archivováno"
};
const statusColors: Record<PortfolioProject["status"], string> = {
  idea: "bg-slate-100 text-slate-600", wip: "bg-amber-50 text-amber-700",
  live: "bg-emerald-50 text-emerald-700", paused: "bg-sky-50 text-sky-700",
  archived: "bg-slate-100 text-slate-500"
};
const visibilityNames: Record<PortfolioProject["visibility"], string> = {
  public: "Veřejný", unlisted: "Nezařazený", private: "Soukromý"
};
function sortSections(sections: PortfolioSection[]) {
  return [...sections].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "cs"));
}
function sortInSection(projects: PortfolioProject[]) {
  return [...projects].sort((a, b) =>
    Number(b.featured) - Number(a.featured) || a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "cs"));
}
function uniqueSectionId(sections: PortfolioSection[], base: string) {
  const ids = new Set(sections.map((section) => section.id));
  let result = base;
  let counter = 2;
  while (ids.has(result)) result = base + "-" + counter++;
  return result;
}

export default function AdminProjectList({ editProjectId }: Props) {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [sessionChecked, setSessionChecked] = useState(false);
  const [data, setData] = useState<ProjectsFile | null>(null);
  const [editing, setEditing] = useState<PortfolioProject | null>(null);
  const [initialEditing, setInitialEditing] = useState<PortfolioProject | null>(null);
  const [activeTab, setActiveTab] = useState<Tab>("projects");
  const [sectionFilter, setSectionFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [backHref, setBackHref] = useState("/admin");
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const savedDataRef = useRef<ProjectsFile | null>(null);
  const isEditor = editProjectId !== undefined;
  const isNew = editProjectId === "new";

  const sections = useMemo(() => sortSections(data?.sections ?? []), [data]);
  const sectionNameById = useMemo(() => new Map(sections.map((section) => [section.id, section.title])), [sections]);
  const sortedProjects = useMemo(() => {
    const order = new Map(sections.map((section, index) => [section.id, index]));
    return [...(data?.projects ?? [])].sort((a, b) =>
      (order.get(a.section) ?? 999) - (order.get(b.section) ?? 999) ||
      Number(b.featured) - Number(a.featured) ||
      a.sortOrder - b.sortOrder || a.title.localeCompare(b.title, "cs"));
  }, [data, sections]);
  const filteredProjects = useMemo(() =>
    sortedProjects.filter((project) =>
      (sectionFilter === "all" || project.section === sectionFilter) &&
      (statusFilter === "all" || project.status === statusFilter) &&
      (project.title.toLocaleLowerCase("cs").includes(query.toLocaleLowerCase("cs")) ||
        project.description.toLocaleLowerCase("cs").includes(query.toLocaleLowerCase("cs")))),
    [sortedProjects, sectionFilter, statusFilter, query]);

  const unsavedList = !isEditor && data !== null && savedDataRef.current !== null &&
    JSON.stringify(data) !== JSON.stringify(savedDataRef.current);
  const unsavedEditor = isEditor && Boolean(editing && (isNew || JSON.stringify(editing) !== JSON.stringify(initialEditing)));
  const unsaved = Boolean(unsavedList || unsavedEditor);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const targetTab = params.get("tab");
    if (targetTab === "sections" || targetTab === "terms") setActiveTab(targetTab);
    if (params.get("section")) setSectionFilter(params.get("section")!);
    if (params.get("q")) setQuery(params.get("q")!);
    if (params.get("status")) setStatusFilter(params.get("status")!);
    if (isEditor) {
      const back = params.get("back");
      if (back && back.startsWith("/admin") && !back.startsWith("//") && !back.includes("\\")) setBackHref(back);
    }

    let active = true;
    async function start() {
      try {
        const response = await fetch("/api/admin/session", { cache: "no-store" });
        if (!response.ok) throw new Error("Nepodařilo se zkontrolovat přihlášení.");
        const result = await response.json();
        if (!active) return;
        setAuthenticated(Boolean(result.authenticated));
        if (result.authenticated) await loadProjects();
      } catch (caught) {
        if (active) {
          setError(true);
          setMessage(caught instanceof Error ? caught.message : "Chyba připojení.");
        }
      } finally {
        if (active) setSessionChecked(true);
      }
    }
    void start();
    return () => { active = false; };
    // Initial route load only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editProjectId]);

  useEffect(() => {
    if (!unsaved) return;
    function warn(event: BeforeUnloadEvent) {
      event.preventDefault();
      event.returnValue = "";
    }
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [unsaved]);

  useEffect(() => {
    if (isEditor || !data) return;
    const focus = new URLSearchParams(window.location.search).get("focus");
    if (!focus) return;
    const node = document.getElementById("project-" + focus);
    node?.scrollIntoView({ block: "center" });
    // Scroll once after initial data load.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data === null, isEditor]);

  async function loadProjects() {
    try {
      const response = await fetch("/api/admin/projects", { cache: "no-store" });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Projekty se nepodařilo načíst.");
      const incoming = body as ProjectsFile;
      savedDataRef.current = incoming;
      setData(incoming);
      if (isEditor) {
        const item = isNew
          ? createEmptyProject(sortSections(incoming.sections)[0]?.id ?? "private", sortSections(incoming.sections)[0]?.linkMode ?? "standard")
          : incoming.projects.find((project) => project.id === editProjectId);
        setEditing(item ?? null);
        setInitialEditing(item ?? null);
        if (!item) throw new Error("Požadovaný projekt neexistuje.");
      }
      setError(false);
      setMessage("");
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "Chyba při načítání.");
    }
  }

  async function login() {
    if (busy) return;
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password })
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Přihlášení se nezdařilo.");
      setAuthenticated(true);
      setPassword("");
      await loadProjects();
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "Chyba přihlášení.");
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    if (unsaved && !window.confirm("Máte neuložené změny. Opravdu se odhlásit?")) return;
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setData(null);
    savedDataRef.current = null;
  }

  async function persist(nextData: ProjectsFile, confirmation = "Změny byly uloženy."): Promise<ProjectsFile | null> {
    setBusy(true);
    setMessage("");
    try {
      const response = await fetch("/api/admin/projects", {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(nextData)
      });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error ?? "Uložení se nezdařilo.");
      const saved = body as ProjectsFile;
      savedDataRef.current = saved;
      setData(saved);
      setError(false);
      setMessage(confirmation);
      return saved;
    } catch (caught) {
      setError(true);
      setMessage(caught instanceof Error ? caught.message : "Uložení se nezdařilo.");
      return null;
    } finally {
      setBusy(false);
    }
  }

  function editorBack() {
    if (unsavedEditor && !window.confirm("Zahodit neuložené změny projektu?")) return;
    window.location.href = backHref;
  }

  async function saveEditedProject(project: PortfolioProject, file: File | null): Promise<boolean> {
    if (!data || !editing || busy) return false;
    const title = project.title.trim();
    const description = project.description.trim();
    const url = project.url.trim();
    if (!title || !description || !/^https?:\/\//i.test(url)) {
      setError(true);
      setMessage("Vyplň název, popis a platnou HTTP(S) adresu projektu.");
      return false;
    }
    const newId = slugify(title);
    if (isNew && (!newId || data.projects.some((item) => item.id === newId || item.slug === newId))) {
      setError(true);
      setMessage("Projekt s tímto názvem / identifikátorem už existuje. Zvol jiný název.");
      return false;
    }
    const original = isNew ? null : data.projects.find((item) => item.id === editProjectId);
    if (!isNew && !original) {
      setError(true);
      setMessage("Původní projekt už neexistuje. Obnov přehled.");
      return false;
    }
    let nextProject: PortfolioProject = {
      ...project, title, description, url,
      id: original?.id ?? newId,
      slug: original?.slug ?? newId
    };
    if (file) {
      setBusy(true);
      setError(false);
      setMessage("");
      try {
        const form = new FormData();
        form.append("file", file);
        form.append("slug", nextProject.slug);
        const response = await fetch("/api/admin/upload-thumbnail", { method: "POST", body: form });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error ?? "Obrázek se nepodařilo nahrát.");
        nextProject = {
          ...nextProject, thumbnail: result.thumbnail,
          thumbnailMode: "manual", thumbnailLocked: true, thumbnailGeneratedAt: null
        };
      } catch (caught) {
        setError(true);
        setMessage(caught instanceof Error ? caught.message : "Chyba při nahrávání obrázku.");
        setBusy(false);
        return false;
      }
    }
    const projects = original
      ? data.projects.map((item) => item.id === original.id ? nextProject : item)
      : [...data.projects, nextProject];
    const saved = await persist({ ...data, projects }, "Projekt byl uložen.");
    if (saved) window.location.href = backHref;
    return Boolean(saved);
  }

  function updateSection(id: string, patch: Partial<PortfolioSection>) {
    if (!data) return;
    const original = data.sections.find((section) => section.id === id);
    if (!original) return;
    const linkModeChanged = patch.linkMode !== undefined && patch.linkMode !== original.linkMode;
    const affected = data.projects.filter((project) => project.section === id).length;
    if (linkModeChanged && affected > 0 &&
        !window.confirm("Změnit také typ odkazu u všech " + affected + " projektů v sekci " + original.title + "?")) return;
    setData({
      ...data,
      sections: data.sections.map((section) => section.id === id ? { ...section, ...patch } : section),
      projects: linkModeChanged
        ? data.projects.map((project) => project.section === id ? { ...project, linkMode: patch.linkMode! } : project)
        : data.projects
    });
  }

  function addSection() {
    if (!data) return;
    const id = uniqueSectionId(data.sections, "nova-sekce");
    const order = Math.max(0, ...data.sections.map((section) => section.sortOrder)) + 10;
    setData({ ...data, sections: [...data.sections, { id, title: "Nová sekce", description: "", sortOrder: order, linkMode: "standard" }] });
    setActiveTab("sections");
  }

  function removeSection(section: PortfolioSection) {
    if (!data) return;
    if (data.projects.some((project) => project.section === section.id)) {
      setError(true);
      setMessage("Sekce obsahuje projekty. Před odstraněním je přesuň do jiné sekce.");
      return;
    }
    if (!window.confirm("Odstranit sekci „" + section.title + "“? Změna se projeví po uložení.")) return;
    setData({ ...data, sections: data.sections.filter((item) => item.id !== section.id) });
  }

  function moveSection(section: PortfolioSection, direction: -1 | 1) {
    if (!data) return;
    const order = sortSections(data.sections);
    const at = order.findIndex((item) => item.id === section.id);
    const target = at + direction;
    if (target < 0 || target >= order.length) return;
    [order[at], order[target]] = [order[target], order[at]];
    const positions = new Map(order.map((item, index) => [item.id, (index + 1) * 10]));
    setData({ ...data, sections: data.sections.map((item) => ({ ...item, sortOrder: positions.get(item.id) ?? item.sortOrder })) });
  }

  function moveProject(project: PortfolioProject, direction: -1 | 1) {
    if (!data) return;
    const group = sortInSection(data.projects.filter((item) => item.section === project.section && item.featured === project.featured));
    const index = group.findIndex((item) => item.id === project.id);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= group.length) return;
    [group[index], group[target]] = [group[target], group[index]];
    const positions = new Map(group.map((item, position) => [item.id, (position + 1) * 10]));
    setData({ ...data, projects: data.projects.map((item) => positions.has(item.id) ? { ...item, sortOrder: positions.get(item.id)! } : item) });
  }

  async function archiveProject(project: PortfolioProject) {
    if (!data || busy) return;
    if (!window.confirm("Archivovat projekt „" + project.title + "“? Projekt se zároveň skryje z veřejného portfolia.")) return;
    await persist({
      ...data,
      projects: data.projects.map((item) => item.id === project.id ? { ...item, status: "archived", visibility: "private" } : item)
    }, "Projekt byl archivován.");
  }

  async function deleteProject(project: PortfolioProject) {
    if (!data || busy) return;
    if (!window.confirm("Trvale smazat projekt „" + project.title + "“ ze seznamu? Tuto akci nelze vrátit přímo v administraci.")) return;
    await persist({ ...data, projects: data.projects.filter((item) => item.id !== project.id) }, "Projekt byl odstraněn.");
  }

  function refresh() {
    if (unsavedList && !window.confirm("Zahodit neuložené změny a načíst projekty znovu?")) return;
    void loadProjects();
  }

  function returnUrl(projectId?: string) {
    const params = new URLSearchParams({
      tab: "projects", section: sectionFilter, status: statusFilter, q: query
    });
    if (projectId) params.set("focus", projectId);
    return "/admin?" + params.toString();
  }

  function editUrl(projectId: string) {
    return "/admin/projects/" + encodeURIComponent(projectId) + "/edit?back=" + encodeURIComponent(returnUrl(projectId));
  }

  if (!sessionChecked) return <p className="py-12 text-center text-slate-600">Ověřuji přihlášení…</p>;

  if (!authenticated) {
    return (
      <section className="mx-auto max-w-md rounded-xl bg-white p-6 shadow-soft ring-1 ring-slate-200">
        <h2 className="mb-4 text-xl font-semibold text-ink">Přihlášení do administrace</h2>
        <form onSubmit={(event) => { event.preventDefault(); void login(); }} className="grid gap-4">
          <label className="grid gap-1.5 text-sm font-medium text-slate-700">Heslo administrátora
            <input type="password" className="admin-input" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          </label>
          {message ? <p role="alert" className="text-sm text-red-700">{message}</p> : null}
          <button type="submit" className="admin-button-primary" disabled={busy}>{busy ? "Přihlašuji…" : "Přihlásit se"}</button>
        </form>
      </section>
    );
  }

  if (!data) return (
    <div className="grid gap-3">
      <p role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">{message || "Nepodařilo se načíst data."}</p>
      <button type="button" className="admin-button-secondary justify-self-start" onClick={() => void loadProjects()}>Zkusit znovu</button>
    </div>
  );

  if (isEditor) {
    return (
      <section className="grid gap-4">
        <div className="flex items-center justify-between gap-3">
          <button type="button" onClick={editorBack} className="admin-button-secondary">← Zpět na projekty</button>
          <span className="text-xs font-semibold uppercase tracking-wide text-pine">Portfolio Hub / Administrace</span>
        </div>
        {message ? <p role={error ? "alert" : "status"} className={"rounded-lg px-4 py-3 text-sm " + (error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800")}>{message}</p> : null}
        {editing ? (
          <AdminProjectForm
            key={isNew ? "new" : editProjectId}
            project={editing}
            sections={data.sections}
            isNew={isNew}
            busy={busy}
            onChange={setEditing}
            onSave={saveEditedProject}
            onCancel={editorBack}
          />
        ) : <div className="rounded-lg bg-white p-5 text-slate-700">Projekt nebyl nalezen. <Link href="/admin" className="underline">Zpět na přehled</Link></div>}
      </section>
    );
  }

  return (
    <section className="grid gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <nav className="flex flex-wrap gap-2" aria-label="Správa portfolia">
          {([["projects", "Projekty"], ["sections", "Sekce"], ["terms", "Technologie a nástroje"]] as const).map(([tab, label]) => (
            <button key={tab} type="button" aria-current={activeTab === tab ? "page" : undefined}
              className={activeTab === tab ? "admin-button-primary" : "admin-button-secondary"} onClick={() => setActiveTab(tab)}>
              {label}
              {tab === "projects" ? " (" + data.projects.length + ")" : tab === "sections" ? " (" + data.sections.length + ")" : ""}
            </button>
          ))}
        </nav>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="admin-button-secondary" disabled={busy} onClick={refresh}>Obnovit</button>
          <button type="button" className="admin-button-secondary" disabled={busy} onClick={() => void logout()}>Odhlásit</button>
        </div>
      </div>

      {unsavedList ? (
        <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-900 ring-1 ring-amber-200">
          <span>Máte neuložené změny v pořadí, sekcích nebo popisech.</span>
          <button type="button" className="admin-button-primary" disabled={busy} onClick={() => void persist(data)}>Uložit změny</button>
        </div>
      ) : null}
      {message ? <p role={error ? "alert" : "status"} className={"rounded-lg px-4 py-3 text-sm " + (error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-800")}>{message}</p> : null}

      {activeTab === "projects" ? (
        <div className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">Přehled projektů</h2>
              <p className="mt-1 text-sm text-slate-500">{filteredProjects.length} z {data.projects.length} projektů · šipkami lze měnit pořadí v rámci sekce</p>
            </div>
            <Link className="admin-button-primary" href={editUrl("new")}>+ Nový projekt</Link>
          </div>
          <div className="flex flex-wrap gap-3 rounded-xl bg-white p-4 shadow-soft ring-1 ring-slate-200">
            <input className="admin-input min-w-48 flex-1" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Hledat název nebo popis projektu…" aria-label="Hledat projekt" />
            <select className="admin-input" value={sectionFilter} onChange={(event) => setSectionFilter(event.target.value)} aria-label="Filtrovat podle sekce">
              <option value="all">Všechny sekce</option>
              {sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
            </select>
            <select className="admin-input" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Filtrovat podle stavu">
              <option value="all">Všechny stavy</option>
              {Object.entries(statusNames).map(([status, name]) => <option key={status} value={status}>{name}</option>)}
            </select>
          </div>
          <div className="overflow-hidden rounded-xl bg-white shadow-soft ring-1 ring-slate-200">
            {filteredProjects.length === 0 ? <p className="p-7 text-center text-sm text-slate-600">Žádný projekt neodpovídá filtrům.</p> : null}
            {filteredProjects.map((project) => {
              const group = sortInSection(data.projects.filter((item) => item.section === project.section && item.featured === project.featured));
              const pos = group.findIndex((item) => item.id === project.id);
              return (
                <div key={project.id} id={"project-" + project.id} className="flex flex-wrap items-center gap-3 border-b border-slate-100 p-3 last:border-b-0 sm:flex-nowrap sm:p-4">
                  <div className="hidden shrink-0 overflow-hidden rounded-md bg-slate-100 ring-1 ring-slate-200 sm:block">
                    <Image unoptimized src={project.thumbnail || "/thumbnails/_fallback.webp"} alt="" width={100} height={64} className="h-16 w-24 object-contain" />
                  </div>
                  <div className="min-w-40 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-ink">{project.title}</h3>
                      {project.featured ? <span title="Zvýrazněný projekt" className="text-amber-600">★</span> : null}
                      <span className={"rounded-full px-2 py-0.5 text-xs font-semibold " + statusColors[project.status]}>{statusNames[project.status]}</span>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">{visibilityNames[project.visibility]}</span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-600">{project.description}</p>
                    <p className="mt-1 text-xs text-slate-500">{sectionNameById.get(project.section) ?? project.section} · {project.linkMode === "vpn" ? "VPN / interní" : "Běžný odkaz"}</p>
                  </div>
                  <div className="ml-auto flex shrink-0 items-center gap-1.5">
                    <div className="mr-1 flex flex-col" aria-label="Pořadí projektu">
                      <button title="Posunout výše" aria-label={"Posunout " + project.title + " výše"} type="button" disabled={busy || pos <= 0} className="rounded px-2 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" onClick={() => moveProject(project, -1)}>↑</button>
                      <button title="Posunout níže" aria-label={"Posunout " + project.title + " níže"} type="button" disabled={busy || pos >= group.length - 1} className="rounded px-2 py-0.5 text-slate-600 hover:bg-slate-100 disabled:opacity-30" onClick={() => moveProject(project, 1)}>↓</button>
                    </div>
                    <Link className="admin-button-secondary" href={editUrl(project.id)}>Upravit</Link>
                    <details className="relative">
                      <summary title="Další akce" className="admin-button-secondary cursor-pointer list-none [&::-webkit-details-marker]:hidden">⋯</summary>
                      <div className="absolute right-0 z-10 mt-1 grid min-w-44 gap-1 rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
                        <a className="rounded px-3 py-2 text-sm text-slate-700 hover:bg-slate-50" href={project.url} target="_blank" rel="noreferrer">Otevřít odkaz ↗</a>
                        <button type="button" className="rounded px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50" disabled={busy} onClick={() => void archiveProject(project)}>Archivovat a skrýt</button>
                        <button type="button" className="rounded px-3 py-2 text-left text-sm text-red-700 hover:bg-red-50" disabled={busy} onClick={() => void deleteProject(project)}>Smazat projekt…</button>
                      </div>
                    </details>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {activeTab === "sections" ? (
        <div className="grid gap-4 rounded-xl bg-white p-5 shadow-soft ring-1 ring-slate-200 sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-ink">Sekce portfolia</h2>
              <p className="mt-1 text-sm text-slate-600">Názvy a pořadí sekcí veřejné stránky. Interní ID se při přejmenování nemění.</p>
            </div>
            <div className="flex gap-2">
              <button type="button" className="admin-button-secondary" onClick={addSection}>+ Přidat sekci</button>
              <button type="button" className="admin-button-primary" disabled={busy} onClick={() => void persist(data)}>Uložit sekce</button>
            </div>
          </div>
          {sections.map((section, index) => (
            <div key={section.id} className="grid gap-3 rounded-lg border border-slate-200 p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">{section.title}</h3>
                <div className="flex items-center gap-1.5">
                  <span className="mr-2 text-xs text-slate-500">{data.projects.filter((project) => project.section === section.id).length} projektů</span>
                  <button type="button" className="admin-button-secondary" disabled={index === 0} aria-label={"Sekce " + section.title + " výše"} onClick={() => moveSection(section, -1)}>↑</button>
                  <button type="button" className="admin-button-secondary" disabled={index === sections.length - 1} aria-label={"Sekce " + section.title + " níže"} onClick={() => moveSection(section, 1)}>↓</button>
                  <button type="button" className="admin-button-danger" disabled={busy} onClick={() => removeSection(section)}>Smazat</button>
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-[1fr_1.5fr_0.8fr]">
                <label className="grid gap-1 text-sm font-medium text-slate-700">Název
                  <input className="admin-input" value={section.title} onChange={(event) => updateSection(section.id, { title: event.target.value })} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">Popis
                  <input className="admin-input" value={section.description} onChange={(event) => updateSection(section.id, { description: event.target.value })} />
                </label>
                <label className="grid gap-1 text-sm font-medium text-slate-700">Výchozí typ odkazů
                  <select className="admin-input" value={section.linkMode} onChange={(event) => updateSection(section.id, { linkMode: event.target.value as SectionLinkMode })}>
                    <option value="standard">Běžný</option><option value="vpn">Interní / VPN</option>
                  </select>
                </label>
              </div>
              <p className="text-xs text-slate-400">Interní ID: {section.id}</p>
            </div>
          ))}
        </div>
      ) : null}

      {activeTab === "terms" ? (
        <AdminTermDescriptions data={data} busy={busy} onChange={setData} onSave={() => void persist(data)} />
      ) : null}
    </section>
  );
}
