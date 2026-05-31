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
      <a href={project.url} target="_blank" rel="noreferrer" className="focus-ring grid">
        <div className="aspect-[1200/760] overflow-hidden bg-slate-100">
          <Image
            src={project.thumbnail || "/thumbnails/_fallback.webp"}
            alt=""
            width={1200}
            height={760}
            unoptimized
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.02]"
          />
        </div>
        <div className="grid gap-4 p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="mb-1 text-xs font-semibold uppercase tracking-[0.14em] text-pine">
                {section?.title ?? project.section}
              </p>
              <h2 className="text-xl font-semibold text-ink">{project.title}</h2>
            </div>
            <StatusBadge status={project.status} />
          </div>
          <p className="line-clamp-3 text-sm leading-6 text-slate-600">{project.description}</p>
          <div className="flex flex-wrap gap-2">
            {project.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-600">
                {tag}
              </span>
            ))}
          </div>
          <span className="inline-flex items-center text-sm font-semibold text-coral">
            Open <span aria-hidden="true" className="ml-1 transition group-hover:translate-x-1">-&gt;</span>
          </span>
        </div>
      </a>
    </article>
  );
}
