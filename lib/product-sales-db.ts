// Weekly product-sales utilities.
// Weeks run Sunday through Saturday (migrated from Monday-start).

export const WEEK_START = 'sunday' as const;
export const WEEK_END = 'saturday' as const;

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export interface SeedRow {
  source_row: number;
  InvoiceNo: string;
  StockCode: string;
  Description: string;
  Quantity: number;
  InvoiceDate: string; // "YYYY-MM-DD HH:mm:ss" (UTC)
  UnitPrice: number;
  CustomerID: string | null;
  Country: string;
  week_start_sunday: string; // derived from InvoiceDate in the preserved history
}

export interface WeekBucket {
  week_start: string; // Sunday, ISO date
  week_end: string;   // Saturday, ISO date
  label: string;      // "Sun 7 Apr – Sat 13 Apr"
  units: number;
  revenue: number;
  orders: number;
  rows: number;
}

export function parseInvoiceDate(value: string): Date {
  return new Date(value.replace(' ', 'T') + 'Z');
}

export function toISODate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

// Sunday-start: getUTCDay() is 0 on Sunday, so subtracting it lands on the week's Sunday.
export function weekStartSunday(value: string | Date): string {
  const d = typeof value === 'string' ? parseInvoiceDate(value) : value;
  const start = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
  start.setUTCDate(start.getUTCDate() - start.getUTCDay());
  return toISODate(start);
}

export function weekEndSaturday(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00Z');
  return toISODate(new Date(start.getTime() + 6 * DAY_MS));
}

// Full-range label, e.g. "Sun 7 Apr – Sat 13 Apr".
export function weekLabel(weekStart: string): string {
  const start = new Date(weekStart + 'T00:00:00Z');
  const end = new Date(start.getTime() + 6 * DAY_MS);
  return `Sun ${start.getUTCDate()} ${MONTHS_SHORT[start.getUTCMonth()]} – Sat ${end.getUTCDate()} ${MONTHS_SHORT[end.getUTCMonth()]}`;
}

// Aggregate preserved history rows into Sunday–Saturday weekly buckets.
// Only existing source rows are aggregated; nothing is synthesized.
export function aggregateWeekly(rows: SeedRow[]): WeekBucket[] {
  const buckets = new Map<string, { units: number; revenue: number; invoices: Set<string>; rows: number }>();
  for (const row of rows) {
    const start = weekStartSunday(row.InvoiceDate);
    let b = buckets.get(start);
    if (!b) {
      b = { units: 0, revenue: 0, invoices: new Set<string>(), rows: 0 };
      buckets.set(start, b);
    }
    b.units += row.Quantity;
    b.revenue += row.Quantity * row.UnitPrice;
    b.invoices.add(row.InvoiceNo);
    b.rows += 1;
  }
  return [...buckets.entries()]
    .sort(([a], [z]) => (a < z ? -1 : 1))
    .map(([start, b]) => ({
      week_start: start,
      week_end: weekEndSaturday(start),
      label: weekLabel(start),
      units: b.units,
      revenue: Math.round(b.revenue * 100) / 100,
      orders: b.invoices.size,
      rows: b.rows,
    }));
}

// Integrity guard: re-derive each row's Sunday week start from its genuine
// InvoiceDate and count mismatches against the preserved week_start_sunday.
export function countWeekStartMismatches(rows: SeedRow[]): number {
  return rows.filter((r) => r.week_start_sunday !== weekStartSunday(r.InvoiceDate)).length;
}

// --- Size presentation rule -------------------------------------------------
// A size is only shown when it helps tell apart repeated names/variants
// (same description shared by multiple SKUs). When the source provides no
// size metadata at all, sizes stay omitted and a single status explains it —
// no per-row "N/A" noise.

export const SIZE_UNAVAILABLE_STATUS = 'unavailable in source; sizes omitted';

// Descriptions shared by more than one SKU (candidates for size labels).
export function duplicateDescriptions(names: Record<string, string>): Set<string> {
  const counts = new Map<string, number>();
  for (const desc of Object.values(names)) {
    const key = desc.trim();
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return new Set([...counts.entries()].filter(([, n]) => n > 1).map(([desc]) => desc));
}

// Keep only sizes that disambiguate a duplicated description.
export function resolveSizes(
  names: Record<string, string>,
  sizeMetadata: Record<string, string | null> | null,
): { sizes: Record<string, string>; status: string } {
  if (!sizeMetadata) {
    return { sizes: {}, status: SIZE_UNAVAILABLE_STATUS };
  }
  const dupes = duplicateDescriptions(names);
  const sizes: Record<string, string> = {};
  for (const [code, size] of Object.entries(sizeMetadata)) {
    const desc = names[code];
    if (size && desc && dupes.has(desc.trim())) {
      sizes[code] = size;
    }
  }
  return { sizes, status: 'shown only where sizes disambiguate duplicate variants' };
}

export function seedOnFirstRead() {
  return { seeded: true, guard: 'v2-sunday-start' };
}
