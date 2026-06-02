import Image from "next/image";
import type { PortfolioProject, PortfolioSection } from "@/lib/schema";
import StatusBadge from "./StatusBadge";

type Props = {
  project: PortfolioProject;
  section?: PortfolioSection;
};

export default function ProjectCard({ project, section }: Props) {
  return (
    <article className="group grid overflow-hidden rounded-lg bg-white shadow-soft ring-1 ring-slate-200/80 transition hover:-translate-y-0.5 hover:shadow-xl">
      <a href={project.url} target="_blank" rel="noreferrer" className="focus-ring grid gap-4 p-4 sm:p-5">
        <div className="grid gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="mb-1 text-xs font-semibold uppercase text-pine">
                {section?.title ?? project.section}
              </p>
              <h2 className="text-balance text-2xl font-semibold leading-tight text-ink">{project.title}</h2>
            </div>
            <StatusBadge status={project.status} />
          </div>
          <p className="line-clamp-2 text-sm leading-6 text-slate-600">{project.description}</p>
        </div>

        <div className="rounded-md bg-slate-950/5 p-2 ring-1 ring-slate-200">
          <div className="aspect-[1200/760] overflow-hidden rounded bg-white shadow-inner ring-1 ring-slate-900/10">
            <Image
              src={project.thumbnail || "/thumbnails/_fallback.webp"}
              alt=""
              width={1200}
              height={760}
              unoptimized
              className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.015]"
            />
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {project.tags.map((tag) => (
            <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex min-w-0 items-center justify-between gap-3 border-t border-slate-100 pt-1">
          <span className="min-w-0 truncate text-xs font-medium text-slate-400">{project.url.replace(/^https?:\/\//, "")}</span>
          <span className="inline-flex items-center text-sm font-semibold text-coral">
            Open <span aria-hidden="true" className="ml-1 transition group-hover:translate-x-1">-&gt;</span>
          </span>
        </div>
      </a>
    </article>
  );
}
