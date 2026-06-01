import ProjectGrid from "@/components/ProjectGrid";
import { getPublicPortfolio, sortProjects, sortSections } from "@/lib/projects";

export const dynamic = "force-dynamic";

export default async function Home() {
  const portfolio = await getPublicPortfolio();
  const sections = sortSections(portfolio);
  const projects = sortProjects(portfolio.projects);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8 lg:px-10">
      <header className="border-b border-slate-200 pb-8">
        <h1 className="text-4xl font-semibold leading-tight text-ink sm:text-5xl lg:text-6xl">
          Project portfolio
        </h1>
      </header>

      <ProjectGrid sections={sections} projects={projects} />

      <footer className="mt-auto flex justify-end pt-8">
        <a className="text-xs font-medium text-slate-400 transition hover:text-slate-600" href="/admin">
          Admin
        </a>
      </footer>
    </main>
  );
}
