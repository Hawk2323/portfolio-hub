"use client";

import type { PortfolioSection, ProjectStatus } from "@/lib/schema";

type Props = {
  sections: PortfolioSection[];
  statuses: ProjectStatus[];
  tags: string[];
  selectedSection: string;
  selectedStatus: string;
  selectedTag: string;
  onSectionChange: (value: string) => void;
  onStatusChange: (value: string) => void;
  onTagChange: (value: string) => void;
};

export default function SectionTabs({
  sections,
  statuses,
  tags,
  selectedSection,
  selectedStatus,
  selectedTag,
  onSectionChange,
  onStatusChange,
  onTagChange
}: Props) {
  return (
    <div className="flex flex-col gap-4 py-6">
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          className={tabClass(selectedSection === "all")}
          onClick={() => onSectionChange("all")}
        >
          All
        </button>
        {sections.map((section) => (
          <button
            type="button"
            key={section.id}
            className={tabClass(selectedSection === section.id)}
            onClick={() => onSectionChange(section.id)}
          >
            {section.title}
          </button>
        ))}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:max-w-3xl">
        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Status
          <select
            className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
            value={selectedStatus}
            onChange={(event) => onStatusChange(event.target.value)}
          >
            <option value="all">All statuses</option>
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </label>

        <label className="grid gap-1 text-sm font-medium text-slate-700">
          Tag
          <select
            className="focus-ring rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm shadow-sm"
            value={selectedTag}
            onChange={(event) => onTagChange(event.target.value)}
          >
            <option value="all">All tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}

function tabClass(active: boolean) {
  return [
    "focus-ring rounded-full px-4 py-2 text-sm font-semibold transition",
    active ? "bg-ink text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
  ].join(" ");
}
