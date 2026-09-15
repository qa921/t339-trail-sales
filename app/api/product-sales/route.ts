import part1 from '../../../data/product-sales/seed/part-1.json';
import part2 from '../../../data/product-sales/seed/part-2.json';
import part3 from '../../../data/product-sales/seed/part-3.json';
import part4 from '../../../data/product-sales/seed/part-4.json';
import part5 from '../../../data/product-sales/seed/part-5.json';
import names from '../../../data/product-sales/names.json';
import bundlesFile from '../../../data/product-sales/bundles.json';
import vendorsFile from '../../../data/product-sales/vendors.json';
import catalog from '../../../data/product-sales/catalog-source.json';
import {
  WEEK_START,
  WEEK_END,
  aggregateWeekly,
  countWeekStartMismatches,
  resolveSizes,
  type SeedRow,
} from '../../../lib/product-sales-db';

// Preserved history: only genuine UCI Online Retail rows (CC BY 4.0).
const rows: SeedRow[] = [
  ...(part1.rows as SeedRow[]),
  ...(part2.rows as SeedRow[]),
  ...(part3.rows as SeedRow[]),
  ...(part4.rows as SeedRow[]),
  ...(part5.rows as SeedRow[]),
];

export async function GET() {
  const weeks = aggregateWeekly(rows);
  // Sizes only where they separate duplicate variants; source has none.
  const { sizes, status: sizeStatus } = resolveSizes(
    names as Record<string, string>,
    catalog.size_metadata as Record<string, string | null> | null,
  );
  return Response.json({
    week_start: WEEK_START, // 'sunday'
    week_end: WEEK_END,     // 'saturday'
    weeks,                  // Sunday–Saturday buckets with full-range labels
    sales: rows,            // preserved per-row history with week_start_sunday
    names,
    sizes,                  // filtered: only disambiguating sizes (empty when source has none)
    size_status: sizeStatus,
    vendors: vendorsFile.vendors, // preserved as-is (unavailable in UCI source)
    bundles: bundlesFile.bundles, // preserved as-is (unavailable in UCI source)
    size_metadata: catalog.size_metadata, // null: unavailable in UCI source; not invented
    size_metadata_status: catalog.size_metadata_status,
    provenance: catalog.source,
    integrity: {
      rows: rows.length,
      week_start_mismatches: countWeekStartMismatches(rows),
    },
  });
}
