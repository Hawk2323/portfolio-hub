"use client";

import { useEffect, useMemo, useState } from "react";
import type { ProjectsFile, PortfolioProject, PortfolioSection, SectionLinkMode } from "@/lib/schema";
import { slugify } from "@/lib/slug";
import AdminProjectForm, { createEmptyProject } from "./AdminProjectForm";
import StatusBadge from "./StatusBadge";

const linkModes: SectionLinkMode[] = ["standard", "vpn"];

export default function AdminProjectList() {
  const [password, setPassword] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [data, setData] = useState<ProjectsFile | null>(null);
  const [editing, setEditing] = useState<PortfolioProject | null>(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const sortedSections = useMemo(() => sortSections(data?.sections ?? []), [data]);
  const sectionById = useMemo(() => new Map(data?.sections.map((section) => [section.id, section]) ?? []), [data]);

  useEffect(() => {
    fetch("/api/admin/session").then(async (response) => {
      const body = await response.json();
      setAuthenticated(Boolean(body.authenticated));
      if (body.authenticated) void loadProjects();
    });
  }, []);

  async function login() {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password })
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(body.error ?? "Login failed.");
      return;
    }
    setAuthenticated(true);
    setPassword("");
    await loadProjects();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    setAuthenticated(false);
    setData(null);
  }

  async function loadProjects() {
    const response = await fetch("/api/admin/projects", { cache: "no-store" });
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error ?? "Could not load projects.");
      return;
    }
    setData(body);
  }

  async function persist(nextData: ProjectsFile) {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/projects", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(nextData)
    });
    const body = await response.json();
    setBusy(false);
    if (!response.ok) {
      setMessage(body.error ?? "Save failed.");
      return;
    }
    setData(body);
    setEditing(null);
    setMessage("Saved.");
  }

  function upsertProject(project: PortfolioProject) {
    if (!data) return;
    const exists = data.projects.some((item) => item.id === project.id);
    const projects = exists
      ? data.projects.map((item) => (item.id === project.id ? project : item))
      : [...data.projects, project];
    void persist({ ...data, projects });
  }

  function updateSection(previousId: string, section: PortfolioSection) {
    if (!data) return;
    const previousSection = data.sections.find((item) => item.id === previousId);
    const nextId = slugify(section.id);
    const nextSection = { ...section, id: nextId };
    const linkModeChanged = previousSection?.linkMode !== nextSection.linkMode;
    const updateProjectSection = (project: PortfolioProject) => {
      if (project.section !== previousId) return project;
      return {
        ...project,
        section: nextId,
        linkMode: linkModeChanged ? nextSection.linkMode : project.linkMode
      };
    };

    setData({
      ...data,
      sections: data.sections.map((item) => (item.id === previousId ? nextSection : item)),
      projects: data.projects.map(updateProjectSection)
    });
    setEditing((project) => (project ? updateProjectSection(project) : project));
  }

  function addSection() {
    if (!data) return;
    const id = uniqueSectionId(data.sections, "new-section");
    setData({
      ...data,
      sections: [
        ...data.sections,
        {
          id,
          title: "New section",
          description: "",
          sortOrder: nextSectionOrder(data.sections),
          linkMode: "standard"
        }
      ]
    });
  }

  function deleteSection(section: PortfolioSection) {
    if (!data) return;
    if (data.projects.some((project) => project.section === section.id)) {
      setMessage(`Section "${section.title}" still contains projects.`);
      return;
    }
    setData({ ...data, sections: data.sections.filter((item) => item.id !== section.id) });
  }

  function archiveProject(project: PortfolioProject) {
    if (!data) return;
    void persist({
      ...data,
      projects: data.projects.map((item) =>
        item.id === project.id ? { ...item, status: "archived", visibility: "private" } : item
      )
    });
  }

  function deleteProject(project: PortfolioProject) {
    if (!data) return;
    void persist({ ...data, projects: data.projects.filter((item) => item.id !== project.id) });
  }

  async function regenerate(project: PortfolioProject) {
    setBusy(true);
    setMessage("");
    const response = await fetch("/api/admin/regenerate-thumbnail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: project.id })
    });
    const body = await response.json();
    setBusy(false);
    setMessage(response.ok ? body.message : body.error);
    await loadProjects();
  }

  if (!authenticated) {
    return (
      <section className="max-w-md rounded-lg bg-white p-6 shadow-soft ring-1 ring-slate-200">
        <h2 className="mb-4 text-xl font-semibold text-ink">Sign in</h2>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          Admin password
          <input
            className="admin-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") void login();
            }}
          />
        </label>
        {message ? <p className="mt-3 text-sm text-coral">{message}</p> : null}
        <button type="button" className="admin-button-primary mt-5 w-full" onClick={login} disabled={busy}>
          Sign in
        </button>
      </section>
    );
  }

  if (!data) {
    return <p className="text-slate-600">Loading projects...</p>;
  }

  const sectionOrder = new Map(sortedSections.map((item, index) => [item.id, index]));
  const sortedProjects = [...data.projects].sort((a, b) =>
    (sectionOrder.get(a.section) ?? 999) - (sectionOrder.get(b.section) ?? 999) ||
    a.sortOrder - b.sortOrder ||
    a.title.localeCompare(b.title)
  );

  return (
    <section className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-3">
          <button type="button" className="admin-button-primary" onClick={() => {
            const firstSection = sortedSections[0];
            setEditing(createEmptyProject(firstSection?.id ?? "private", firstSection?.linkMode ?? "standard"));
          }}>
            Add project
          </button>
          <button type="button" className="admin-button-secondary" onClick={addSection}>Add section</button>
          <button type="button" className="admin-button-secondary" onClick={loadProjects}>Refresh</button>
        </div>
        <button type="button" className="admin-button-secondary" onClick={logout}>Logout</button>
      </div>

      {message ? <p className="rounded-lg bg-white px-4 py-3 text-sm text-slate-700 ring-1 ring-slate-200">{message}</p> : null}

      <div className="rounded-lg bg-white p-5 shadow-soft ring-1 ring-slate-200">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-xl font-semibold text-ink">Sections</h2>
          <button type="button" className="admin-button-primary" onClick={() => persist(data)} disabled={busy}>
            Save sections
          </button>
        </div>
        <div className="grid gap-3">
          {sortedSections.map((section) => (
            <div key={section.id} className="grid gap-3 rounded-lg border border-slate-200 p-3 lg:grid-cols-[0.8fr_1fr_1.4fr_0.7fr_0.8fr_auto] lg:items-end">
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                ID
                <input
                  className="admin-input"
                  value={section.id}
                  onChange={(event) => updateSection(section.id, { ...section, id: event.target.value })}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Title
                <input
                  className="admin-input"
                  value={section.title}
                  onChange={(event) => updateSection(section.id, { ...section, title: event.target.value })}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Description
                <input
                  className="admin-input"
                  value={section.description}
                  onChange={(event) => updateSection(section.id, { ...section, description: event.target.value })}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Order
                <input
                  className="admin-input"
                  type="number"
                  value={section.sortOrder}
                  onChange={(event) => updateSection(section.id, { ...section, sortOrder: Number(event.target.value) })}
                />
              </label>
              <label className="grid gap-1 text-sm font-medium text-slate-700">
                Links
                <select
                  className="admin-input"
                  value={section.linkMode}
                  onChange={(event) => updateSection(section.id, { ...section, linkMode: event.target.value as SectionLinkMode })}
                >
                  {linkModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
                </select>
              </label>
              <button type="button" className="admin-button-danger" onClick={() => deleteSection(section)} disabled={busy}>
                Delete
              </button>
            </div>
          ))}
        </div>
      </div>

      {editing ? (
        <AdminProjectForm
          project={editing}
          sections={data.sections}
          onChange={setEditing}
          onSave={() => upsertProject(editing)}
          onSaveUploaded={upsertProject}
          onCancel={() => setEditing(null)}
        />
      ) : null}

      <div className="overflow-hidden rounded-lg bg-white shadow-soft ring-1 ring-slate-200">
        {sortedProjects.map((project) => (
          <div key={project.id} className="grid gap-4 border-b border-slate-100 p-4 last:border-b-0 lg:grid-cols-[1fr_auto] lg:items-center">
            <div>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-semibold text-ink">{project.title}</h2>
                <StatusBadge status={project.status} />
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-600">
                  {project.visibility}
                </span>
              </div>
              <p className="text-sm text-slate-600">{project.description}</p>
              <p className="mt-2 text-xs text-slate-500">
                {sectionById.get(project.section)?.title ?? project.section} - {project.linkMode} - order {project.sortOrder} - {project.thumbnailMode}
                {project.thumbnailLocked ? " - locked" : ""}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="admin-button-secondary" onClick={() => setEditing(project)} disabled={busy}>Edit</button>
              <button type="button" className="admin-button-secondary" onClick={() => regenerate(project)} disabled={busy}>Thumbnail</button>
              <button type="button" className="admin-button-secondary" onClick={() => archiveProject(project)} disabled={busy}>Archive</button>
              <button type="button" className="admin-button-danger" onClick={() => deleteProject(project)} disabled={busy}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function sortSections(sections: PortfolioSection[]) {
  return [...sections].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

function uniqueSectionId(sections: PortfolioSection[], base: string) {
  const ids = new Set(sections.map((section) => section.id));
  let id = base;
  let index = 2;
  while (ids.has(id)) {
    id = `${base}-${index}`;
    index += 1;
  }
  return id;
}

function nextSectionOrder(sections: PortfolioSection[]) {
  if (sections.length === 0) return 10;
  return Math.max(...sections.map((section) => section.sortOrder)) + 10;
}
