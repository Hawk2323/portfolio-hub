"use client";

import { useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { PortfolioProject, PortfolioSection, ProjectStatus, ProjectVisibility, ThumbnailMode, ProjectSource } from "@/lib/schema";
import { slugify } from "@/lib/slug";

type DraftProject = PortfolioProject;

type Props = {
  project: DraftProject;
  sections: PortfolioSection[];
  onChange: (project: DraftProject) => void;
  onSave: () => void;
  onSaveUploaded: (project: DraftProject) => void;
  onCancel: () => void;
};

const statuses: ProjectStatus[] = ["idea", "wip", "live", "paused", "archived"];
const visibilities: ProjectVisibility[] = ["public", "unlisted", "private"];
const thumbnailModes: ThumbnailMode[] = ["auto", "manual", "fallback"];
const sources: ProjectSource[] = ["manual", "pact", "external"];

export function createEmptyProject(section: string): DraftProject {
  const title = "New project";
  const slug = slugify(title);
  return {
    id: slug,
    title,
    slug,
    section,
    status: "wip",
    url: "https://example.com",
    description: "Short project description.",
    technologies: [],
    tools: ["AI"],
    visibility: "private",
    thumbnail: "/thumbnails/_fallback.webp",
    thumbnailMode: "auto",
    thumbnailLocked: false,
    thumbnailGeneratedAt: null,
    featured: false,
    sortOrder: 100,
    source: "manual",
    notesPrivate: ""
  };
}

export default function AdminProjectForm({ project, sections, onChange, onSave, onSaveUploaded, onCancel }: Props) {
  const technologiesValue = useMemo(() => project.technologies.join(", "), [project.technologies]);
  const toolsValue = useMemo(() => project.tools.join(", "), [project.tools]);
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploading, setUploading] = useState(false);

  function update<K extends keyof DraftProject>(key: K, value: DraftProject[K]) {
    onChange({ ...project, [key]: value });
  }

  function updateTitle(title: string) {
    if (project.id === project.slug || project.id === slugify(project.title)) {
      const slug = slugify(title);
      onChange({ ...project, title, id: slug, slug });
      return;
    }
    update("title", title);
  }

  async function uploadManualThumbnail(file: File | null) {
    if (!file) return;

    setUploading(true);
    setUploadMessage("");

    const form = new FormData();
    form.append("file", file);
    form.append("slug", project.slug || slugify(project.title));

    const response = await fetch("/api/admin/upload-thumbnail", {
      method: "POST",
      body: form
    });
    const body = await response.json();
    setUploading(false);

    if (!response.ok) {
      setUploadMessage(body.error ?? "Thumbnail upload failed.");
      return;
    }

    const nextProject = {
      ...project,
      thumbnail: body.thumbnail,
      thumbnailMode: "manual" as const,
      thumbnailLocked: true,
      thumbnailGeneratedAt: null
    };
    onChange(nextProject);
    onSaveUploaded(nextProject);
    setUploadMessage("Manual thumbnail uploaded and saved.");
  }

  return (
    <div className="rounded-lg bg-white p-5 shadow-soft ring-1 ring-slate-200">
      <div className="grid gap-4 md:grid-cols-2">
        <Field label="Title">
          <input className="admin-input" value={project.title} onChange={(event) => updateTitle(event.target.value)} />
        </Field>
        <Field label="URL">
          <input className="admin-input" value={project.url} onChange={(event) => update("url", event.target.value)} />
        </Field>
        <Field label="Slug">
          <input className="admin-input" value={project.slug} onChange={(event) => update("slug", slugify(event.target.value))} />
        </Field>
        <Field label="ID">
          <input className="admin-input" value={project.id} onChange={(event) => update("id", slugify(event.target.value))} />
        </Field>
        <Field label="Section">
          <select className="admin-input" value={project.section} onChange={(event) => update("section", event.target.value)}>
            {sections.map((section) => (
              <option key={section.id} value={section.id}>{section.title}</option>
            ))}
          </select>
        </Field>
        <Field label="Status">
          <select className="admin-input" value={project.status} onChange={(event) => update("status", event.target.value as ProjectStatus)}>
            {statuses.map((status) => <option key={status} value={status}>{status}</option>)}
          </select>
        </Field>
        <Field label="Visibility">
          <select className="admin-input" value={project.visibility} onChange={(event) => update("visibility", event.target.value as ProjectVisibility)}>
            {visibilities.map((visibility) => <option key={visibility} value={visibility}>{visibility}</option>)}
          </select>
        </Field>
        <Field label="Source">
          <select className="admin-input" value={project.source} onChange={(event) => update("source", event.target.value as ProjectSource)}>
            {sources.map((source) => <option key={source} value={source}>{source}</option>)}
          </select>
        </Field>
        <Field label="Thumbnail mode">
          <select className="admin-input" value={project.thumbnailMode} onChange={(event) => update("thumbnailMode", event.target.value as ThumbnailMode)}>
            {thumbnailModes.map((mode) => <option key={mode} value={mode}>{mode}</option>)}
          </select>
        </Field>
        <Field label="Thumbnail path / URL">
          <input className="admin-input" value={project.thumbnail} onChange={(event) => update("thumbnail", event.target.value)} />
        </Field>
        <Field label="Upload manual thumbnail">
          <input
            className="admin-input"
            type="file"
            accept="image/png,image/jpeg,image/webp"
            disabled={uploading}
            onChange={(event) => void uploadManualThumbnail(event.target.files?.[0] ?? null)}
          />
          {uploadMessage ? <span className="text-xs font-medium text-slate-500">{uploadMessage}</span> : null}
        </Field>
        <Field label="Sort order">
          <input className="admin-input" type="number" value={project.sortOrder} onChange={(event) => update("sortOrder", Number(event.target.value))} />
        </Field>
        <Field label="Technologies">
          <input
            className="admin-input"
            value={technologiesValue}
            onChange={(event) => update("technologies", splitPills(event.target.value))}
          />
        </Field>
        <Field label="Tools">
          <input
            className="admin-input"
            value={toolsValue}
            onChange={(event) => update("tools", splitPills(event.target.value))}
          />
        </Field>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={project.featured} onChange={(event) => update("featured", event.target.checked)} />
          Featured
        </label>
        <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
          <input type="checkbox" checked={project.thumbnailLocked} onChange={(event) => update("thumbnailLocked", event.target.checked)} />
          Thumbnail locked
        </label>
        <Field label="Description">
          <textarea className="admin-input min-h-28" value={project.description} onChange={(event) => update("description", event.target.value)} />
        </Field>
        <Field label="Private notes">
          <textarea className="admin-input min-h-28" value={project.notesPrivate} onChange={(event) => update("notesPrivate", event.target.value)} />
        </Field>
      </div>
      <div className="mt-5 flex flex-wrap justify-end gap-3">
        <button type="button" className="admin-button-secondary" onClick={onCancel}>Cancel</button>
        <button type="button" className="admin-button-primary" onClick={onSave}>Save draft</button>
      </div>
    </div>
  );
}

function splitPills(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1 text-sm font-medium text-slate-700">
      {label}
      {children}
    </label>
  );
}
