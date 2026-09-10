'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { customDomainInputSchema, SUPPORTED_WEBSITE_FONTS, type Theme } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { AssetUploader } from '@/components/website/asset-uploader';
import { SectionList } from '@/components/website/section-list';
import { ThemeGallery } from '@/components/website/theme-gallery';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import {
  getWebsite,
  updateWebsite,
  uploadBanner,
  uploadLogo,
  type WebsiteWithSections,
} from '@/lib/api/website';
import { listThemes } from '@/lib/api/reference-data';
import { getDomain, setDomain, removeDomain, type DomainInfo } from '@/lib/api/tenant';
import { ApiRequestError } from '@/lib/api/client';

const HEX_PATTERN = /^#[0-9A-Fa-f]{6}$/;

/**
 * Custom domain — lives here (not a separate Settings page) to match the
 * founder-reported journey (PRODUCT_SPEC.md section 5: "...نشر →
 * (اختياري) دومين مخصص" is the last step of setting the site up, not a
 * general account setting). Owner-only, same as the api endpoint.
 */
function DomainSection({ accessToken, ownerOnly }: { accessToken: string; ownerOnly: boolean }) {
  const [domain, setDomainState] = useState<DomainInfo | null>(null);
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function reload() {
    void getDomain(accessToken).then(setDomainState);
  }

  useEffect(reload, [accessToken]);

  async function handleSet(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = customDomainInputSchema.safeParse({ custom_domain: input });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'صيغة الدومين غير صحيحة');
      return;
    }
    setLoading(true);
    try {
      await setDomain(accessToken, result.data.custom_domain);
      setInput('');
      reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر ربط الدومين');
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    try {
      await removeDomain(accessToken);
      reload();
    } finally {
      setLoading(false);
    }
  }

  if (!ownerOnly) {
    return (
      <Card className="p-8">
        <h2 className="mb-1 text-base font-semibold text-text-primary">الدومين المخصص</h2>
        <p className="text-sm text-text-secondary">إدارة الدومين متاحة لمالك الحساب فقط.</p>
      </Card>
    );
  }

  return (
    <Card className="p-8">
      <h2 className="mb-4 text-base font-semibold text-text-primary">الدومين المخصص</h2>

      {domain === null ? (
        <p className="text-sm text-text-secondary">جارٍ التحميل...</p>
      ) : !domain.custom_domain_allowed ? (
        <p className="text-sm text-text-secondary">
          باقتك الحالية لا تشمل ربط دومين مخصص — تواصل مع فريق سبعة للترقية لباقة تدعمه.
        </p>
      ) : domain.custom_domain ? (
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2">
            <span dir="ltr" className="font-medium text-text-primary">
              {domain.custom_domain}
            </span>
            <Badge
              status={domain.custom_domain_status === 'verified' ? 'active' : 'draft'}
              label={domain.custom_domain_status === 'verified' ? 'مُفعّل' : 'بانتظار ربط DNS'}
            />
          </div>
          {domain.custom_domain_status === 'pending' && domain.dns_record && (
            <div className="rounded-control bg-surface-subtle p-4 text-sm" dir="ltr">
              <p className="mb-2 text-text-secondary">أضف سجل CNAME التالي عند مزوّد الدومين:</p>
              <p>Type: {domain.dns_record.type}</p>
              <p>Name: {domain.dns_record.name}</p>
              <p>Value: {domain.dns_record.value}</p>
            </div>
          )}
          <Button variant="danger" onClick={handleRemove} disabled={loading} className="w-fit">
            إزالة الدومين
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSet} className="flex flex-col gap-4">
          <Input placeholder="example.com" value={input} onChange={(e) => setInput(e.target.value)} dir="ltr" />
          <FormError message={error} />
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? 'جارٍ الربط...' : 'ربط دومين'}
          </Button>
        </form>
      )}
    </Card>
  );
}

