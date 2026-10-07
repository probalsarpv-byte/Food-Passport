# v1.2 Food data guide

`foods.json` is the content source of truth.

Rules:
- keep district slugs stable;
- keep published food IDs stable so browser-saved passports do not break;
- every `verified: true` item needs a `source`;
- every remote/local `image` should have `image_source`, `image_credit`, and `image_license` when applicable;
- use `aliases` for old spellings and English/Bangla variants;
- prefer WebP for images stored in this repository;
- avoid claiming exclusivity when a food is common across multiple districts.
