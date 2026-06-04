# Deployment

Target Vercel project: `portfolio-hub`.

## Environment variables

Set these in Vercel production:

```text
ADMIN_PASSWORD
SESSION_SECRET
GITHUB_TOKEN
GITHUB_OWNER=Hawk2323
GITHUB_REPO=portfolio-hub
GITHUB_BRANCH=main
NEXT_PUBLIC_ALLOW_INDEXING=false
```

`GITHUB_TOKEN` should have repository contents read/write access only for `Hawk2323/portfolio-hub`.

## Manual deployment

```bash
npm ci
npm run validate
npm run build
vercel link --yes --project portfolio-hub
vercel --prod --yes
```

## Token deployment

If `VERCEL_TOKEN` is available:

```bash
vercel pull --yes --environment=production --token "$VERCEL_TOKEN"
vercel build --prod --token "$VERCEL_TOKEN"
vercel deploy --prebuilt --prod --token "$VERCEL_TOKEN"
```

## Thumbnail generation

Production thumbnail generation is handled by the `Generate thumbnails` GitHub Action. Run it manually with `workflow_dispatch`, or let it run when `data/projects.json` changes.

The `/api/admin/regenerate-thumbnail` route runs local thumbnail generation in development. On Vercel, use the GitHub Action because Playwright browser execution is not part of the serverless write path.

## Static CDN snapshot

Use this when the portfolio needs to be uploaded to a static CDN, for example as a presentation snapshot:

```bash
npm ci
npm run validate
npm run snapshot
```

Upload the contents of `out/` to the CDN. The snapshot is read-only: it uses the checked-in `data/projects.json` and `public/thumbnails`, hides the public admin link, and does not provide working admin/API routes. Make all content and thumbnail changes in the Vercel/GitHub-backed version first, then build a fresh snapshot.

On Windows, stop `npm run dev` before building the snapshot. The script temporarily moves `app/admin` and `app/api` out of the build so static export contains only the public presentation.
