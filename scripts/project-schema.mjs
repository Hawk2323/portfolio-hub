import { z } from "zod";

const statusSchema = z.enum(["idea", "wip", "live", "paused", "archived"]);
const visibilitySchema = z.enum(["public", "unlisted", "private"]);
const thumbnailModeSchema = z.enum(["auto", "manual", "fallback"]);
const sourceSchema = z.enum(["manual", "pact", "external"]);
const sectionLinkModeSchema = z.enum(["standard", "vpn"]);

export const projectSchema = z.object({
  id: z.string().min(1).regex(/^[a-z0-9-]+$/),
  title: z.string().min(1),
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/),
  section: z.string().min(1),
  status: statusSchema,
  url: z.string().url(),
  description: z.string().min(1),
  technologies: z.array(z.string().min(1)).default([]),
  tools: z.array(z.string().min(1)).default(["AI"]),
  visibility: visibilitySchema.default("private"),
  thumbnail: z.string().min(1).default("/thumbnails/_fallback.webp"),
  thumbnailMode: thumbnailModeSchema.default("auto"),
  thumbnailLocked: z.boolean().default(false),
  thumbnailGeneratedAt: z.string().datetime().nullable().default(null),
  featured: z.boolean().default(false),
  sortOrder: z.number().int().default(100),
  source: sourceSchema.default("manual"),
  notesPrivate: z.string().default("")
});

export const projectsFileSchema = z.object({
  schemaVersion: z.literal("portfolio.projects.v1"),
  updatedAt: z.string().datetime(),
  sections: z.array(z.object({
    id: z.string().min(1).regex(/^[a-z0-9-]+$/),
    title: z.string().min(1),
    description: z.string().default(""),
    sortOrder: z.number().int().default(100),
    linkMode: sectionLinkModeSchema.default("standard")
  })).min(1),
  projects: z.array(projectSchema)
}).superRefine((data, ctx) => {
  const sectionIds = new Set(data.sections.map((section) => section.id));
  const ids = new Set();
  const slugs = new Set();

  for (const project of data.projects) {
    if (!sectionIds.has(project.section)) {
      ctx.addIssue({ code: "custom", path: ["projects", project.id, "section"], message: "Unknown section" });
    }
    if (ids.has(project.id)) {
      ctx.addIssue({ code: "custom", path: ["projects", project.id], message: "Duplicate project id" });
    }
    if (slugs.has(project.slug)) {
      ctx.addIssue({ code: "custom", path: ["projects", project.slug], message: "Duplicate project slug" });
    }
    ids.add(project.id);
    slugs.add(project.slug);
  }
});
