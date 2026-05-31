import fs from "node:fs/promises";
import path from "node:path";

const source = path.join(process.cwd(), "data", "projects.json");
const target = path.join(process.cwd(), "data", "projects.seed.json");

await fs.copyFile(source, target);
console.log(`Seed data copied to ${path.relative(process.cwd(), target)}.`);
