'use client';

import { useState } from 'react';
import type { WebsitePageKey } from '@sbaah/shared';
import { WEBSITE_PAGE_PATHS } from '@/lib/website/labels';

const DEVICE_WIDTHS = { desktop: '100%', mobile: '390px' } as const;
type Device = keyof typeof DEVICE_WIDTHS;

/** Real live preview (an iframe to the tenant's own subdomain) — not a mockup — with a device-width toggle, matching محرر الموقع's "عرض كمبيوتر / عرض جوال" control. */
export function SitePreview({ siteUrl, pageKey }: { siteUrl: string; pageKey: WebsitePageKey }) {
  const [device, setDevice] = useState<Device>('desktop');

  return (
    <div className="flex flex-col gap-3">
      <div className="flex justify-center gap-2">
        {(['desktop', 'mobile'] as const).map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => setDevice(d)}
            className={`rounded-full px-4 py-1.5 text-xs font-medium ${
              device === d ? 'bg-brand text-white' : 'bg-surface-subtle text-text-secondary'
            }`}
          >
            {d === 'desktop' ? 'عرض كمبيوتر' : 'عرض جوال'}
          </button>
        ))}
      </div>
      <div className="flex justify-center overflow-hidden rounded-card border border-border-subtle bg-surface-subtle p-3">
        <iframe
          key={pageKey + device}
          src={`${siteUrl}${WEBSITE_PAGE_PATHS[pageKey]}`}
          title="معاينة الموقع"
          className="h-[600px] rounded-input border border-border-subtle bg-white transition-[width]"
          style={{ width: DEVICE_WIDTHS[device] }}
        />
      </div>
    </div>
  );
}
