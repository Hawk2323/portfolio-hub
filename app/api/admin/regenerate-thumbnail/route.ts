import { execFile } from "child_process";
import { promisify } from "util";
import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { readProjectsFileUncached, writeProjectsFileLocal } from "@/lib/projects";

const execFileAsync = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { id?: string } | null;
  if (!body?.id) {
    return NextResponse.json({ error: "Project id is required." }, { status: 400 });
  }

  if (process.env.NODE_ENV === "production") {
    return NextResponse.json(
      { error: "Thumbnail generation runs through the GitHub Action in production. Use workflow_dispatch." },
      { status: 501 }
    );
  }

  const data = await readProjectsFileUncached();
  const project = data.projects.find((item) => item.id === body.id);
  if (!project) {
    return NextResponse.json({ error: "Project not found." }, { status: 404 });
  }

  await writeProjectsFileLocal({
    ...data,
    projects: data.projects.map((item) =>
      item.id === body.id ? { ...item, thumbnailMode: "auto", thumbnailLocked: false } : item
    )
  });

  try {
    await execFileAsync(process.platform === "win32" ? "npm.cmd" : "npm", ["run", "thumbnails", "--", "--project", body.id], {
      cwd: process.cwd(),
      timeout: 120000
    });
    return NextResponse.json({ message: "Thumbnail regenerated locally." });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Thumbnail generation failed." },
      { status: 500 }
    );
  }
}
