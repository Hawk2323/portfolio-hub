"use client";

import { useMemo, useState } from "react";
import type { PortfolioProject, PortfolioSection, ProjectStatus } from "@/lib/schema";
import ProjectCard from "./ProjectCard";
import SectionTabs from "./SectionTabs";

type Props = {
  sections: PortfolioSection[];
  projects: PortfolioProject[];
};

export default function ProjectGrid({ sections, projects }: Props) {
  const [section, setSection] = useState("all");
  const [status, setStatus] = useState("all");
  const [tag, setTag] = useState("all");

  const sectionById = useMemo(() => new Map(sections.map((item) => [item.id, item])), [sections]);
  const statuses = useMemo(
    () => Array.from(new Set(projects.map((project) => project.status))).sort() as ProjectStatus[],
    [projects]
  );
  const tags = useMemo(
    () => Array.from(new Set(projects.flatMap((project) => project.tags))).sort((a, b) => a.localeCompare(b)),
    [projects]
  );

  const filtered = useMemo(
    () =>
      projects.filter((project) => {
        if (section !== "all" && project.section !== section) return false;
        if (status !== "all" && project.status !== status) return false;
        if (tag !== "all" && !project.tags.includes(tag)) return false;
        return true;
      }),
    [projects, section, status, tag]
  );

  return (
    <section className="py-4">
      <SectionTabs
        sections={sections}
        statuses={statuses}
        tags={tags}
        selectedSection={section}
        selectedStatus={status}
        selectedTag={tag}
        onSectionChange={setSection}
        onStatusChange={setStatus}
        onTagChange={setTag}
      />

      {filtered.length > 0 ? (
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {filtered.map((project) => (
            <ProjectCard key={project.id} project={project} section={sectionById.get(project.section)} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white/70 p-8 text-center text-slate-600">
          No public projects match the selected filters.
        </div>
      )}
    </section>
  );
}
