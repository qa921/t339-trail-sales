// Client-side rendering for Sunday–Saturday product-sales weeks.

const DAY_MS = 24 * 60 * 60 * 1000;
const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

// Full-range label, e.g. "Sun 7 Apr – Sat 13 Apr".
export function weekLabel(weekStart) {
  const start = new Date(weekStart + 'T00:00:00Z');
  const end = new Date(start.getTime() + 6 * DAY_MS);
  return `Sun ${start.getUTCDate()} ${MONTHS_SHORT[start.getUTCMonth()]} – Sat ${end.getUTCDate()} ${MONTHS_SHORT[end.getUTCMonth()]}`;
}

// Returns the Sunday–Saturday weekly buckets with guaranteed labels.
export function renderProductSales(payload) {
  const weeks = (payload && payload.weeks) || [];
  return weeks.map((w) => ({
    week_start: w.week_start,
    week_end: w.week_end,
    label: w.label || weekLabel(w.week_start),
    units: w.units,
    revenue: w.revenue,
    orders: w.orders,
    rows: w.rows,
  }));
}
