# v1.2.1 Map Hotfix

Cross-check result:
- foods.json = 64 districts
- source GeoJSON = 64 district polygons
- v1.2 matcher resolved only 62/64
- missing map-name aliases were:
  - Coxsbazar → coxs-bazar
  - Jhalakathi → jhalokathi
- v1.2 depended on one remote GeoJSON URL, so a blocked/slow request could remove the actual SVG map.

Fixes:
- both missing aliases added;
- jsDelivr GeoJSON primary + Raw GitHub fallback;
- 12 second timeout per map source;
- map accepted only when GeoJSON has 64 features and 64 unique district matches;
- D3 secondary CDN fallback;
- visible 64/64 map status;
- Retry Map button;
- 64-district fallback remains usable;
- service-worker cache bumped to v1.2.1 and local JS/CSS/HTML are network-first.

Replace the package contents over the current repo. After Pages redeploys, hard refresh once.
