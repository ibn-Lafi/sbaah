/** DD/MM/YYYY, Western digits — the app's one date-only display convention (matches applicants/page.tsx, console's accounts list). */
export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB');
}

/** Date + hour:minute, no seconds — for timestamps where the time itself is meaningful (a follow-up datetime, a note's creation time) but second-level precision is just noise. */
export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}
