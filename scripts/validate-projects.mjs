import fs from "node:fs/promises";
import path from "node:path";
import { projectsFileSchema } from "./project-schema.mjs";

const filePath = path.join(process.cwd(), "data", "projects.json");

try {
  const raw = await fs.readFile(filePath, "utf8");
  const parsed = projectsFileSchema.parse(JSON.parse(raw));
  const publicCount = parsed.projects.filter((project) => project.visibility === "public").length;
  console.log(`Validated ${parsed.projects.length} projects (${publicCount} public).`);
} catch (error) {
  console.error("Project data validation failed.");
  if (error?.issues) {
    for (const issue of error.issues) {
      console.error(`- ${issue.path.join(".")}: ${issue.message}`);
    }
  } else {
    console.error(error);
  }
  process.exit(1);
}
