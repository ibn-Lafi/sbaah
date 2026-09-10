import type { WebsitePageKey } from '@sbaah/shared';
import { WEBSITE_PAGE_PATHS } from '@/lib/website/labels';

const DEVICE_WIDTHS = { desktop: '100%', mobile: '390px' } as const;
export type Device = keyof typeof DEVICE_WIDTHS;

/** Real live preview (an iframe to the tenant's own subdomain) — not a mockup. Device width is controlled by the toolbar (site/editor/page.tsx), not owned here. */
export function SitePreview({ siteUrl, pageKey, device }: { siteUrl: string; pageKey: WebsitePageKey; device: Device }) {
  return (
    <div className="flex h-full items-center justify-center overflow-auto bg-surface-page p-6">
      <iframe
        key={pageKey + device}
        src={`${siteUrl}${WEBSITE_PAGE_PATHS[pageKey]}`}
        title="معاينة الموقع"
        className="h-full max-h-full rounded-input border border-border-subtle bg-white shadow-[0_2px_12px_rgba(31,29,34,.06)] transition-[width]"
        style={{ width: DEVICE_WIDTHS[device] }}
      />
    </div>
  );
}
