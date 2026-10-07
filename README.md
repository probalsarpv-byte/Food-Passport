# বাংলাদেশ স্বাদ মানচিত্র — GitHub Edition v1.2

Production static web app for GitHub Pages.

## v1.2 highlights

- **64 clickable districts**
- **142 curated food experiences**
- **Tried + Want to Try** দুই ধরনের user state
- personal **Food Trail** view
- smart **Next Food** suggestion
- food detail modal with photo, reference, credit and license
- initial **10 iconic food-photo entries**
- initial **9 source-checked entries**
- alias-aware district/food search
- district progress heatmap
- 1080×1350 social share-card
- JSON backup/import with v1/v1.1 migration
- URL deep link: `#district=bogura`
- mobile + desktop responsive UI
- PWA manifest + service worker
- fallback district selector if the remote polygon map fails
- GitHub Action validating food schema, IDs, sources and JS syntax

## Deploy

Upload **the contents of this folder** to your repository root.

Then:

**Settings → Pages → Deploy from a branch → main → /(root) → Save**

No backend, Firebase, npm build, database server or API key is required.

## Food data

All content lives in:

`data/foods.json`

A v1.2 food entry supports:

```json
{
  "name": "বগুড়ার দই",
  "en": "Bogura Doi",
  "category": "sweet",
  "emoji": "🥛",
  "note": "সংক্ষিপ্ত বর্ণনা",
  "id": "bogura--1",
  "aliases": ["Bogurar doi"],
  "image": "https://...",
  "image_source": "https://commons.wikimedia.org/...",
  "image_credit": "Photographer",
  "image_license": "CC BY-SA 4.0",
  "source": "https://...",
  "source_label": "Source name",
  "featured": true,
  "verified": true
}
```

### Meaning of `verified`

`verified: true` means a specific public reference has been attached to the entry. It does **not** mean government certification or GI status.

### Photo policy

The included initial photo layer uses Wikimedia Commons images and keeps author/license/source metadata in `foods.json`. The Food Details modal exposes those credits.

For your own photo library, put files in:

`assets/images/foods/`

and use a relative path such as:

`./assets/images/foods/bogura-doi.webp`

## Important

The database is a regional/cultural food experience list, not an official “one district = one food” list. Foods can overlap geographically. Keep claims neutral and attach sources when promoting an entry as district-specific.

## Version

**v1.2.0 — GitHub Pages production build**
