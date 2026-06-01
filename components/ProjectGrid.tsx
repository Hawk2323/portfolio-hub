"use client";

import { useMemo, useState } from "react";
import type { PortfolioProject, PortfolioSection } from "@/lib/schema";
import ProjectCard from "./ProjectCard";
import SectionTabs from "./SectionTabs";

type Props = {
  sections: PortfolioSection[];
  projects: PortfolioProject[];
};

export default function ProjectGrid({ sections, projects }: Props) {
  const [section, setSection] = useState("all");

  const sectionById = useMemo(() => new Map(sections.map((item) => [item.id, item])), [sections]);

  const filtered = useMemo(
    () =>
      projects.filter((project) => {
        if (section !== "all" && project.section !== section) return false;
        return true;
      }),
    [projects, section]
  );

  return (
    <section className="py-4">
      <SectionTabs
        sections={sections}
        selectedSection={section}
        onSectionChange={setSection}
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