export default function WebsiteEditorPage() {
  const { me, accessToken } = useCurrentUser();
  const [website, setWebsite] = useState<WebsiteWithSections | null>(null);
  const [themes, setThemes] = useState<Theme[]>([]);
  const [colorDraft, setColorDraft] = useState({ primary: '', secondary: '' });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void getWebsite(accessToken).then((result) => {
      setWebsite(result.website);
      setColorDraft({ primary: result.website.primary_color, secondary: result.website.secondary_color });
    });
    void listThemes().then(setThemes);
  }, [accessToken]);

  async function saveTheme(themeId: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { theme_id: themeId });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ الثيم');
    }
  }

  async function saveColor(field: 'primary_color' | 'secondary_color', value: string) {
    if (!HEX_PATTERN.test(value)) return;
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { [field]: value });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ اللون');
    }
  }

  async function saveFont(font: string) {
    setError(null);
    try {
      const { website: updated } = await updateWebsite(accessToken, { font_family: font });
      setWebsite((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ الخط');
    }
  }

  if (!website) {
    return (
      <AppShell
        title="محرر الموقع"
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
        roleLabel={ROLE_LABELS[me.user.role]}
      >
        <p className="text-text-secondary">جارٍ التحميل...</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="محرر الموقع"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="flex max-w-[720px] flex-col gap-6">
        <FormError message={error} />

        <Card className="p-8">
          <h2 className="mb-1 text-base font-semibold text-text-primary">متجر الثيمات</h2>
          <p className="mb-4 text-sm text-text-secondary">اختر شكل موقعك — التخصيص أدناه (الألوان والخط والشعار) ينطبق على أي ثيم تختاره</p>
          <ThemeGallery themes={themes} selectedThemeId={website.theme_id} primaryColor={website.primary_color} onSelect={(themeId) => void saveTheme(themeId)} />
        </Card>

        <Card className="p-8">
          <h2 className="mb-4 text-base font-semibold text-text-primary">الألوان والخط</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary">اللون الأساسي</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorDraft.primary}
                  onChange={(e) => setColorDraft((c) => ({ ...c, primary: e.target.value }))}
                  onBlur={() => void saveColor('primary_color', colorDraft.primary)}
                  className="h-[54px] w-[54px] shrink-0 cursor-pointer rounded-input border border-border-default"
                />
                <Input
                  value={colorDraft.primary}
                  onChange={(e) => setColorDraft((c) => ({ ...c, primary: e.target.value }))}
                  onBlur={() => void saveColor('primary_color', colorDraft.primary)}
                  dir="ltr"
                  className="min-w-0 flex-1"
                />
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-text-secondary">اللون الثانوي</label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={colorDraft.secondary}
                  onChange={(e) => setColorDraft((c) => ({ ...c, secondary: e.target.value }))}
                  onBlur={() => void saveColor('secondary_color', colorDraft.secondary)}
                  className="h-[54px] w-[54px] shrink-0 cursor-pointer rounded-input border border-border-default"
                />
                <Input
                  value={colorDraft.secondary}
                  onChange={(e) => setColorDraft((c) => ({ ...c, secondary: e.target.value }))}
                  onBlur={() => void saveColor('secondary_color', colorDraft.secondary)}
                  dir="ltr"
                  className="min-w-0 flex-1"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex flex-col gap-1">
            <label className="text-xs text-text-secondary">الخط</label>
            <Select value={website.font_family} onChange={(e) => void saveFont(e.target.value)}>
              {SUPPORTED_WEBSITE_FONTS.map((font) => (
                <option key={font} value={font}>
                  {font}
                </option>
              ))}
            </Select>
          </div>
        </Card>

        <Card className="flex flex-col gap-6 p-8">
          <AssetUploader
            label="الشعار"
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
          <AssetUploader
            label="صورة البانر (قسم الغلاف الرئيسي)"
            currentUrl={website.banner_image_url}
            onUpload={async (file) => {
              const { website: updated } = await uploadBanner(accessToken, file);
              setWebsite((current) => (current ? { ...current, ...updated } : current));
            }}
            onRemove={async () => {
              const { website: updated } = await updateWebsite(accessToken, { banner_image_url: null });
              setWebsite((current) => (current ? { ...current, ...updated } : current));
            }}
          />
        </Card>

        <Card className="p-8">
          <h2 className="mb-1 text-base font-semibold text-text-primary">أقسام الصفحة</h2>
          <p className="mb-4 text-sm text-text-secondary">اسحب لإعادة الترتيب، وفعّل/عطّل أي قسم</p>
          <SectionList
            sections={website.website_sections}
            accessToken={accessToken}
            onChange={(sections) => setWebsite((current) => (current ? { ...current, website_sections: sections } : current))}
          />
        </Card>

        <DomainSection accessToken={accessToken} ownerOnly={me.user.role === 'owner'} />
      </div>
    </AppShell>
  );
}
