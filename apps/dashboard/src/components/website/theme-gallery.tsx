import Link from 'next/link';
import type { Theme } from '@sbaah/shared';
import { useLocale } from '@/lib/i18n/locale-context';
import { ThemePreview } from './theme-preview';

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function EyeIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function PaletteIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.7-.6 1.7-1.5 0-.4-.2-.8-.4-1.1-.3-.4-.5-.7-.5-1.1 0-.7.6-1.3 1.3-1.3H16c2.2 0 4-1.8 4-4C20 6.6 16.4 3 12 3z" />
      <circle cx="7.5" cy="10.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="11" cy="7.5" r="1.1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="9" r="1.1" fill="currentColor" stroke="none" />
    </svg>
  );
}

/**
 * "متجر الثيمات" — one card per theme from `GET /v1/public/themes`
 * (already `is_active`-filtered + ordered server-side). شكل الكرت يطابق
 * مرجعًا أرسله المؤسس: الصورة تملأ الكرت كاملًا (لا صندوق صورة منفصل عن
 * محتوى نصي أسفله)، وتدرّج داكن أسفل الكرت فقط تُعرض فوقه شارة "منشور"
 * (للثيم المُفعَّل فقط)، اسم الثيم، ثم زرّا "معاينة" (يفتح الموقع الحي
 * مباشرة بتبويب جديد) و"تخصيص الثيم" (→ `/website/editor`) — بدل قائمة
 * "..." لأن هذا المنتج لا يملك إجراءات إضافية (نسخ رابط/تكرار/إعادة
 * تسمية) تستحق قائمة منفصلة؛ زرّان مباشران أوضح وأسرع هنا.
 *
 * الثيم غير المُفعَّل ليس له موقع حيّ يُعرض ("معاينة" تعني معاينة الموقع
 * الفعلي، لا الثيم نفسه بمعزل عنه) — فبطاقته تعرض زر "اختيار" وحيدًا بدل
 * الزرّين، ولا تعرض شارة "منشور".
 */
export function ThemeGallery({
  themes,
  selectedThemeId,
  primaryColor,
  siteUrl,
  onSelect,
}: {
  themes: Theme[];
  selectedThemeId: string;
  primaryColor: string;
  siteUrl: string;
  onSelect: (themeId: string) => void;
}) {
  const { pages } = useLocale();
  const t = pages.website;

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 md:grid-cols-3">
      {themes.map((theme) => {
        const selected = theme.id === selectedThemeId;
        return (
          <div
            key={theme.id}
            className={`group relative aspect-[4/3] overflow-hidden rounded-2xl border shadow-sm ${selected ? 'border-brand' : 'border-border-default'}`}
          >
            <button
              type="button"
              onClick={() => onSelect(theme.id)}
              disabled={selected}
              className={`absolute inset-0 h-full w-full overflow-hidden text-start ${!selected ? 'cursor-pointer' : ''}`}
            >
              <div className="h-full w-full transition-transform duration-300 group-hover:scale-105">
                <ThemePreview themeKey={theme.key} primaryColor={primaryColor} previewImageUrl={theme.preview_image_url} />
              </div>
            </button>

            {/* الصورة تملأ الكرت كاملًا (طلب المؤسس، مرجع "Image Scale Effect") — تدرّج داكن أسفل الكرت فقط حتى تبقى الشارة/الاسم/الأزرار واضحة فوق أي صورة، دون تعتيم الصورة كلها. */}
            <div className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-1.5 p-2.5 sm:gap-2 sm:p-4">
              {selected && (
                <div className="flex items-center gap-1.5">
                  <span className="inline-flex items-center gap-1 rounded-full bg-success-surface px-[9px] py-[3px] text-[10px] font-medium text-success sm:px-[11px] sm:py-[5px] sm:text-[11px]">
                    <span className="h-1.5 w-1.5 rounded-full bg-success" aria-hidden="true" />
                    {t.themeStore.publishedBadge}
                  </span>
                  <CheckIcon className="h-3.5 w-3.5 text-success" />
                </div>
              )}

              <span className="truncate text-xs font-semibold text-white sm:text-sm">{theme.name_ar}</span>

              {selected ? (
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <a
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.themeStore.previewTheme}
                    title={t.themeStore.previewTheme}
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-white/90 text-text-primary backdrop-blur hover:bg-white sm:h-9 sm:w-9"
                  >
                    <EyeIcon className="h-4 w-4" />
                  </a>
                  <Link
                    href="/website/editor"
                    className="text-brand flex h-8 flex-1 items-center justify-center gap-1.5 rounded-full bg-white text-xs font-semibold hover:bg-white/90 sm:h-9 sm:text-sm"
                  >
                    <PaletteIcon className="h-3.5 w-3.5 flex-none" />
                    <span className="truncate">{t.themeStore.customizeTheme}</span>
                  </Link>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelect(theme.id)}
                  className="text-text-primary flex h-8 items-center justify-center rounded-full bg-white/90 text-xs font-semibold backdrop-blur hover:bg-white sm:h-9 sm:text-sm"
                >
                  {t.themeStore.selectTheme}
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
