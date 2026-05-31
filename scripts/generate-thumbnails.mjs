import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { chromium } from "playwright";
import { projectsFileSchema } from "./project-schema.mjs";

const root = process.cwd();
const dataPath = path.join(root, "data", "projects.json");
const outputDir = path.join(root, "public", "thumbnails");
const selectedProject = getArgValue("--project");
const width = 1200;
const height = 760;
const screenshotHeight = 560;

await fs.mkdir(outputDir, { recursive: true });

const raw = await fs.readFile(dataPath, "utf8");
const data = projectsFileSchema.parse(JSON.parse(raw));
const sectionById = new Map(data.sections.map((section) => [section.id, section]));
const targets = data.projects.filter((project) => {
  if (selectedProject && project.id !== selectedProject && project.slug !== selectedProject) return false;
  return project.thumbnailMode === "auto" && !project.thumbnailLocked && Boolean(project.url);
});

let browser;
let changed = false;

try {
  browser = targets.length ? await chromium.launch({ headless: true }) : null;

  for (const project of targets) {
    const fileName = `${project.slug}.webp`;
    const outputPath = path.join(outputDir, fileName);
    const section = sectionById.get(project.section)?.title ?? project.section;

    try {
      const page = await browser.newPage({ viewport: { width, height: screenshotHeight }, deviceScaleFactor: 1 });
      page.setDefaultTimeout(25000);
      await page.goto(project.url, { waitUntil: "domcontentloaded" });
      await page.waitForLoadState("networkidle", { timeout: 12000 }).catch(() => undefined);
      await page.waitForTimeout(900);
      const screenshot = await page.screenshot({ type: "png", fullPage: false });
      await page.close();

      await composeThumbnail({ screenshot, outputPath, title: project.title, section, status: project.status });
      project.thumbnail = `/thumbnails/${fileName}`;
      project.thumbnailGeneratedAt = new Date().toISOString();
      project.thumbnailMode = "auto";
      changed = true;
      console.log(`Generated thumbnail for ${project.id}.`);
    } catch (error) {
      console.warn(`Thumbnail warning for ${project.id}: ${error instanceof Error ? error.message : error}`);
      await composeFallback({ outputPath, title: project.title, section, status: project.status });
      project.thumbnail = `/thumbnails/${fileName}`;
      project.thumbnailGeneratedAt = new Date().toISOString();
      project.thumbnailMode = "fallback";
      changed = true;
    }
  }
} finally {
  await browser?.close();
}

const fallbackPath = path.join(outputDir, "_fallback.webp");
try {
  await fs.access(fallbackPath);
} catch {
  await composeFallback({ outputPath: fallbackPath, title: "Portfolio Hub", section: "Portfolio", status: "fallback" });
  console.log("Created shared fallback thumbnail.");
}

if (changed) {
  data.updatedAt = new Date().toISOString();
  await fs.writeFile(dataPath, `${JSON.stringify(projectsFileSchema.parse(data), null, 2)}\n`, "utf8");
}

function getArgValue(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

async function composeThumbnail({ screenshot, outputPath, title, section, status }) {
  const image = await sharp(screenshot)
    .resize(width, screenshotHeight, { fit: "cover", position: "top" })
    .png()
    .toBuffer();

  const base = await sharp({
    create: {
      width,
      height,
      channels: 4,
      background: "#f7f9fc"
    }
  })
    .composite([
      { input: image, top: 0, left: 0 },
      { input: Buffer.from(footerSvg({ title, section, status })), top: screenshotHeight - 8, left: 0 }
    ])
    .webp({ quality: 86 })
    .toBuffer();

  await fs.writeFile(outputPath, base);
}

async function composeFallback({ outputPath, title, section, status }) {
  const svg = `
  <svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stop-color="#eef6f3"/>
        <stop offset="0.55" stop-color="#f8fafc"/>
        <stop offset="1" stop-color="#fff1ed"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="760" rx="38" fill="url(#bg)"/>
    <rect x="52" y="52" width="1096" height="656" rx="30" fill="rgba(255,255,255,0.72)" stroke="#d8dee8"/>
    <text x="92" y="126" fill="#1f6b5d" font-family="Arial, sans-serif" font-size="32" font-weight="700">${escapeXml(section)} · ${escapeXml(status)}</text>
    <text x="92" y="384" fill="#182033" font-family="Arial, sans-serif" font-size="72" font-weight="700">${escapeXml(title)}</text>
    <text x="92" y="462" fill="#64748b" font-family="Arial, sans-serif" font-size="30">Thumbnail will be generated when the URL is reachable.</text>
  </svg>`;
  await sharp(Buffer.from(svg)).webp({ quality: 88 }).toFile(outputPath);
}

function footerSvg({ title, section, status }) {
  return `
  <svg width="${width}" height="208" xmlns="http://www.w3.org/2000/svg">
    <rect width="${width}" height="208" fill="#ffffff"/>
    <rect x="0" y="0" width="${width}" height="1" fill="#d8dee8"/>
    <text x="52" y="70" fill="#1f6b5d" font-family="Arial, sans-serif" font-size="24" font-weight="700">${escapeXml(section)} · ${escapeXml(status)}</text>
    <text x="52" y="142" fill="#182033" font-family="Arial, sans-serif" font-size="54" font-weight="700">${escapeXml(title)}</text>
  </svg>`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
