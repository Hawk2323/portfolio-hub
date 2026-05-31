import { projectsFileSchema, type ProjectsFile } from "./schema";

type GitHubContent = {
  content: string;
  sha: string;
  encoding: string;
};

function githubConfig() {
  return {
    token: process.env.GITHUB_TOKEN,
    owner: process.env.GITHUB_OWNER ?? "Hawk2323",
    repo: process.env.GITHUB_REPO ?? "portfolio-hub",
    branch: process.env.GITHUB_BRANCH ?? "main"
  };
}

export function hasGitHubWriteConfig() {
  const config = githubConfig();
  return Boolean(config.token && config.owner && config.repo && config.branch);
}

function headers(token: string) {
  return {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28"
  };
}

export async function readProjectsFromGitHub() {
  const config = githubConfig();
  if (!config.token) throw new Error("Missing GITHUB_TOKEN.");

  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/data/projects.json?ref=${config.branch}`;
  const response = await fetch(url, { headers: headers(config.token), cache: "no-store" });
  if (!response.ok) {
    throw new Error(`GitHub read failed with ${response.status}.`);
  }

  const body = (await response.json()) as GitHubContent;
  if (body.encoding !== "base64") throw new Error("Unexpected GitHub content encoding.");
  const decoded = Buffer.from(body.content, "base64").toString("utf8");
  return { data: projectsFileSchema.parse(JSON.parse(decoded)), sha: body.sha };
}

export async function writeProjectsToGitHub(data: ProjectsFile, sha?: string) {
  const config = githubConfig();
  if (!config.token) throw new Error("Missing GITHUB_TOKEN.");

  const latest = sha ? { sha } : await readProjectsFromGitHub();
  const parsed = projectsFileSchema.parse({ ...data, updatedAt: new Date().toISOString() });
  const content = Buffer.from(`${JSON.stringify(parsed, null, 2)}\n`, "utf8").toString("base64");
  const url = `https://api.github.com/repos/${config.owner}/${config.repo}/contents/data/projects.json`;
  const response = await fetch(url, {
    method: "PUT",
    headers: headers(config.token),
    body: JSON.stringify({
      message: `Update portfolio projects (${new Date().toISOString()})`,
      content,
      sha: "data" in latest ? latest.sha : latest.sha,
      branch: config.branch
    })
  });

  if (response.status === 409) {
    throw new Error("GitHub rejected the write because data/projects.json changed upstream. Refresh and try again.");
  }

  if (!response.ok) {
    throw new Error(`GitHub write failed with ${response.status}.`);
  }

  return parsed;
}
