"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import type { PortfolioProject, PortfolioSection } from "@/lib/schema";
import ProjectCard from "./ProjectCard";
import SectionTabs from "./SectionTabs";

type Props = {
  sections: PortfolioSection[];
  projects: PortfolioProject[];
  allowRestrictedLinks: boolean;
};

export default function ProjectGrid({ sections, projects, allowRestrictedLinks }: Props) {
  const [section, setSection] = useState("all");
  const [previewProject, setPreviewProject] = useState<PortfolioProject | null>(null);

  const sectionById = useMemo(() => new Map(sections.map((item) => [item.id, item])), [sections]);

  const visibleSections = useMemo(() => {
    const selectedSections = section === "all"
      ? sections
      : sections.filter((item) => item.id === section);

    return selectedSections
      .map((item) => ({
        section: item,
        projects: projects.filter((project) => project.section === item.id)
      }))
      .filter((group) => section !== "all" || group.projects.length > 0);
  }, [projects, section, sections]);

  return (
    <section className="py-4">
      <SectionTabs
        sections={sections}
        selectedSection={section}
        onSectionChange={setSection}
      />

      {visibleSections.length > 0 ? (
        <div className="grid gap-10">
          {visibleSections.map((group) => (
            <section key={group.section.id} className="grid gap-4">
              <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h2 className="text-2xl font-semibold text-ink">{group.section.title}</h2>
                  {group.section.description ? (
                    <p className="mt-1 max-w-2xl text-sm leading-6 text-slate-600">{group.section.description}</p>
                  ) : null}
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 ring-1 ring-slate-200">
                  {group.projects.length}
                </span>
              </div>
              {group.projects.length > 0 ? (
                <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {group.projects.map((project) => {
                    const projectSection = sectionById.get(project.section);
                    const restricted = projectSection?.linkMode === "vpn" && !allowRestrictedLinks;

                    return (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        section={projectSection}
                        restricted={restricted}
                        onPreview={() => setPreviewProject(project)}
                      />
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-600">
                  No public projects in this section yet.
                </div>
              )}
            </section>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-600">
          No public projects match the selected filters.
        </div>
      )}

      {previewProject ? (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-slate-950/75 p-4"
          role="dialog"
          aria-modal="true"
          aria-label={previewProject.title}
          onClick={() => setPreviewProject(null)}
        >
          <div className="max-h-[92vh] w-full max-w-6xl overflow-hidden rounded-lg bg-white shadow-2xl ring-1 ring-white/20" onClick={(event) => event.stopPropagation()}>
            <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-4 py-3">
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase text-pine">{sectionById.get(previewProject.section)?.title ?? previewProject.section}</p>
                <h2 className="truncate text-lg font-semibold text-ink">{previewProject.title}</h2>
              </div>
              <button
                type="button"
                className="focus-ring rounded-full bg-slate-100 px-3 py-1.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-200"
                onClick={() => setPreviewProject(null)}
              >
                Close
              </button>
            </div>
            <div className="bg-slate-950/5 p-3">
              <div className="aspect-[1200/760] overflow-hidden rounded bg-white ring-1 ring-slate-900/10">
                <Image
                  src={previewProject.thumbnail || "/thumbnails/_fallback.webp"}
                  alt=""
                  width={1200}
                  height={760}
                  unoptimized
                  className="h-full w-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
