import { NextResponse, type NextRequest } from "next/server";
import { isAuthenticatedRequest } from "@/lib/auth";
import { hasGitHubWriteConfig, readProjectsFromGitHub, writeProjectsToGitHub } from "@/lib/github";
import { readProjectsFileUncached, writeProjectsFileLocal } from "@/lib/projects";
import { projectsFileSchema } from "@/lib/schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    if (hasGitHubWriteConfig()) {
      const { data } = await readProjectsFromGitHub();
      return NextResponse.json(data);
    }
    return NextResponse.json(await readProjectsFileUncached());
  } catch (error) {
    return NextResponse.json({ error: safeError(error) }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  try {
    const parsed = projectsFileSchema.parse(await request.json());
    if (process.env.NODE_ENV === "production" && !hasGitHubWriteConfig()) {
      return NextResponse.json(
        { error: "Production writes require GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, and GITHUB_BRANCH." },
        { status: 503 }
      );
    }

    const saved = hasGitHubWriteConfig()
      ? await writeProjectsToGitHub(parsed)
      : await writeProjectsFileLocal(parsed);
    return NextResponse.json(saved);
  } catch (error) {
    return NextResponse.json({ error: safeError(error) }, { status: 400 });
  }
}

function safeError(error: unknown) {
  return error instanceof Error ? error.message : "Unexpected error.";
}
