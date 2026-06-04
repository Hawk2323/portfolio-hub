# Portfolio Hub

Portfolio Hub is a clean public tile index for curated projects. The public page shows only `visibility = public` projects from `data/projects.json`; admin editing is protected by a signed HttpOnly session.

## Local development

```bash
npm ci
cp .env.example .env
npm run validate
npm run dev
```

Set `ADMIN_PASSWORD` and `SESSION_SECRET` before using `/admin`.

## Add a project

Use `/admin`, or edit `data/projects.json` directly and run:

```bash
npm run validate
npm run thumbnails
```

New admin-created projects default to `private`. Set `visibility` to `public` only for curated items that are safe to share.

## Sections

Sections are managed in `/admin`. Their `sortOrder` controls the tab order and the public grouping order. Projects are shown under their section heading on the public page.

The `CSAS` section uses `linkMode = vpn`. On the public Vercel site, CSAS cards open a large thumbnail preview instead of following the intranet URL. Static snapshots and environments with `NEXT_PUBLIC_ENABLE_RESTRICTED_LINKS=true` allow those links to open normally.

## Admin

Admin routes:

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/session`
- `GET /api/admin/projects`
- `PUT /api/admin/projects`
- `POST /api/admin/regenerate-thumbnail`
- `POST /api/admin/upload-thumbnail`

In production, writes require GitHub Contents API configuration. Tokens are read only on the server and must never be committed.

## Thumbnails

`npm run thumbnails` opens each eligible project URL with Playwright, captures a screenshot, and composes a `1200 x 760` WebP thumbnail with Sharp.

Skipped automatically:

- `thumbnailLocked = true`
- `thumbnailMode = manual`

If a URL fails, the script creates a fallback thumbnail and sets `thumbnailMode = fallback`.

Admins can also upload a manual thumbnail. The upload is converted to `1200 x 760` WebP, saved under `public/thumbnails`, and the project is saved with `thumbnailMode = manual` and `thumbnailLocked = true`.

## Deployment

Deploy as Vercel project `portfolio-hub`. Required production environment variables:

```text
ADMIN_PASSWORD
SESSION_SECRET
GITHUB_TOKEN
GITHUB_OWNER=Hawk2323
GITHUB_REPO=portfolio-hub
GITHUB_BRANCH=main
NEXT_PUBLIC_ALLOW_INDEXING=false
# Optional, only for internal/VPN deployments:
NEXT_PUBLIC_ENABLE_RESTRICTED_LINKS=true
```

Run:

```bash
npm ci
npm run validate
npm run build
vercel link --yes --project portfolio-hub
vercel --prod --yes
```

See `docs/DEPLOYMENT.md` for non-interactive `VERCEL_TOKEN` deployment.

## Static snapshot

To create a presentation-only static snapshot for a CDN, run:

```bash
npm run snapshot
```

The exported files are written to `out/` and `portfolio-hub-snapshot.zip`. Snapshot mode uses the checked-in `data/projects.json` and `public/thumbnails`, hides the admin link, enables restricted/VPN links, and does not include working admin/API behavior.

## Search indexing

`NEXT_PUBLIC_ALLOW_INDEXING=false` is the default. The app emits `noindex,nofollow`, and `public/robots.txt` disallows all crawlers.

## When thumbnail generation fails

Check that the URL is public, loads without authentication, and is reachable from GitHub Actions. Then reset `thumbnailMode` to `auto` and rerun the thumbnail workflow.
