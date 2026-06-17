import { promises as fs } from "fs";
import path from "path";
import { NextResponse, type NextRequest } from "next/server";
import sharp from "sharp";
import { isAuthenticatedRequest } from "@/lib/auth";
import { hasGitHubWriteConfig, writeBinaryFileToGitHub } from "@/lib/github";
import { slugify } from "@/lib/slug";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const maxUploadBytes = 6 * 1024 * 1024;
const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export async function POST(request: NextRequest) {
  if (!isAuthenticatedRequest(request)) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  if (process.env.NODE_ENV === "production" && !hasGitHubWriteConfig()) {
    return NextResponse.json(
      { error: "Production uploads require GITHUB_TOKEN, GITHUB_OWNER, GITHUB_REPO, and GITHUB_BRANCH." },
      { status: 503 }
    );
  }

  try {
    const form = await request.formData();
    const file = form.get("file");
    const slugValue = String(form.get("slug") ?? "");
    const slug = slugify(slugValue);

    if (!slug) {
      return NextResponse.json({ error: "Project slug is required." }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Thumbnail file is required." }, { status: 400 });
    }

    if (!allowedTypes.has(file.type)) {
      return NextResponse.json({ error: "Upload a JPEG, PNG, or WebP image." }, { status: 400 });
    }

    if (file.size > maxUploadBytes) {
      return NextResponse.json({ error: "Thumbnail image must be 6 MB or smaller." }, { status: 400 });
    }

    const input = Buffer.from(await file.arrayBuffer());
    const output = await sharp(input)
      .resize(1200, 760, { fit: "contain", background: "#ffffff" })
      .webp({ quality: 88 })
      .toBuffer();

    const repoPath = `public/thumbnails/${slug}-manual.webp`;
    if (hasGitHubWriteConfig()) {
      await writeBinaryFileToGitHub(repoPath, output, `Upload manual thumbnail for ${slug}`);
    } else {
      const outputPath = path.join(process.cwd(), repoPath);
      await fs.mkdir(path.dirname(outputPath), { recursive: true });
      await fs.writeFile(outputPath, output);
    }

    return NextResponse.json({ thumbnail: `/thumbnails/${slug}-manual.webp` });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Thumbnail upload failed." }, { status: 400 });
  }
}
