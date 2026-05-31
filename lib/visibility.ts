import type { PortfolioProject } from "./schema";

export function isPublicProject(project: PortfolioProject) {
  return project.visibility === "public";
}

export function publicProjectsOnly(projects: PortfolioProject[]) {
  return projects.filter(isPublicProject);
}
