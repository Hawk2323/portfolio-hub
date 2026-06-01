import { promises as fs } from "fs";
import path from "path";
import { cache } from "react";
import { hasGitHubWriteConfig, readProjectsFromGitHub } from "./github";
import { projectsFileSchema, type ProjectsFile } from "./schema";
import { publicProjectsOnly } from "./visibility";

export const DATA_PATH = path.join(process.cwd(), "data", "projects.json");

export const getProjectsFile = cache(async (): Promise<ProjectsFile> => {
  if (hasGitHubWriteConfig()) {
    const { data } = await readProjectsFromGitHub();
    return data;
  }

  const raw = await fs.readFile(DATA_PATH, "utf8");
  return projectsFileSchema.parse(JSON.parse(raw));
});

export async function readProjectsFileUncached(): Promise<ProjectsFile> {
  const raw = await fs.readFile(DATA_PATH, "utf8");
  return projectsFileSchema.parse(JSON.parse(raw));
}

export async function writeProjectsFileLocal(data: ProjectsFile) {
  const parsed = projectsFileSchema.parse({
    ...data,
    updatedAt: new Date().toISOString()
  });
  await fs.writeFile(DATA_PATH, `${JSON.stringify(parsed, null, 2)}\n`, "utf8");
  return parsed;
}

export async function getPublicPortfolio() {
  const data = await getProjectsFile();
  return {
    ...data,
    projects: publicProjectsOnly(data.projects)
  };
}

export function sortSections(data: ProjectsFile) {
  return [...data.sections].sort((a, b) => a.sortOrder - b.sortOrder || a.title.localeCompare(b.title));
}

export function sortProjects<T extends { featured: boolean; sortOrder: number; title: string }>(projects: T[]) {
  return [...projects].sort((a, b) => {
    if (a.featured !== b.featured) return a.featured ? -1 : 1;
    return a.sortOrder - b.sortOrder || a.title.localeCompare(b.title);
  });
}
