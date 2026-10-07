# Contributing to Bangladesh Food Passport v1.2

Food correction/addition PRs should edit `data/foods.json`.

For a district-specific claim, please add a credible `source`. For photos, include the original `image_source`, creator/credit and license.

Do not change an existing food ID unless it was never published: IDs are used by visitors' saved browser data.

GitHub Actions validates:
- exactly 64 districts
- unique food IDs and district slugs
- required food fields
- `verified` entries have a source
- image entries have an image source
- JavaScript syntax
