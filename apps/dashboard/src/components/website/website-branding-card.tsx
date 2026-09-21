'use client';

import { useEffect, useState } from 'react';
import type { Website } from '@sbaah/shared';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { AssetUploader } from './asset-uploader';
import { useLocale } from '@/lib/i18n/locale-context';
import { getWebsite, updateWebsite, uploadFavicon, uploadLogo } from '@/lib/api/website';
import { ApiRequestError } from '@/lib/api/client';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * الألوان الأساسي/الثانوي وشعار الموقع — نُقلا من تخصيص الثيم إلى هنا
 * (تبويب "بيانات الموقع" بالإعدادات، طلب المؤسس)؛ لم يعودا موجودين في
 * محرر الموقع إطلاقًا. يجلب بيانات الموقع بنفسه (بلا اعتماد على صفحة
 * الإعدادات لتمريرها) بنفس نمط AddressCard الحالي في هذه الصفحة.
 */
export function WebsiteBrandingCard({ accessToken }: { accessToken: string }) {
  const { pages } = useLocale();
  const t = pages.website.editor;
  const [website, setWebsite] = useState<Website | null>(null);
  const [colorDraft, setColorDraft] = useState({ primary: '', secondary: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getWebsite(accessToken).then((result) => {
      setWebsite(result.website);
      setColorDraft({ primary: result.website.primary_color, secondary: result.website.secondary_color });
    });
  }, [accessToken]);

  async function saveColor(field: 'primary_color' | 'secondary_color', value: string) {
    if (!HEX_PATTERN.test(value)) return;
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { [field]: value });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.errors.saveColor);
    }
  }

  if (!website) {
    return null;
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-base font-semibold text-text-primary">{pages.settings.websiteData.brandingTitle}</h2>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-secondary">{t.primaryColor}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorDraft.primary}
              onChange={(e) => setColorDraft((c) => ({ ...c, primary: e.target.value }))}
              onBlur={() => void saveColor('primary_color', colorDraft.primary)}
              className="h-10 w-10 shrink-0 cursor-pointer rounded-input border border-border-default"
            />
            <Input
              value={colorDraft.primary}
              onChange={(e) => setColorDraft((c) => ({ ...c, primary: e.target.value }))}
              onBlur={() => void saveColor('primary_color', colorDraft.primary)}
              dir="ltr"
              className="h-10 min-w-0 flex-1"
            />
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-secondary">{t.secondaryColor}</label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorDraft.secondary}
              onChange={(e) => setColorDraft((c) => ({ ...c, secondary: e.target.value }))}
              onBlur={() => void saveColor('secondary_color', colorDraft.secondary)}
              className="h-10 w-10 shrink-0 cursor-pointer rounded-input border border-border-default"
            />
            <Input
              value={colorDraft.secondary}
              onChange={(e) => setColorDraft((c) => ({ ...c, secondary: e.target.value }))}
              onBlur={() => void saveColor('secondary_color', colorDraft.secondary)}
              dir="ltr"
              className="h-10 min-w-0 flex-1"
            />
          </div>
        </div>
        <FormError message={error} />
        <AssetUploader
          label={t.logoLabel}
          currentUrl={website.logo_url}
          onUpload={async (file) => {
            const { website: updated } = await uploadLogo(accessToken, file);
            setWebsite((current) => (current ? { ...current, ...updated } : current));
          }}
          onRemove={async () => {
            const { website: updated } = await updateWebsite(accessToken, { logo_url: null });
            setWebsite((current) => (current ? { ...current, ...updated } : current));
          }}
        />
        <p className="text-xs text-text-tertiary">{pages.settings.websiteData.logoFooterNote}</p>
        <div className="border-border-subtle mt-2 border-t pt-4">
          <AssetUploader
            label="أيقونة الموقع"
            kind="favicon"
            currentUrl={website.favicon_url}
            onUpload={async (file) => {
              const { website: updated } = await uploadFavicon(accessToken, file);
              setWebsite((current) => (current ? { ...current, ...updated } : current));
            }}
            onRemove={async () => {
              const { website: updated } = await updateWebsite(accessToken, { favicon_url: null });
              setWebsite((current) => (current ? { ...current, ...updated } : current));
            }}
          />
          <p className="mt-2 text-xs text-text-tertiary">تظهر في تبويب المتصفح بجانب اسم موقعك. يفضّل صورة مربعة 512×512 بصيغة PNG أو ICO، بحد أقصى 1 ميجابايت.</p>
        </div>
      </div>
    </Card>
  );
}
