import { WEBSITE_PAGE_KEYS, type WebsitePageKey } from '@sbaah/shared';
import { WEBSITE_PAGE_LABELS } from '@/lib/website/labels';
import type { WebsitePageWithSections } from '@/lib/api/website';

/** "صفحات" tab — the site's 6 fixed pages (migration 0024), each with a section count. No "add page" — pages are fixed, not user-created. */
export function PageTabs({
  pages,
  activeKey,
  onSelect,
}: {
  pages: WebsitePageWithSections[];
  activeKey: WebsitePageKey;
  onSelect: (key: WebsitePageKey) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {WEBSITE_PAGE_KEYS.map((key) => {
        const page = pages.find((p) => p.key === key);
        const count = page?.website_sections.length ?? 0;
        const active = key === activeKey;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              active ? 'bg-brand text-white' : 'bg-surface-subtle text-text-secondary hover:text-text-primary'
            }`}
          >
            {WEBSITE_PAGE_LABELS[key]}
            <span className={`ms-2 text-xs ${active ? 'text-white/70' : 'text-text-placeholder'}`}>{count}</span>
          </button>
        );
      })}
    </div>
  );
}
