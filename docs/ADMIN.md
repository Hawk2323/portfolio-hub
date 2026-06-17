# Admin

The admin UI lives at `/admin` and is protected by a signed HttpOnly cookie.

## Required environment variables

- `ADMIN_PASSWORD`: password typed into the admin form.
- `SESSION_SECRET`: long random string used to sign the session cookie.
- `GITHUB_TOKEN`: token used by the API to update `data/projects.json` through the GitHub Contents API.
- `GITHUB_OWNER`: defaults to `Hawk2323`.
- `GITHUB_REPO`: defaults to `portfolio-hub`.
- `GITHUB_BRANCH`: defaults to `main`.

In production, writes are rejected unless GitHub write configuration is present. Local development can write directly to `data/projects.json`.

## Session behavior

- Cookie name: `portfolio_hub_session`.
- Cookie flags: `HttpOnly`, `SameSite=Lax`, `Secure` in production.
- Session lifetime: 12 hours.
- Passwords and tokens are never returned to the frontend.

## Admin actions

The admin can add, edit, archive, delete, reorder, publish, hide, and retag projects. New projects default to `visibility = private`.

Manual thumbnail uploads accept JPEG, PNG, and WebP images up to 6 MB. The server converts the upload to a `1200 x 760` WebP file without cropping it, stores it in `public/thumbnails`, and saves the project with `thumbnailMode = manual` and `thumbnailLocked = true` so automated thumbnail generation will not overwrite it.
