# Product-sales weekly flow

The fixture now uses Sunday-start (Sunday–Saturday) weeks end to end:

- **History**: retained UCI Online Retail rows keep their preserved
  `week_start_sunday`, re-derived from each genuine `InvoiceDate` at read time
  (integrity check: `integrity.week_start_mismatches` must be 0).
- **API**: `GET /api/product-sales` aggregates rows into Sunday–Saturday buckets
  (`weeks[]` with `week_start`, `week_end`, `label`, `units`, `revenue`,
  `orders`, `rows`) and reports `week_start: "sunday"` / `week_end: "saturday"`.
  Labels show the full range, e.g. "Sun 7 Apr – Sat 13 Apr".
- **UI**: `public/index.html` + `public/product-sales.js` render the weekly
  table with the same full-range labels.

Preservation rules (no invented data): bundle rollups stay as stored
(`bundles.json` is empty — unavailable in the UCI source), vendors stay empty,
and SKU size metadata remains `null` with its documented status. Deployment
verification should confirm the exact deployed commit matches the migration
commit on `main`.
