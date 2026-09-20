'use client';

import { useEffect, useState } from 'react';
import type { WebsitePageKey } from '@sbaah/shared';
import { useLocale } from '@/lib/i18n/locale-context';
import { WEBSITE_PAGE_PATHS } from '@/lib/website/labels';
import { listAssets } from '@/lib/api/real-estate';

const DEVICE_WIDTHS = { desktop: '100%', mobile: '390px' } as const;
export type Device = keyof typeof DEVICE_WIDTHS;

interface SitePreviewProps {
  siteUrl: string;
  pageKey: WebsitePageKey;
  device: Device;
  accessToken: string;
  /** Increment after a successful customization write to reload the real tenant preview. */
  revision?: number;
}

/**
 * Real live preview (an iframe to the tenant's own subdomain) — not a
 * mockup. Device width is controlled by the toolbar (site/editor/page.tsx),
 * not owned here.
 *
 * "تفاصيل العقار" لا رابط ثابتًا له (كل عقار له صفحته الخاصة، `/properties/{id}`)
 * — بخلاف كل الصفحات الأخرى. نعرض أول عقار منشور فعليًا بدل قائمة
 * العقارات (السلوك السابق، مطابقة لصفحة أخرى بالخطأ) حتى تكون المعاينة
 * صورة حقيقية لما يراه الزائر (صور/وصف/سعر)، لا صفحة عامة لا صلة لها.
 */
export function SitePreview({ siteUrl, pageKey, device, accessToken, revision = 0 }: SitePreviewProps) {
  const { pages } = useLocale();
  const t = pages.website;
  const [previewPropertyId, setPreviewPropertyId] = useState<string | null>(null);

  useEffect(() => {
    if (pageKey !== 'property_detail') return;
    let cancelled = false;
    void listAssets(accessToken, { page: 1 }).then((result) => {
      if (!cancelled) setPreviewPropertyId(result.assets[0]?.id ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [pageKey, accessToken]);

  const path = pageKey === 'property_detail' ? (previewPropertyId ? `/properties/${previewPropertyId}` : null) : WEBSITE_PAGE_PATHS[pageKey];

  return (
    <div className="flex h-full items-center justify-center overflow-auto bg-surface-page p-6">
      {path ? (
        <iframe
          key={pageKey + device + path + revision}
          src={`${siteUrl}${path}`}
          title={t.editor.sitePreviewTitle}
          className="h-full max-h-full rounded-input border border-border-subtle bg-white shadow-[0_2px_12px_rgba(31,29,34,.06)] transition-[width]"
          style={{ width: DEVICE_WIDTHS[device] }}
        />
      ) : (
        <p className="text-text-secondary max-w-xs text-center text-sm">{t.editor.noPublishedPropertyForPreview}</p>
      )}
    </div>
  );
}
