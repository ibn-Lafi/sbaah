import Link from 'next/link';
import type { Theme } from '@sbaah/shared';
import { ThemePreview } from './theme-preview';

/**
 * "متجر الثيمات" — one card per theme from `GET /v1/public/themes`
 * (already `is_active`-filtered + ordered server-side). The selected
 * theme's card shows a "تخصيص الثيم" link into `/site/editor` (أقسام/
 * صفحات/ألوان) instead of a select action — theme picking and content
 * editing are two separate screens now, not one combined page.
 */
export function ThemeGallery({
  themes,
  selectedThemeId,
  primaryColor,
  onSelect,
}: {
  themes: Theme[];
  selectedThemeId: string;
  primaryColor: string;
  onSelect: (themeId: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {themes.map((theme) => {
        const selected = theme.id === selectedThemeId;
        return (
          <div
            key={theme.id}
            className={`flex flex-col overflow-hidden rounded-control border-2 ${selected ? 'border-brand' : 'border-border-default'}`}
          >
            <button
              type="button"
              onClick={() => onSelect(theme.id)}
              disabled={selected}
              className={`aspect-[16/10] w-full border-b border-border-subtle text-start ${!selected ? 'hover:opacity-90' : ''}`}
            >
              <ThemePreview themeKey={theme.key} primaryColor={primaryColor} />
            </button>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-text-primary">{theme.name_ar}</span>
              {selected ? (
                <Link href="/site/editor" className="text-xs font-semibold text-brand hover:underline">
                  تخصيص الثيم
                </Link>
              ) : (
                <button type="button" onClick={() => onSelect(theme.id)} className="text-xs font-semibold text-text-secondary hover:text-brand">
                  اختيار
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
