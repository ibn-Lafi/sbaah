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

/**
 * "قبل N دقيقة/ساعة"، "أمس HH:MM"، وإلا التاريخ الكامل (formatDateTime) —
 * لسجل ملاحظات العميل المحتمل (lead detail's "سجل الملاحظات"), حيث توقيت
 * نسبي أوضح للمستخدم من طابع زمني كامل لكل ملاحظة حديثة.
 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return `قبل ${diffMinutes} دقيقة`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `قبل ${diffHours} ساعة`;

  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (dateDay.getTime() === yesterday.getTime()) {
    return `أمس ${date.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}`;
  }

  return formatDateTime(iso);
}
