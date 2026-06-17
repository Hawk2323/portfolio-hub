import Image from "next/image";
import type { PortfolioProject, PortfolioSection } from "@/lib/schema";
import StatusBadge from "./StatusBadge";

type Props = {
  project: PortfolioProject;
  section?: PortfolioSection;
  restricted?: boolean;
  onPreview?: () => void;
};

export default function ProjectCard({ project, section, restricted = false, onPreview }: Props) {
  const thumbnail = (
    <div className="rounded-md bg-slate-950/5 p-2 ring-1 ring-slate-200">
      <div className="aspect-[1200/760] rounded bg-white shadow-inner ring-1 ring-slate-900/10">
        <Image
          src={project.thumbnail || "/thumbnails/_fallback.webp"}
          alt=""
          width={1200}
          height={760}
          unoptimized
          className="h-full w-full rounded object-contain"
        />
      </div>
    </div>
  );

  return (
    <article className="grid overflow-hidden rounded-lg bg-white shadow-soft ring-1 ring-slate-200/80">
      <div className="grid gap-4 p-4 sm:p-5">
        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-semibold uppercase text-pine">
                {section?.title ?? project.section}
              </p>
              <h3 className="text-balance text-2xl font-semibold leading-tight text-ink">{project.title}</h3>
            </div>
            <div className="flex flex-wrap justify-end gap-2">
              <StatusBadge status={project.status} />
              {project.linkMode === "vpn" ? (
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700 ring-1 ring-slate-200">
                  VPN
                </span>
              ) : null}
            </div>
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-slate-600">{project.description}</p>
        </div>

        {restricted ? (
          <button type="button" className="group focus-ring block w-full rounded-md text-left" onClick={onPreview} aria-label={`Open preview for ${project.title}`}>
            {thumbnail}
          </button>
        ) : (
          <a href={project.url} target="_blank" rel="noreferrer" className="group focus-ring block rounded-md" aria-label={`Open ${project.title}`}>
            {thumbnail}
          </a>
        )}

        <div className="grid gap-2">
          <PillSet items={project.technologies} tone="technology" />
          <PillSet items={project.tools} tone="tool" />
        </div>
      </div>
    </article>
  );
}

function PillSet({ items, tone }: { items: string[]; tone: "technology" | "tool" }) {
  if (items.length === 0) return null;

  const className = tone === "technology"
    ? "rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600"
    : "rounded-full bg-pine/10 px-2.5 py-1 text-xs font-semibold text-pine ring-1 ring-pine/15";

  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span key={item} className={className}>
          {item}
        </span>
      ))}
    </div>
  );
}
