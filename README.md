# বাংলাদেশ স্বাদ মানচিত্র — GitHub Edition v1.7

Production static web app for GitHub Pages.

## v1.7 Quality Release

- 64 clickable districts
- **139 public food experiences**, all with a specific reference link
- **9 manually retained food photos**; automatic Wikimedia search is disabled
- no representative/generic photograph fallback — missing exact photos show a colourful category icon
- public **Backup / Import removed**; user progress still auto-saves in browser localStorage
- food/photo correction opens a prefilled email to `probalofficial007@gmail.com`
- existing v1.6 state is migrated and removed food IDs are safely ignored
- colourful labelled 64-district map, mobile food explorer, editable Food Passport and reset controls retained

## Deploy

Upload the **contents of this folder** to the repository root. Then enable GitHub Pages from `main / (root)`.

No backend, Firebase, npm build, API key or database server is required.

## Data quality policy

The public database is intentionally smaller than v1.6. Community-only rows were removed from the public build rather than presenting them as established district facts. `source` is the reference for the district/food association; `image_source` is only the photo/license reference.

`verified: true` / `audit_status: reference_linked` means a public reference is attached. It does **not** mean GI status, government certification, or scientific validation.

### Photo policy

`photo_status: verified_food_photo` means the retained image was manually allowed because it depicts the named food type. If this status is absent/`none`, the UI must show an illustrated icon — never an automatically searched or unrelated photo.

## Corrections

Visitors should use the in-app email correction button. Repository editing or a GitHub account is not required.

## Version

**v1.7.0 — GitHub Pages quality-audit build**
