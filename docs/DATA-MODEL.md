# Data Model

The source of truth is `data/projects.json`.

## File

- `schemaVersion`: currently `portfolio.projects.v1`.
- `updatedAt`: ISO datetime.
- `sections`: display sections sorted by `sortOrder`.
- `projects`: curated project entries.

## Project fields

- `id`: stable lowercase identifier.
- `title`: display name.
- `slug`: thumbnail filename base.
- `section`: section id.
- `status`: `idea`, `wip`, `live`, `paused`, or `archived`.
- `url`: external project URL.
- `description`: public short description.
- `tags`: public tags.
- `visibility`: `public`, `unlisted`, or `private`.
- `thumbnail`: path or URL shown on cards.
- `thumbnailMode`: `auto`, `manual`, or `fallback`.
- `thumbnailLocked`: prevents automatic overwrite when true.
- `thumbnailGeneratedAt`: ISO datetime or null.
- `featured`: sorts before regular entries.
- `sortOrder`: lower values sort first.
- `source`: `manual`, `pact`, or `external`.
- `notesPrivate`: admin-only notes.

Only `visibility = public` is rendered on `/`.
