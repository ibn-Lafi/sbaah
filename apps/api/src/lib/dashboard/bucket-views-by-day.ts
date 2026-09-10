/**
 * Buckets `property_views` rows into daily counts for the dashboard's
 * views chart (7/30-day toggle) — pure function, no I/O, unit-testable
 * directly (matches lib/digest/group-overdue-leads.ts's convention).
 *
 * Returns exactly `days` entries, oldest first, `date` as `YYYY-MM-DD`
 * (UTC) — even days with zero views get an entry, so the chart never has
 * gaps.
 */
export function bucketViewsByDay(rows: { created_at: string }[], days: number, now: Date = new Date()): { date: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const date = row.created_at.slice(0, 10);
    counts.set(date, (counts.get(date) ?? 0) + 1);
  }

  const buckets: { date: string; count: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(now);
    d.setUTCDate(d.getUTCDate() - i);
    const date = d.toISOString().slice(0, 10);
    buckets.push({ date, count: counts.get(date) ?? 0 });
  }
  return buckets;
}
