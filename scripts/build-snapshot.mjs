import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const nextBin = path.join(process.cwd(), "node_modules", "next", "dist", "bin", "next");
const env = Object.fromEntries(Object.entries(process.env).filter((entry) => typeof entry[1] === "string"));
const disabledDir = path.join(process.cwd(), ".snapshot-disabled");
const outDir = path.join(process.cwd(), "out");
const zipFile = path.join(process.cwd(), "portfolio-hub-snapshot.zip");
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
  if (code === 0) {
    await createSnapshotZip();
  }
  process.exitCode = code;
} finally {
  for (const item of [...movedPaths].reverse()) {
    await moveIfExists(item.to, item.from);
  }
  await fs.rm(disabledDir, { recursive: true, force: true });
}

async function createSnapshotZip() {
  await fs.rm(zipFile, { force: true });

  if (process.platform === "win32") {
    const powershell = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "WindowsPowerShell", "v1.0", "powershell.exe");
    await runCommand(powershell, [
      "-NoProfile",
      "-ExecutionPolicy",
      "Bypass",
      "-Command",
      "Compress-Archive -Path (Join-Path $env:SNAPSHOT_OUT '*') -DestinationPath $env:SNAPSHOT_ZIP -Force"
    ], {
      SNAPSHOT_OUT: outDir,
      SNAPSHOT_ZIP: zipFile
    });
  } else {
    await runCommand("zip", ["-r", zipFile, "."], {}, outDir);
  }

  console.log(`Snapshot ZIP ready: ${zipFile}`);
}

async function runCommand(command, args, extraEnv = {}, cwd = process.cwd()) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      stdio: "inherit",
      env: {
        ...env,
        ...extraEnv
      }
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }
      reject(new Error(`${command} exited with code ${code ?? 1}`));
    });
  });
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
