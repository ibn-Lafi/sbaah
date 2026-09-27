'use client';

import { Suspense, useEffect, useState } from 'react';
import type { AccountType } from '@sbaah/shared';
import { organizationInfoUpdateSchema, socialLinksUpdateSchema } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { Skeleton } from '@/components/ui/skeleton';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { BillingPanel } from '@/components/billing/billing-panel';
import { WebsiteBrandingCard } from '@/components/website/website-branding-card';
import { LanguageThemeSwitchCard } from '@/components/layout/language-theme-switch-card';
import {
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
  SnapchatIcon,
  FacebookIcon,
  TelegramIcon,
  XIcon,
  LocationIcon,
} from '@/components/website/editor-icons';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getSocialLinks, updateSocialLinks, getInquiryContact, updateInquiryContact, updateAccountType, type SocialLinks, type InquiryContact } from '@/lib/api/tenant';
import { getWebsite, updateWebsite } from '@/lib/api/website';
import { sendProfileChangeOtp, updateMyProfile, verifyProfileChange } from '@/lib/api/auth';
import { signOut } from '@/lib/auth/session';
import { ApiRequestError } from '@/lib/api/client';

type SettingsTab = 'account' | 'organization' | 'contact' | 'brand' | 'team' | 'billing';

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-3 last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary" dir={/^[+0-9]/.test(value) ? 'ltr' : undefined}>
        {value}
      </span>
    </div>
  );
}

/**
 * نوع الحساب — قابل للتبديل بأي اتجاه (فرد↔مؤسسة↔شركة) من داخل تبويب
 * "بيانات الموقع" بالإعدادات، Owner فقط (assertOwner بنفس تقييد الدومين).
 * هذه الخطوة تختار النوع فقط، بلا أي حقل آخر معها — اسم الموقع والسجل
 * التجاري والرقم الضريبي يُعدَّلان بعدها من بطاقة "بيانات الجهة" الخاصة
 * (OrganizationInfoCard)، بجانب رخصة فال. يعيد تحميل الصفحة بعد الحفظ
 * لتحديث شارة النوع المعروضة في AppShell وظهور/اختفاء بطاقة "بيانات
 * الجهة" بلا حاجة لآلية refresh مخصصة لـ me (نفس نمط صفحة الدومين).
 */
const ACCOUNT_TYPES: AccountType[] = ['individual', 'institution', 'company'];

