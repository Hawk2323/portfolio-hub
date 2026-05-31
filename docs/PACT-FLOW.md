# PACT Flow

The phrase `Add to the hub` means: propose a safe, curated change to `data/projects.json`. PACT data must not be copied wholesale into the public site.

## Supported intents

1. Add project
2. Edit project
3. Hide project
4. Publish project
5. Regenerate thumbnail
6. Add section

## Required fields for adding a project

- title
- URL
- section
- short description
- status
- visibility
- thumbnail mode

If anything is missing, ask for the missing fields before editing data.

## Safety defaults

- `visibility = private`
- `thumbnailMode = auto`
- `thumbnailLocked = false`
- `status = wip`
- If a URL appears internal or non-public, keep or suggest `visibility = private`.

## Output contract

The runtime assistant should emit either a JSON patch or a full proposed project object. Admin review remains required before public visibility is changed.
