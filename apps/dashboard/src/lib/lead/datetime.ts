/** `<input type="datetime-local">` uses local time with no timezone (e.g. "2026-01-01T10:00") — leadUpdateSchema expects a full ISO 8601 datetime (Zod's z.string().datetime()), so these convert at the two boundaries. */

export function isoToDatetimeLocal(iso: string | null): string {
  if (!iso) return '';
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function datetimeLocalToIso(value: string): string | null {
  if (!value) return null;
  return new Date(value).toISOString();
}
