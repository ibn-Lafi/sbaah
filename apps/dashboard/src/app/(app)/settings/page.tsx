'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { AccountType } from '@sbaah/shared';
import { organizationInfoUpdateSchema, falLicenseUpdateSchema, socialLinksUpdateSchema } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { TeamManagementPanel } from '@/components/team/team-management-panel';
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
  CallIcon,
  LocationIcon,
  MailIcon,
} from '@/components/website/editor-icons';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { updateSocialLinks, updateAccountType, updateFalLicense, type SocialLinks } from '@/lib/api/tenant';
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
      <Card className="p-6">
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
            <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
              <div className="flex flex-col gap-3">
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
  falLicense,
  canEdit,
}: {
  accessToken: string;
  accountType: 'institution' | 'company';
  initial: { name_ar: string; cr_number: string | null; tax_number: string | null };
  falLicense: string | null;
  canEdit: boolean;
}) {
  const { pages } = useLocale();
  const t = pages.settings;
  const [nameAr, setNameAr] = useState(initial.name_ar);
  const [crNumber, setCrNumber] = useState(initial.cr_number ?? '');
  const [taxNumber, setTaxNumber] = useState(initial.tax_number ?? '');
  const [fal, setFal] = useState(falLicense ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const result = organizationInfoUpdateSchema.safeParse({
      account_type: accountType,
      name_ar: nameAr,
      cr_number: crNumber,
      tax_number: taxNumber,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.common.invalidData);
      return;
    }

    const falResult = falLicenseUpdateSchema.safeParse({ fal_license_number: fal });
    if (!falResult.success) { setError(falResult.error.issues[0]?.message ?? t.falLicense.invalidNumber); return; }
    setLoading(true);
    try {
      await Promise.all([updateAccountType(accessToken, result.data), updateFalLicense(accessToken, falResult.data)]);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.organizationInfo.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-base font-semibold text-text-primary">{t.organizationInfo.title}</h2>
      <p className="mb-4 text-sm text-text-secondary">{t.organizationInfo.description}</p>
      {canEdit ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <Input
            placeholder={
              accountType === 'institution'
                ? t.organizationInfo.institutionNamePlaceholder
                : t.organizationInfo.companyNamePlaceholder
            }
            value={nameAr}
            onChange={(e) => setNameAr(e.target.value)}
          />
          <Input
            placeholder={t.organizationInfo.crNumberPlaceholder}
            value={crNumber}
            onChange={(e) => setCrNumber(e.target.value)}
            dir="ltr"
          />
          <Input
            placeholder={t.organizationInfo.taxNumberPlaceholder}
            value={taxNumber}
            onChange={(e) => setTaxNumber(e.target.value)}
            dir="ltr"
          />
          <div className="my-2 h-px bg-border-subtle" />
          <h3 className="text-base font-semibold text-text-primary">التراخيص</h3>
          <Input value={fal} onChange={(e) => setFal(e.target.value)} placeholder={t.falLicense.placeholder} dir="ltr" />
          <FormError message={error} />
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? t.common.saving : saved ? t.common.saved : t.common.save}
          </Button>
        </form>
      ) : (
        <>
          <InfoRow label={t.organizationInfo.websiteNameLabel} value={initial.name_ar} />
          <InfoRow label={t.organizationInfo.crNumberLabel} value={initial.cr_number ?? '—'} />
          <InfoRow label={t.organizationInfo.taxNumberLabel} value={initial.tax_number ?? '—'} />
        </>
      )}
    </Card>
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
    { key: 'social_phone', label: t.socialLinks.call, placeholder: t.socialLinks.phonePlaceholder, Icon: CallIcon, phone: true },
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
      <Card className="p-6">
        <div className="mb-1 flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-text-primary">{t.socialLinks.title}</h2>
          <button type="button" onClick={() => setPickerOpen(true)} aria-label={`+ ${t.socialLinks.title}`} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-default bg-surface-card text-xl font-medium text-brand transition-colors hover:bg-surface-subtle">+</button>
        </div>
        <p className="mb-4 text-sm text-text-secondary">{t.socialLinks.description}</p>
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          {fields.filter(({ key }) => activeFields.includes(key)).map(({ key, label, placeholder, Icon, phone }) => (
            <div key={key} className="flex flex-col gap-2">
              <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
                <Icon className="h-[18px] w-[18px] text-text-secondary" />
                {label}
              </label>
              {phone ? (
                <PhoneInput storagePrefix="966" placeholder={placeholder} value={draft[key] ?? ''} onChange={(value) => setDraft((current) => ({ ...current, [key]: value }))} />
              ) : (
                <Input value={draft[key] ?? ''} onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))} placeholder={placeholder} dir="ltr" />
              )}
            </div>
          ))}
          {activeFields.length === 0 && <p className="rounded-2xl border border-dashed border-border-default px-4 py-5 text-center text-sm text-text-secondary">{t.socialLinks.description}</p>}
          <FormError message={error} />
          {activeFields.length > 0 && <Button type="submit" disabled={loading} className="w-fit">{loading ? t.common.saving : saved ? t.common.saved : t.common.save}</Button>}
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
    <Card className="p-6">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-text-primary">
        {icon}
        {title}
      </h2>
      <p className="mb-4 text-sm text-text-secondary">{description}</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
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
function FalLicenseFields({ accessToken, initial, canEdit }: { accessToken: string; initial: string | null; canEdit: boolean }) {
  const { pages } = useLocale();
  const t = pages.settings;
  const [draft, setDraft] = useState(initial ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);

    const result = falLicenseUpdateSchema.safeParse({ fal_license_number: draft });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.falLicense.invalidNumber);
      return;
    }

    setLoading(true);
    try {
      await updateFalLicense(accessToken, result.data);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.falLicense.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <h2 className="mb-1 text-base font-semibold text-text-primary">{t.falLicense.title}</h2>
      <p className="mb-4 text-sm text-text-secondary">
        {initial ? t.falLicense.descriptionSet : t.falLicense.descriptionUnset}
      </p>
      {canEdit ? (
        <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
          <Input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder={t.falLicense.placeholder}
            dir="ltr"
          />
          <FormError message={error} />
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? t.common.saving : saved ? t.common.saved : t.common.save}
          </Button>
        </form>
      ) : (
        <p className="text-sm font-medium text-text-primary" dir="ltr">
          {initial ?? '—'}
        </p>
      )}
    </>
  );
}

