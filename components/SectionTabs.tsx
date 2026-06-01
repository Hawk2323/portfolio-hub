"use client";

import type { PortfolioSection } from "@/lib/schema";

type Props = {
  sections: PortfolioSection[];
  selectedSection: string;
  onSectionChange: (value: string) => void;
};

export default function SectionTabs({
  sections,
  selectedSection,
  onSectionChange
}: Props) {
  return (
    <div className="flex flex-wrap gap-2 py-6">
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
  );
}

function tabClass(active: boolean) {
  return [
    "focus-ring rounded-full px-4 py-2 text-sm font-semibold transition",
    active ? "bg-ink text-white shadow-sm" : "bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50"
  ].join(" ");
}
