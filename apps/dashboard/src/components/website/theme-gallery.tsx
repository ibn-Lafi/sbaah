import type { Theme } from '@sbaah/shared';
import { ThemePreview } from './theme-preview';

/**
 * "متجر الثيمات" (task: theme store) — replaces the old plain `<Select>`
 * theme picker with a real visual gallery, one card per theme from
 * `GET /v1/public/themes` (already `is_active`-filtered + ordered server-side).
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
          <button
            key={theme.id}
            type="button"
            onClick={() => onSelect(theme.id)}
            className={`flex flex-col overflow-hidden rounded-control border-2 text-start transition-colors ${
              selected ? 'border-brand' : 'border-border-default hover:border-brand/40'
            }`}
          >
            <div className="aspect-[16/10] w-full border-b border-border-subtle">
              <ThemePreview themeKey={theme.key} primaryColor={primaryColor} />
            </div>
            <div className="flex items-center justify-between px-3 py-2">
              <span className="text-sm font-medium text-text-primary">{theme.name_ar}</span>
              {selected && <span className="text-xs font-semibold text-brand">الثيم الحالي</span>}
            </div>
          </button>
        );
      })}
    </div>
  );
}
