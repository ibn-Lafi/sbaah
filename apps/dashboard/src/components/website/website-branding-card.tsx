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
  const [colorDraft, setColorDraft] = useState({ primary: '', secondary: '', background: '' });
  const [error, setError] = useState<string | null>(null);
  const [copyrightDraft, setCopyrightDraft] = useState('');
  const [copyrightLocked, setCopyrightLocked] = useState(true);

  useEffect(() => {
    void getWebsite(accessToken).then((result) => {
      setWebsite(result.website);
      setColorDraft({ primary: result.website.primary_color, secondary: result.website.secondary_color, background: result.website.background_color ?? '#F4F1EA' });
      setCopyrightDraft(result.website.copyright_text || 'جميع الحقوق محفوظة @سبعة');
      setCopyrightLocked(!result.capabilities.can_customize_copyright);
    });
  }, [accessToken]);

  async function saveColor(field: 'primary_color' | 'secondary_color' | 'background_color', value: string) {
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
        <div className="flex flex-col gap-2">
          <label className="text-xs text-text-secondary">لون الخلفية</label>
          <p className="text-xs text-text-tertiary">خلفية الصفحات والأقسام الأساسية للموقع.</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={colorDraft.background}
              onChange={(e) => setColorDraft((draft) => ({ ...draft, background: e.target.value }))}
              onBlur={() => void saveColor('background_color', colorDraft.background)}
              className="h-10 w-10 shrink-0 cursor-pointer rounded-input border border-border-default"
            />
            <Input
              value={colorDraft.background}
              onChange={(e) => setColorDraft((draft) => ({ ...draft, background: e.target.value }))}
              onBlur={() => void saveColor('background_color', colorDraft.background)}
              dir="ltr"
              className="h-10 min-w-0 flex-1"
            />
          </div>
        </div>
        <div className="rounded-xl border border-border-subtle bg-surface-subtle p-3 text-xs leading-6 text-text-secondary">
          <strong className="text-text-primary">نظام الألوان:</strong> الأساسي للأزرار وروابط الإجراء والعناصر النشطة، الثانوي للتفاصيل الداعمة واللمسات البصرية، والخلفية لسطح الصفحات والأقسام. النصوص تبقى بألوان عالية التباين لضمان القراءة.
        </div>
        <div className="border-border-subtle mt-2 border-t pt-4">
          <label className="mb-2 block text-xs font-medium text-text-secondary">حقوق الموقع</label>
          <div className="relative">
            <Input value={copyrightDraft} onChange={(e) => setCopyrightDraft(e.target.value)} onBlur={async()=>{if(copyrightLocked)return;try{const {website:updated}=await updateWebsite(accessToken,{copyright_text:copyrightDraft});setWebsite(current=>current?{...current,...updated}:current)}catch(err){if(err instanceof ApiRequestError&&err.status===403){setCopyrightLocked(true);setCopyrightDraft(website.copyright_text||'جميع الحقوق محفوظة @سبعة')}setError(err instanceof ApiRequestError?err.message:'تعذر حفظ حقوق الموقع')}}} disabled={copyrightLocked} className="h-10 pe-10" />
            {copyrightLocked&&<span aria-label="مغلق" title="مغلق" className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-text-tertiary"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-4 w-4"><rect x="5" y="10" width="14" height="10" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg></span>}
          </div>
          {copyrightLocked?<p className="mt-2 text-xs leading-5 text-text-tertiary">تخصيص حقوق الموقع متاح لباقة <strong className="text-text-primary">Gold</strong> فقط. <a href="/billing/plans" className="font-medium text-brand hover:underline">رقِّ باقتك لتخصيص النص.</a></p>:<p className="mt-2 text-xs leading-5 text-text-tertiary">يمكنك تخصيص نص الحقوق لأن باقتك تدعم هذه الميزة.</p>}
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
