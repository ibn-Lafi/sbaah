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

/** "قبل دقيقة/دقيقتين/N دقائق/N دقيقة" — المثنى والجمع العربيان الصحيحان بدل "قبل 2 دقيقة". */
function arabicAgo(count: number, singular: string, dual: string, plural: string): string {
  if (count === 1) return `قبل ${singular}`;
  if (count === 2) return `قبل ${dual}`;
  if (count >= 3 && count <= 10) return `قبل ${count} ${plural}`;
  return `قبل ${count} ${singular}`;
}

/** "4:20 م" — أرقام غربية (لا شرقية) بنظام 12 ساعة، مطابقةً لبقية تنسيقات التاريخ/الوقت بالتطبيق. */
function formatTime12h(date: Date): string {
  const hours24 = date.getHours();
  const suffix = hours24 >= 12 ? 'م' : 'ص';
  const hours12 = hours24 % 12 || 12;
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours12}:${minutes} ${suffix}`;
}

/**
 * "قبل دقيقتين"، "أمس 4:20 م"، وإلا التاريخ الكامل (formatDateTime) —
 * لسجل ملاحظات العميل المحتمل (lead detail's "سجل الملاحظات"), حيث توقيت
 * نسبي أوضح للمستخدم من طابع زمني كامل لكل ملاحظة حديثة.
 */
export function formatRelativeTime(iso: string): string {
  const date = new Date(iso);
  const diffMs = Date.now() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60_000);

  if (diffMinutes < 1) return 'الآن';
  if (diffMinutes < 60) return arabicAgo(diffMinutes, 'دقيقة', 'دقيقتين', 'دقائق');

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return arabicAgo(diffHours, 'ساعة', 'ساعتين', 'ساعات');

  const now = new Date();
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const dateDay = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  if (dateDay.getTime() === yesterday.getTime()) {
    return `أمس ${formatTime12h(date)}`;
  }

  return formatDateTime(iso);
}