/** رخصة فال بطاقتها الخاصة — لحساب فرد فقط (مؤسسة/شركة تعرضها مدمجة داخل OrganizationInfoCard). */
function FalLicenseCard({ accessToken, initial, canEdit }: { accessToken: string; initial: string | null; canEdit: boolean }) {
  return (
    <Card className="p-6">
      <FalLicenseFields accessToken={accessToken} initial={initial} canEdit={canEdit} />
    </Card>
  );
}

function AccountTab({ accessToken }: { accessToken: string }) {
  const { me } = useCurrentUser(); const { t, pages } = useLocale(); const settings=pages.settings; const router=useRouter();
  const [name,setName]=useState(me.user.full_name); const [role,setRole]=useState(me.user.role); const [phone,setPhone]=useState(me.user.phone); const [email,setEmail]=useState(me.user.email??'');
  const [verify,setVerify]=useState<null|{kind:'phone'|'email';target:string;code:string}>(null); const [error,setError]=useState<string|null>(null); const [saved,setSaved]=useState(false);
  async function saveBasic(){setError(null);try{await updateMyProfile(accessToken,{full_name:name,role});setSaved(true);window.location.reload()}catch(e){setError(e instanceof ApiRequestError?e.message:'تعذر حفظ البيانات')}}
  async function requestChange(kind:'phone'|'email'){setError(null);const target=kind==='phone'?phone:email.trim();if(!target)return;try{await sendProfileChangeOtp(kind==='phone'?{phone:target}:{email:target});setVerify({kind,target,code:''})}catch(e){setError(e instanceof ApiRequestError?e.message:'تعذر إرسال رمز التحقق')}}
  async function confirm(){if(!verify)return;try{await verifyProfileChange(accessToken,verify.kind==='phone'?{phone:verify.target,code:verify.code}:{email:verify.target,code:verify.code});setVerify(null);window.location.reload()}catch(e){setError(e instanceof ApiRequestError?e.message:'رمز التحقق غير صحيح')}}
  return <><Card className="p-6"><h2 className="mb-4 text-base font-semibold text-text-primary">{settings.accountInfo.title}</h2><div className="flex flex-col gap-4"><div><label className="mb-1.5 block text-sm text-text-secondary">الاسم</label><Input value={name} onChange={e=>setName(e.target.value)}/></div><div><label className="mb-1.5 block text-sm text-text-secondary">الدور</label><select value={role} onChange={e=>setRole(e.target.value as typeof role)} className="rounded-input border-border-default bg-surface-card w-full border px-3 py-2.5 text-sm text-text-primary"><option value="owner">مالك الحساب</option><option value="admin">مسؤول</option><option value="agent">وسيط</option></select></div><div><label className="mb-1.5 block text-sm text-text-secondary">رقم الجوال</label><div className="flex gap-2"><PhoneInput storagePrefix="966" value={phone} onChange={setPhone}/><Button type="button" variant="secondary" onClick={()=>void requestChange('phone')} disabled={phone===me.user.phone}>تغيير</Button></div><p className="mt-1 text-xs text-text-placeholder">عند التغيير سنرسل رمز OTP إلى الرقم الجديد للتأكد منه.</p></div><div><label className="mb-1.5 block text-sm text-text-secondary">البريد الإلكتروني</label><div className="flex gap-2"><Input type="email" dir="ltr" value={email} onChange={e=>setEmail(e.target.value)}/><Button type="button" variant="secondary" onClick={()=>void requestChange('email')} disabled={email.trim()===(me.user.email??'')}>تغيير</Button></div><p className="mt-1 text-xs text-text-placeholder">عند التغيير سنرسل رمز OTP إلى البريد الجديد للتأكد منه.</p></div><FormError message={error}/><Button type="button" onClick={()=>void saveBasic()} className="w-fit">{saved?'تم الحفظ':'حفظ الاسم والدور'}</Button></div></Card><LanguageThemeSwitchCard/><Card className="p-6"><button type="button" onClick={()=>void signOut().then(()=>router.replace('/login'))} className="text-sm font-semibold text-danger hover:underline">{settings.signOut}</button></Card>{verify&&<div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4"><Card className="w-full max-w-sm p-6"><h3 className="text-lg font-bold text-text-primary">تأكيد {verify.kind==='phone'?'رقم الجوال':'البريد الإلكتروني'}</h3><p className="mb-4 mt-1 text-sm text-text-secondary">أدخل رمز التحقق المرسل إلى <span dir="ltr">{verify.target}</span></p><Input inputMode="numeric" maxLength={4} dir="ltr" value={verify.code} onChange={e=>setVerify({...verify,code:e.target.value.replace(/\D/g,'').slice(0,4)})} placeholder="0000"/><FormError message={error}/><div className="mt-4 flex gap-2"><Button type="button" onClick={()=>void confirm()} disabled={verify.code.length!==4}>تأكيد التغيير</Button><Button type="button" variant="secondary" onClick={()=>setVerify(null)}>إلغاء</Button></div></Card></div>}</>;
}

function OrganizationTab({ accessToken }: { accessToken: string }) {
  const { me } = useCurrentUser();
  const canEdit = me.user.role === 'owner';

  return (
    <>
      <AccountTypeCard accessToken={accessToken} canEdit={canEdit} initial={me.tenant.account_type} />
      {me.tenant.account_type === 'individual' ? (
        <Card className="p-6">
          <h2 className="mb-4 text-base font-semibold text-text-primary">التراخيص</h2>
          <FalLicenseFields accessToken={accessToken} canEdit={canEdit} initial={me.tenant.fal_license_number} />
        </Card>
      ) : (
        <OrganizationInfoCard
          accessToken={accessToken}
          canEdit={canEdit}
          accountType={me.tenant.account_type}
          initial={{
            name_ar: me.tenant.name_ar,
            cr_number: me.tenant.cr_number,
            tax_number: me.tenant.tax_number,
          }}
          falLicense={me.tenant.fal_license_number}
        />
      )}
    </>
  );
}

function ContactTab({ accessToken }: { accessToken: string }) {
  const { me } = useCurrentUser();
  const { pages } = useLocale();
  const settings = pages.settings;

  return (
    <>
      <SocialLinksCard
        accessToken={accessToken}
        initial={{
          social_instagram: me.tenant.social_instagram,
          social_tiktok: me.tenant.social_tiktok,
          social_whatsapp: me.tenant.social_whatsapp,
          social_snapchat: me.tenant.social_snapchat,
          social_phone: me.tenant.social_phone,
          social_facebook: me.tenant.social_facebook,
          social_x: me.tenant.social_x,
          social_telegram: me.tenant.social_telegram,
        }}
      />
      <WebsiteTextFieldCard
        accessToken={accessToken}
        field="address"
        icon={<LocationIcon className="h-[18px] w-[18px] text-text-secondary" />}
        title={settings.address.title}
        description={settings.address.description}
        placeholder={settings.address.placeholder}
        saveFailedMessage={settings.address.saveFailed}
      />
    </>
  );
}

function BrandTab({ accessToken }: { accessToken: string }) {
  return <WebsiteBrandingCard accessToken={accessToken} />;
}

/** إعدادات الحساب والمنشأة — نفس المكوّنات والتصميم الحالي، مع فصل ملكية المعلومات منطقيًا إلى حساب، منشأة، تواصل، وهوية. */
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

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('tab') as SettingsTab | null;
    if (requested && tabOptions.some((option) => option.value === requested)) setTab(requested);
  // tabOptions is derived from the authenticated account; read the initial deep-link once.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AppShell title={settings.pageTitle} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      <div className="flex w-full flex-col gap-5">
        {tabOptions.length > 1 && <SegmentedToggle value={tab} onChange={setTab} options={tabOptions} className="settings-tabs" />}

        {tab === 'account' && <AccountTab accessToken={accessToken} />}
        {tab === 'team' && (canSeeTeam ? <TeamManagementPanel /> : null)}
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