function AccountTypeCard({ accessToken, initial, canEdit }: { accessToken: string; initial: AccountType; canEdit: boolean }) {
  const { pages } = useLocale();
  const t = pages.settings;
  const [editing, setEditing] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function cancel() {
    setEditing(false);
    setError(null);
    setAccountType(initial);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await updateAccountType(accessToken, { account_type: accountType });
      window.location.reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.accountType.switchFailed);
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="p-4 sm:p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h2 className="mb-1 text-base font-semibold text-text-primary">{t.accountType.title}</h2>
            <p className="text-sm text-text-secondary">{t.accountType.options[initial].label}</p>
          </div>
          {canEdit && (
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              {t.accountType.switchButton}
            </Button>
          )}
        </div>
      </Card>

      {editing && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" onClick={cancel}>
          <div role="dialog" aria-modal="true" className="bg-surface-card w-full max-w-md rounded-[28px] p-5 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="mb-1 text-lg font-bold text-text-primary">{t.accountType.editTitle}</h2>
                <p className="text-sm text-text-secondary">{t.accountType.editDescription}</p>
              </div>
              <button type="button" onClick={cancel} aria-label={t.common.cancel} className="bg-surface-subtle text-text-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl">×</button>
            </div>
            <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-2.5">
              <div className="flex flex-col gap-2.5">
                {ACCOUNT_TYPES.map((type) => {
                  const { label, description } = t.accountType.options[type];
                  const selected = accountType === type;
                  return (
                    <button key={type} type="button" onClick={() => setAccountType(type)} className={`rounded-input flex items-center gap-4 border p-4 text-start transition-colors ${selected ? 'border-brand ring-brand ring-1' : 'border-border-default hover:border-text-placeholder'}`}>
                      <VerifiedBadge accountType={type} size={36} />
                      <div className="flex flex-1 flex-col gap-0.5">
                        <span className="text-sm font-semibold text-text-primary">{label}</span>
                        <span className="text-xs text-text-secondary">{description}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
              <FormError message={error} />
              <div className="flex gap-2">
                <Button type="submit" disabled={loading}>{loading ? t.common.saving : t.common.save}</Button>
                <Button type="button" variant="secondary" onClick={cancel} disabled={loading}>{t.common.cancel}</Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

/**
 * بيانات الجهة — اسم الموقع + السجل التجاري + الرقم الضريبي، ورخصة فال
 * بداخل نفس البطاقة (FalLicenseFields، لا بطاقتها المنفصلة) — لحسابات
 * مؤسسة/شركة القائمة بالفعل فقط (تُخفى تمامًا لحساب فرد، حيث تبقى رخصة
 * فال ببطاقتها المستقلة FalLicenseCard). "اسم الموقع" هنا هو نفس حقل
 * tenant.name_ar المعروض سابقًا ببطاقة "بيانات الحساب" (أُزيلت — لا فائدة
 * منها بوجود هذا الحقل هنا).
 */
function OrganizationInfoCard({
  accessToken,
  accountType,
  initial,
  canEdit,
}: {
  accessToken: string;
  accountType: AccountType;
  initial: {
    name_ar: string;
    cr_number: string | null;
    tax_number: string | null;
    fal_license_number: string | null;
    freelance_document_number: string | null;
    wafi_license_number: string | null;
  };
  canEdit: boolean;
}) {
  const { pages, locale } = useLocale();
  const t = pages.settings;
  type OptionalOrganizationField = 'cr_number' | 'tax_number' | 'fal_license_number' | 'freelance_document_number' | 'wafi_license_number';
  const [nameAr, setNameAr] = useState(initial.name_ar);
  const [values, setValues] = useState<Record<OptionalOrganizationField, string>>({
    cr_number: initial.cr_number ?? '',
    tax_number: initial.tax_number ?? '',
    fal_license_number: initial.fal_license_number ?? '',
    freelance_document_number: initial.freelance_document_number ?? '',
    wafi_license_number: initial.wafi_license_number ?? '',
  });
  const availableFields: { key: OptionalOrganizationField; label: string; placeholder: string; image: string }[] =
    accountType === 'individual'
      ? [
          { key: 'fal_license_number', label: t.falLicense.title, placeholder: t.falLicense.placeholder, image: '/business-badges/fal-license-card.png' },
          { key: 'freelance_document_number', label: t.organizationInfo.freelanceDocumentLabel, placeholder: t.organizationInfo.freelanceDocumentPlaceholder, image: '/business-badges/freelance-certificate-card.png' },
        ]
      : [
          { key: 'cr_number', label: t.organizationInfo.crNumberLabel, placeholder: t.organizationInfo.crNumberPlaceholder, image: '/business-badges/commercial-registration-card.png' },
          { key: 'tax_number', label: t.organizationInfo.taxNumberLabel, placeholder: t.organizationInfo.taxNumberPlaceholder, image: '/business-badges/tax-number-card.png' },
          { key: 'fal_license_number', label: t.falLicense.title, placeholder: t.falLicense.placeholder, image: '/business-badges/fal-license-card.png' },
          { key: 'wafi_license_number', label: t.organizationInfo.wafiLicenseLabel, placeholder: t.organizationInfo.wafiLicensePlaceholder, image: '/business-badges/wafi-license-card.png' },
        ];
  const [activeFields, setActiveFields] = useState<OptionalOrganizationField[]>(
    () => availableFields.filter(({ key }) => Boolean(values[key])).map(({ key }) => key)
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  function addField(key: OptionalOrganizationField) {
    setActiveFields((current) => current.includes(key) ? current : [...current, key]);
    setPickerOpen(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const active = new Set(activeFields);
    const payload = accountType === 'individual'
      ? {
          account_type: 'individual' as const,
          name_ar: nameAr,
          fal_license_number: active.has('fal_license_number') ? values.fal_license_number : null,
          freelance_document_number: active.has('freelance_document_number') ? values.freelance_document_number : null,
        }
      : {
          account_type: accountType,
          name_ar: nameAr,
          cr_number: active.has('cr_number') ? values.cr_number : null,
          tax_number: active.has('tax_number') ? values.tax_number : null,
          fal_license_number: active.has('fal_license_number') ? values.fal_license_number : null,
          wafi_license_number: active.has('wafi_license_number') ? values.wafi_license_number : null,
        };

    const result = organizationInfoUpdateSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.common.invalidData);
      return;
    }
    setLoading(true);
    try {
      await updateAccountType(accessToken, result.data);
      setActiveFields(availableFields.filter(({ key }) => Boolean(values[key].trim())).map(({ key }) => key));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.organizationInfo.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  const namePlaceholder =
    accountType === 'individual'
      ? t.organizationInfo.individualNamePlaceholder
      : accountType === 'institution'
        ? t.organizationInfo.institutionNamePlaceholder
        : t.organizationInfo.companyNamePlaceholder;

  return (
    <>
      <Card className="p-4 sm:p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-text-primary">{t.organizationInfo.title}</h2>
          {canEdit && (
            <button type="button" onClick={() => setPickerOpen(true)} aria-label={locale === 'ar' ? 'إضافة حقل' : 'Add field'} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-card text-lg font-medium text-brand transition-colors hover:bg-surface-subtle">+</button>
          )}
        </div>
        <p className="mb-4 text-sm text-text-secondary">{t.organizationInfo.description}</p>
        {canEdit ? (
          <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-2.5">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-text-primary">{t.organizationInfo.websiteNameLabel}</label>
              <Input compact placeholder={namePlaceholder} value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
            </div>
            {availableFields.filter(({ key }) => activeFields.includes(key)).map(({ key, label, placeholder }) => (
              <div key={key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-medium text-text-primary">{label}</label>
                </div>
                <Input compact value={values[key]} onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} dir="ltr" />
              </div>
            ))}
            <FormError message={error} />
            <Button type="submit" disabled={loading} className="h-9 min-w-20 w-fit px-3 text-xs">
              {loading ? t.common.saving : saved ? t.common.saved : t.common.save}
            </Button>
          </form>
        ) : (
          <>
            <InfoRow label={t.organizationInfo.websiteNameLabel} value={initial.name_ar} />
            {availableFields.filter(({ key }) => Boolean(initial[key])).map(({ key, label }) => (
              <InfoRow key={key} label={label} value={initial[key] ?? '—'} />
            ))}
          </>
        )}
      </Card>

      {pickerOpen && canEdit && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]" onClick={() => setPickerOpen(false)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-[28px] bg-surface-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold text-text-primary">{locale === 'ar' ? 'إضافة حقل' : 'Add field'}</h3>
                <p className="mt-1 text-sm text-text-secondary">{locale === 'ar' ? 'اختر البيانات التي تريد إضافتها.' : 'Choose the information you want to add.'}</p>
              </div>
              <button type="button" onClick={() => setPickerOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle text-xl text-text-secondary">×</button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {availableFields.map(({ key, label, image }) => {
                const active = activeFields.includes(key);
                return (
                  <button key={key} type="button" disabled={active} onClick={() => addField(key)} className="group flex min-h-28 items-center justify-center rounded-2xl border border-border-default bg-surface-page p-3 transition-colors hover:border-brand disabled:opacity-35" aria-label={label} title={label}>
                    <img src={image} alt={label} className="h-auto w-full max-w-[160px] rounded-lg object-contain transition-transform group-hover:scale-[1.02]" />
                    </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

/** حسابات التواصل الاجتماعي — تُعرض تلقائيًا (فقط ما تمت تعبئته) في تذييل الموقع العام (site/editor's أسفل الصفحة). */
function SocialLinksCard({ accessToken, initial }: { accessToken: string; initial: SocialLinks }) {
  const { pages, locale } = useLocale();
  const t = pages.settings;
  const [draft, setDraft] = useState<SocialLinks>(initial);
  const [activeFields, setActiveFields] = useState<(keyof SocialLinks)[]>(
    () => (Object.keys(initial) as (keyof SocialLinks)[]).filter((key) => Boolean(initial[key]))
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const fields: { key: keyof SocialLinks; label: string; placeholder: string; Icon: typeof InstagramIcon; phone?: boolean }[] = [
    { key: 'social_whatsapp', label: t.socialLinks.whatsapp, placeholder: t.socialLinks.phonePlaceholder, Icon: WhatsappIcon, phone: true },
    { key: 'social_instagram', label: t.socialLinks.instagram, placeholder: t.socialLinks.instagramPlaceholder, Icon: InstagramIcon },
    { key: 'social_tiktok', label: t.socialLinks.tiktok, placeholder: t.socialLinks.tiktokPlaceholder, Icon: TiktokIcon },
    { key: 'social_snapchat', label: t.socialLinks.snapchat, placeholder: t.socialLinks.snapchatPlaceholder, Icon: SnapchatIcon },
    { key: 'social_facebook', label: locale === 'ar' ? 'فيسبوك' : 'Facebook', placeholder: 'https://facebook.com/...', Icon: FacebookIcon },
    { key: 'social_x', label: locale === 'ar' ? 'إكس' : 'X', placeholder: 'https://x.com/...', Icon: XIcon },
    { key: 'social_telegram', label: locale === 'ar' ? 'تليجرام' : 'Telegram', placeholder: 'https://t.me/...', Icon: TelegramIcon },
  ];

  function addField(key: keyof SocialLinks) {
    setActiveFields((current) => current.includes(key) ? current : [...current, key]);
    setPickerOpen(false);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const result = socialLinksUpdateSchema.safeParse(draft);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.common.invalidData);
      return;
    }
    setLoading(true);
    try {
      const updated = await updateSocialLinks(accessToken, result.data);
      setDraft(updated);
      setActiveFields((Object.keys(updated) as (keyof SocialLinks)[]).filter((key) => Boolean(updated[key])));
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.socialLinks.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Card className="p-4 sm:p-5">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-text-primary">{t.socialLinks.title}</h2>
          <button type="button" onClick={() => setPickerOpen(true)} aria-label={`+ ${t.socialLinks.title}`} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-card text-lg font-medium text-brand transition-colors hover:bg-surface-subtle">+</button>
        </div>
        <p className="mb-4 text-sm text-text-secondary">{t.socialLinks.description}</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-2.5">
          {fields.filter(({ key }) => activeFields.includes(key)).map(({ key, label, placeholder, Icon, phone }) => (
            <div key={key} className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-3">
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Icon className="h-[18px] w-[18px] text-text-secondary" />
                {label}
              </label>
</div>
              {phone ? (
                <PhoneInput className="!h-[46px] px-3 text-sm" storagePrefix="966" placeholder={placeholder} value={draft[key] ?? ''} onChange={(value) => setDraft((current) => ({ ...current, [key]: value }))} />
              ) : (
                <Input compact value={draft[key] ?? ''} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} dir="ltr" />
              )}
            </div>
          ))}
          {activeFields.length === 0 && <p className="rounded-2xl border border-dashed border-border-default px-4 py-5 text-center text-sm text-text-secondary">{t.socialLinks.description}</p>}
          <FormError message={error} />
          {activeFields.length > 0 && <Button type="submit" disabled={loading} className="h-9 min-w-20 w-fit px-3 text-xs">{loading ? t.common.saving : saved ? t.common.saved : t.common.save}</Button>}
        </form>
      </Card>

      {pickerOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/35 p-4 backdrop-blur-[2px]" onClick={() => setPickerOpen(false)}>
          <div role="dialog" aria-modal="true" className="w-full max-w-md rounded-[28px] bg-surface-card p-5 shadow-2xl" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-center justify-between">
              <h3 className="text-lg font-bold text-text-primary">{t.socialLinks.title}</h3>
              <button type="button" onClick={() => setPickerOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-subtle text-xl text-text-secondary">×</button>
            </div>
            <div className="grid grid-cols-3 gap-3">
              {fields.map(({ key, label, Icon }) => {
                const active = activeFields.includes(key);
                return (
                  <button key={key} type="button" disabled={active} onClick={() => addField(key)} className="flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border border-border-default bg-surface-page p-3 text-center transition-colors hover:border-brand hover:text-brand disabled:opacity-35">
                    <Icon className="h-7 w-7" />
                    <span className="text-xs font-semibold">{label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
/**
 * حقل نصي على `websites` (العنوان/وصف الموقع) — نفس الشكل والسلوك لكلا
 * الحقلين (يظهران دائمًا في تذييل الموقع العام)، فقط يختلف الحقل المستهدَف
 * والنصوص المعروضة؛ مكوّن واحد بدل تكرار نفس منطق الجلب/الحفظ مرتين.
 */
function WebsiteTextFieldCard({
  accessToken,
  field,
  icon,
  title,
  description,
  placeholder,
  saveFailedMessage,
}: {
  accessToken: string;
  field: 'address' | 'footer_description';
  icon: React.ReactNode;
  title: string;
  description: string;
  placeholder: string;
  saveFailedMessage: string;
}) {
  const { pages } = useLocale();
  const t = pages.settings.common;
  const [value, setValue] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    void getWebsite(accessToken).then(({ website }) => {
      setValue(website[field] ?? '');
      setDraft(website[field] ?? '');
    });
  }, [accessToken, field]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      const { website: updated } = await updateWebsite(accessToken, { [field]: draft || null });
      setValue(updated[field] ?? '');
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : saveFailedMessage);
    } finally {
      setLoading(false);
    }
  }

  if (value === null) {
    return null;
  }

  return (
    <Card className="p-4 sm:p-5">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-text-primary">
        {icon}
        {title}
      </h2>
      <p className="mb-4 text-sm text-text-secondary">{description}</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-2.5">
        <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} className="min-h-[80px]" />
        <FormError message={error} />
        <Button type="submit" disabled={loading} className="w-fit">
          {loading ? t.saving : saved ? t.saved : t.save}
        </Button>
      </form>
    </Card>
  );
}

/**
 * البريد الإلكتروني — اختياري، ويُستخدم في: تسجيل الدخول برمز تحقق عبر
 * البريد، إشعار إضافتك كموظف، رمز تحقق عند تغيير كلمة المرور، وإشعارات
 * أخرى يحتاجها حسابك (مثل تعيين عميل محتمل لك). يمكن تركه فارغًا.
 */
/**
 * رخصة فال — منفصلة عن "نوع الحساب" لأنها لا تتغيّر بتبديله (migration
 * 0047: لم تعد تُطلب أثناء التسجيل، تُدخل هنا أول مرة أو تُعدَّل لاحقًا).
 * غيابها لا يعطّل شيئًا في الحساب — يمنع فقط نشر الموقع العام، فتُعرض
 * هذه الرسالة عند فراغها لتوضيح السبب. بلا `<Card>` خاص بها — تُستخدم إما
 * وحدها (FalLicenseCard، حساب فرد) أو مدمجة داخل بطاقة "بيانات الجهة"
 * (OrganizationInfoCard، حساب مؤسسة/شركة).
 */
function AccountTab({ accessToken }: { accessToken: string }) {
  const { me } = useCurrentUser(); const { pages } = useLocale(); const settings=pages.settings;
  const [name,setName]=useState(me.user.full_name); const [phone,setPhone]=useState(me.user.phone); const [email,setEmail]=useState(me.user.email??'');
  const [verify,setVerify]=useState<null|{kind:'phone'|'email';target:string;code:string}>(null); const [error,setError]=useState<string|null>(null); const [saved,setSaved]=useState(false);
  async function saveBasic(){setError(null);try{await updateMyProfile(accessToken,{full_name:name});setSaved(true);window.location.reload()}catch(e){setError(e instanceof ApiRequestError?e.message:'تعذر حفظ البيانات')}}
  async function requestChange(kind:'phone'|'email'){setError(null);const target=kind==='phone'?phone:email.trim();if(!target)return;try{await sendProfileChangeOtp(accessToken,kind==='phone'?{phone:target}:{email:target});setVerify({kind,target,code:''})}catch(e){setError(e instanceof ApiRequestError?e.message:'تعذر إرسال رمز التحقق')}}
  async function confirm(){if(!verify)return;try{await verifyProfileChange(accessToken,verify.kind==='phone'?{phone:verify.target,code:verify.code}:{email:verify.target,code:verify.code});setVerify(null);window.location.reload()}catch(e){setError(e instanceof ApiRequestError?e.message:'رمز التحقق غير صحيح')}}
  return <><Card className="p-4 sm:p-5"><h2 className="mb-4 text-base font-semibold text-text-primary">{settings.accountInfo.title}</h2><div className="flex flex-col gap-2.5"><div><label className="mb-2 block text-sm font-medium text-text-primary">الاسم</label><Input compact value={name} onChange={e=>setName(e.target.value)}/></div><div><label className="mb-2 block text-sm font-medium text-text-primary">رقم الجوال</label><div className="flex gap-2"><PhoneInput className="!h-[46px] px-3 text-sm" storagePrefix="966" value={phone} onChange={setPhone}/><Button type="button" variant="secondary" onClick={()=>void requestChange('phone')} disabled={phone===me.user.phone} className="!h-[46px] min-w-16 px-3 text-xs">تغيير</Button></div><p className="mt-1 text-xs text-text-placeholder">عند التغيير سنرسل رمز OTP إلى الرقم الجديد للتأكد منه.</p></div><div><label className="mb-2 block text-sm font-medium text-text-primary">البريد الإلكتروني</label><div className="flex gap-2"><Input compact type="email" dir="ltr" value={email} onChange={e=>setEmail(e.target.value)}/><Button type="button" variant="secondary" onClick={()=>void requestChange('email')} disabled={email.trim()===(me.user.email??'')}>تغيير</Button></div><p className="mt-1 text-xs text-text-placeholder">عند التغيير سنرسل رمز OTP إلى البريد الجديد للتأكد منه.</p></div><FormError message={error}/><Button type="button" onClick={()=>void saveBasic()} className="h-9 min-w-20 w-fit px-3 text-xs">{saved?'تم الحفظ':'حفظ'}</Button></div></Card><LanguageThemeSwitchCard/><Card className="p-4 sm:p-5"><button type="button" onClick={()=>void signOut().then(()=>window.location.replace('/login'))} className="text-sm font-semibold text-danger hover:underline">{settings.signOut}</button></Card>{verify&&<div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"><Card className="w-full max-w-sm p-6"><h3 className="text-lg font-bold text-text-primary">تأكيد {verify.kind==='phone'?'رقم الجوال':'البريد الإلكتروني'}</h3><p className="mb-4 mt-1 text-sm text-text-secondary">أدخل رمز التحقق المرسل إلى <span dir="ltr">{verify.target}</span></p><Input inputMode="numeric" maxLength={4} dir="ltr" value={verify.code} onChange={e=>setVerify({...verify,code:e.target.value.replace(/\D/g,'').slice(0,4)})} placeholder="0000"/><FormError message={error}/><div className="mt-4 flex gap-2"><Button type="button" onClick={()=>void confirm()} disabled={verify.code.length!==4}>تأكيد التغيير</Button><Button type="button" variant="secondary" onClick={()=>setVerify(null)}>إلغاء</Button></div></Card></div>}</>;
}

function OrganizationTab({ accessToken }: { accessToken: string }) {
  const { me } = useCurrentUser();
  const canEdit = me.user.role === 'owner';
  return (
    <>
      <AccountTypeCard accessToken={accessToken} canEdit={canEdit} initial={me.tenant.account_type} />
      <OrganizationInfoCard
        accessToken={accessToken}
        canEdit={canEdit}
        accountType={me.tenant.account_type}
        initial={{
          name_ar: me.tenant.name_ar,
          cr_number: me.tenant.cr_number,
          tax_number: me.tenant.tax_number,
          fal_license_number: me.tenant.fal_license_number,
          freelance_document_number: me.tenant.freelance_document_number,
          wafi_license_number: me.tenant.wafi_license_number,
        }}
      />
    </>
  );
}

function InquiryContactCard({ accessToken }: { accessToken: string }) {
  const { locale } = useLocale();
  const [draft, setDraft] = useState<InquiryContact | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  useEffect(() => { void getInquiryContact(accessToken).then(setDraft).catch((e) => setError(e instanceof ApiRequestError ? e.message : 'تعذر تحميل بيانات الاستفسار')); }, [accessToken]);
  if (!draft) return null;
  async function save(event: React.FormEvent) {
    event.preventDefault();
    if (!draft) return;
    setError(null); setSaved(false); setLoading(true);
    try { setDraft(await updateInquiryContact(accessToken, { inquiry_email: draft.inquiry_email?.trim() || null, inquiry_phone: draft.inquiry_phone?.trim() || null })); setSaved(true); }
    catch (e) { setError(e instanceof ApiRequestError ? e.message : 'تعذر حفظ بيانات الاستفسار'); }
    finally { setLoading(false); }
  }
  return <Card className="p-4 sm:p-5">
    <h2 className="mb-1 text-base font-semibold text-text-primary">{locale === 'ar' ? 'بيانات الاستفسار' : 'Inquiry contact'}</h2>
    <p className="mb-4 text-sm text-text-secondary">{locale === 'ar' ? 'هذه البيانات فقط تظهر في الفوتر تحت تواصل معنا.' : 'Only these details appear under Contact us in the footer.'}</p>
    <form onSubmit={(e)=>void save(e)} className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-2"><label className="text-sm font-medium text-text-primary">{locale === 'ar' ? 'البريد الإلكتروني' : 'Email'}</label><Input compact type="email" dir="ltr" value={draft.inquiry_email ?? ''} onChange={(e)=>setDraft({...draft,inquiry_email:e.target.value})} placeholder="info@example.com" /></div>
      <div className="flex flex-col gap-2"><label className="text-sm font-medium text-text-primary">{locale === 'ar' ? 'الرقم' : 'Number'}</label><Input compact dir="ltr" value={draft.inquiry_phone ?? ''} onChange={(e)=>setDraft({...draft,inquiry_phone:e.target.value})} placeholder={locale === 'ar' ? 'هاتف أو جوال' : 'Phone or mobile'} /></div>
      <FormError message={error}/><Button type="submit" disabled={loading} className="h-9 min-w-20 w-fit px-3 text-xs">{loading ? (locale === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : saved ? (locale === 'ar' ? 'تم الحفظ' : 'Saved') : (locale === 'ar' ? 'حفظ' : 'Save')}</Button>
    </form>
  </Card>;
}

function ContactTab({ accessToken }: { accessToken: string }) {
  const { pages } = useLocale();
  const settings = pages.settings;
  const [socialLinks, setSocialLinks] = useState<SocialLinks | null>(null);
  const [socialLinksError, setSocialLinksError] = useState<string | null>(null);

  // /auth/me carries only part of the contact links; this endpoint has all of them.
  useEffect(() => {
    let cancelled = false;
    getSocialLinks(accessToken)
      .then((links) => {
        if (!cancelled) setSocialLinks(links);
      })
      .catch((err) => {
        if (!cancelled) setSocialLinksError(err instanceof ApiRequestError ? err.message : settings.socialLinks.loadFailed);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, settings.socialLinks.loadFailed]);

  return <>{socialLinks ? <SocialLinksCard accessToken={accessToken} initial={socialLinks} /> : <Card className="p-4 sm:p-5">{socialLinksError ? <FormError message={socialLinksError} /> : <div className="flex flex-col gap-2.5" aria-busy="true"><Skeleton className="h-5 w-40" /><Skeleton className="h-11 w-full" /><Skeleton className="h-11 w-full" /></div>}</Card>}<InquiryContactCard accessToken={accessToken} /><WebsiteTextFieldCard accessToken={accessToken} field="address" icon={<LocationIcon className="h-[18px] w-[18px] text-text-secondary" />} title={settings.address.title} description={settings.address.description} placeholder={settings.address.placeholder} saveFailedMessage={settings.address.saveFailed} /></>;
}

function BrandTab({ accessToken }: { accessToken: string }) {
  return <WebsiteBrandingCard accessToken={accessToken} />;
}

/** حسابي (من الشريط السفلي بعرض الجوال، وقائمة الحساب المنسدلة بالشريط الجانبي على سطح المكتب) — شريط تبويب موحّد (بنفس شكل الدومين المخصص/الفرعي بصفحة الدومين) يجمع الحساب الشخصي، إدارة الموظفين، الفوترة والاشتراك، وبيانات الموقع في صفحة واحدة بدل ثلاث صفحات منفصلة. /team و/billing يبقيان يعملان (نفس المكوّنات بالضبط). */
export default function SettingsPage() {
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const settings = pages.settings;
  const canSeeTeam = me.user.role === 'owner' || me.user.role === 'admin';
  const canSeeBilling = me.user.role === 'owner';
  const canSeeOrganization = me.user.role === 'owner' || me.user.role === 'admin';
  const { locale } = useLocale();

  const tabOptions = [
    { value: 'account' as const, label: locale === 'ar' ? 'الحساب' : 'Account' },
    ...(canSeeOrganization ? [{ value: 'organization' as const, label: locale === 'ar' ? (me.tenant.account_type === 'individual' ? 'بيانات الفرد' : 'بيانات المنشأة') : (me.tenant.account_type === 'individual' ? 'Individual Information' : 'Organization Information') }] : []),
    ...(canSeeOrganization ? [{ value: 'contact' as const, label: locale === 'ar' ? 'معلومات التواصل' : 'Contact Information' }] : []),
    ...(canSeeOrganization ? [{ value: 'brand' as const, label: locale === 'ar' ? 'الهوية التجارية' : 'Brand Identity' }] : []),
    ...(canSeeTeam ? [{ value: 'team' as const, label: locale === 'ar' ? 'الفريق والصلاحيات' : 'Team & Permissions' }] : []),
    ...(canSeeBilling ? [{ value: 'billing' as const, label: settings.tabs.billing }] : []),
  ];
  const [tab, setTab] = useState<SettingsTab>('account');

  // Deep links such as /settings?tab=contact (dashboard setup checklist).
  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab');
    const available = tabOptions.find((option) => option.value === requested);
    if (available) setTab(available.value);
    // tabOptions is derived from the signed-in role and only needs reading once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell title={settings.pageTitle} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      <div className="flex w-full flex-col gap-5">
        {tabOptions.length > 1 && <SegmentedToggle value={tab} onChange={setTab} options={tabOptions} className="settings-tabs" />}

        {tab === 'account' && <AccountTab accessToken={accessToken} />}
        {tab === 'team' && (canSeeTeam ? <div aria-label={locale === 'ar' ? 'الفريق والصلاحيات' : 'Team & Permissions'} /> : null)}
        {tab === 'billing' &&
          (canSeeBilling ? (
            <Suspense fallback={null}>
              <BillingPanel />
            </Suspense>
          ) : null)}
        {tab === 'organization' && (canSeeOrganization ? <OrganizationTab accessToken={accessToken} /> : null)}
        {tab === 'contact' && (canSeeOrganization ? <ContactTab accessToken={accessToken} /> : null)}
        {tab === 'brand' && (canSeeOrganization ? <BrandTab accessToken={accessToken} /> : null)}
      </div>
    </AppShell>
  );
}
