import type { ProjectStatus } from "@/lib/schema";

const labels: Record<ProjectStatus, string> = {
  idea: "Idea",
  wip: "WIP",
  live: "Live",
  paused: "Paused",
  archived: "Archived"
};

const classes: Record<ProjectStatus, string> = {
  idea: "bg-slate-100 text-slate-700 ring-slate-200",
  wip: "bg-amber-50 text-amber-800 ring-amber-200",
  live: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  paused: "bg-sky-50 text-sky-800 ring-sky-200",
  archived: "bg-zinc-100 text-zinc-600 ring-zinc-200"
};

export default function StatusBadge({ status }: { status: ProjectStatus }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classes[status]}`}>
      {labels[status]}
    </span>
  );
}
