import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const env = Object.fromEntries(Object.entries(process.env).filter((entry) => typeof entry[1] === "string"));
const disabledDir = path.join(process.cwd(), ".snapshot-disabled");
const movedPaths = [
  { from: path.join(process.cwd(), "app", "api"), to: path.join(disabledDir, "api") },
  { from: path.join(process.cwd(), "app", "admin"), to: path.join(disabledDir, "admin") }
];

try {
  await fs.rm(disabledDir, { recursive: true, force: true });
  await fs.mkdir(disabledDir, { recursive: true });

  for (const item of movedPaths) {
    await moveIfExists(item.from, item.to);
  }

  const code = await runNextBuild();
  process.exitCode = code;
} finally {
  for (const item of [...movedPaths].reverse()) {
    await moveIfExists(item.to, item.from);
  }
  await fs.rm(disabledDir, { recursive: true, force: true });
}

async function runNextBuild() {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [nextBin, "build"], {
      stdio: "inherit",
      env: {
        ...env,
        NEXT_PUBLIC_STATIC_SNAPSHOT: "true",
        NEXT_PUBLIC_ALLOW_INDEXING: process.env.NEXT_PUBLIC_ALLOW_INDEXING ?? "false"
      }
    });
    child.on("exit", (code) => resolve(code ?? 1));
  });
}

async function moveIfExists(from, to) {
  try {
    await fs.mkdir(path.dirname(to), { recursive: true });
    await fs.rename(from, to);
  } catch (error) {
    if (error?.code === "EPERM") {
      throw new Error(`Could not move ${from}. Stop the dev server and close any process watching the project, then rerun npm run snapshot.`);
    }
    if (error?.code !== "ENOENT") throw error;
  }
}
