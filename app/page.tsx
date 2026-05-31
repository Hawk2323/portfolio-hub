import ProjectGrid from "@/components/ProjectGrid";
import { getPublicPortfolio, sortProjects, sortSections } from "@/lib/projects";

export default async function Home() {
  const portfolio = await getPublicPortfolio();
  const sections = sortSections(portfolio);
  const projects = sortProjects(portfolio.projects);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-10">
      <header className="grid gap-8 border-b border-slate-200 pb-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-end">
        <div>
          <p className="mb-4 text-sm font-semibold uppercase tracking-[0.18em] text-pine">Portfolio Hub</p>
          <h1 className="max-w-4xl text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">
            Curated project tiles for demos, meetings, and quick sharing.
          </h1>
        </div>
        <p className="max-w-2xl text-base leading-7 text-slate-600 lg:justify-self-end">
          A public portfolio index with clean thumbnails, statuses, tags, and sections. Only projects explicitly marked
          public are shown here.
        </p>
      </header>

      <ProjectGrid sections={sections} projects={projects} />
    </main>
  );
}
