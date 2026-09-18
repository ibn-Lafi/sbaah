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
  CallIcon,
  LocationIcon,
  MailIcon,
} from '@/components/website/editor-icons';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { updateSocialLinks, updateAccountType, updateFalLicense, type SocialLinks } from '@/lib/api/tenant';
import { getWebsite, updateWebsite } from '@/lib/api/website';
import { updateMyEmail } from '@/lib/api/auth';
import { signOut } from '@/lib/auth/session';
import { ApiRequestError } from '@/lib/api/client';

type SettingsTab = 'account' | 'team' | 'billing' | 'websiteData';

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

  if (!editing) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
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
    );
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-base font-semibold text-text-primary">{t.accountType.editTitle}</h2>
      <p className="mb-4 text-sm text-text-secondary">{t.accountType.editDescription}</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {ACCOUNT_TYPES.map((type) => {
            const { label, description } = t.accountType.options[type];
            const selected = accountType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={`rounded-input flex items-center gap-4 border p-4 text-start transition-colors ${
                  selected ? 'border-brand ring-brand ring-1' : 'border-border-default hover:border-text-placeholder'
                }`}
              >
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
          <Button type="submit" disabled={loading}>
            {loading ? t.common.saving : t.common.save}
          </Button>
          <Button type="button" variant="secondary" onClick={cancel} disabled={loading}>
            {t.common.cancel}
          </Button>
        </div>
      </form>
    </Card>
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

    setLoading(true);
    try {
      await updateAccountType(accessToken, result.data);
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

      <div className="my-5 h-px bg-border-subtle" />

      <FalLicenseFields accessToken={accessToken} initial={falLicense} canEdit={canEdit} />
    </Card>
  );
}

/** حسابات التواصل الاجتماعي — تُعرض تلقائيًا (فقط ما تمت تعبئته) في تذييل الموقع العام (site/editor's أسفل الصفحة). */
function SocialLinksCard({ accessToken, initial }: { accessToken: string; initial: SocialLinks }) {
  const { pages } = useLocale();
  const t = pages.settings;
  const [draft, setDraft] = useState<SocialLinks>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  /** حقلا واتساب/اتصال يُخزَّنان كأرقام بلا + (966 متبوعة بتسعة أرقام) لتوافق digitsOnly() بالموقع العام — يُعرضان دائمًا برمز +966 ثابت مثل بقية حقول الجوال. */
  const phoneSocialFields: { key: 'social_whatsapp' | 'social_phone'; label: string; Icon: typeof WhatsappIcon }[] = [
    { key: 'social_whatsapp', label: t.socialLinks.whatsapp, Icon: WhatsappIcon },
    { key: 'social_phone', label: t.socialLinks.call, Icon: CallIcon },
  ];
  const socialFields: { key: keyof SocialLinks; label: string; placeholder: string; Icon: typeof InstagramIcon }[] = [
    { key: 'social_instagram', label: t.socialLinks.instagram, placeholder: t.socialLinks.instagramPlaceholder, Icon: InstagramIcon },
    { key: 'social_tiktok', label: t.socialLinks.tiktok, placeholder: t.socialLinks.tiktokPlaceholder, Icon: TiktokIcon },
    { key: 'social_snapchat', label: t.socialLinks.snapchat, placeholder: t.socialLinks.snapchatPlaceholder, Icon: SnapchatIcon },
  ];

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
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.socialLinks.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-base font-semibold text-text-primary">{t.socialLinks.title}</h2>
      <p className="mb-4 text-sm text-text-secondary">{t.socialLinks.description}</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
        {phoneSocialFields.map(({ key, label, Icon }) => (
          <div key={key} className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Icon className="h-[16px] w-[16px] text-text-secondary" />
              {label}
            </label>
            <PhoneInput
              storagePrefix="966"
              placeholder={t.socialLinks.phonePlaceholder}
              value={draft[key] ?? ''}
              onChange={(value) => setDraft((c) => ({ ...c, [key]: value }))}
            />
          </div>
        ))}
        {socialFields.map(({ key, label, placeholder, Icon }) => (
          <div key={key} className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Icon className="h-[16px] w-[16px] text-text-secondary" />
              {label}
            </label>
            <Input
              value={draft[key] ?? ''}
              onChange={(e) => setDraft((c) => ({ ...c, [key]: e.target.value }))}
              placeholder={placeholder}
              dir="ltr"
            />
          </div>
        ))}
        <FormError message={error} />
        <Button type="submit" disabled={loading} className="w-fit">
          {loading ? t.common.saving : saved ? t.common.saved : t.common.save}
        </Button>
      </form>
    </Card>
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
function EmailCard({ accessToken, initialEmail }: { accessToken: string; initialEmail: string | null }) {
  const { pages } = useLocale();
  const t = pages.settings;
  const [draft, setDraft] = useState(initialEmail ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setLoading(true);
    try {
      await updateMyEmail(accessToken, draft.trim() ? draft.trim() : null);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.email.saveFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 flex items-center gap-2 text-base font-semibold text-text-primary">
        <MailIcon className="h-[18px] w-[18px] text-text-secondary" />
        {t.email.title}
      </h2>
      <p className="mb-4 text-sm text-text-secondary">{t.email.description}</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
        <Input
          type="email"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="name@example.com"
          dir="ltr"
        />
        <FormError message={error} />
        <Button type="submit" disabled={loading} className="w-fit">
          {loading ? t.common.saving : saved ? t.common.saved : t.common.save}
        </Button>
      </form>
    </Card>
  );
}

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
  const { me } = useCurrentUser();
  const { t, pages } = useLocale();
  const settings = pages.settings;
  const router = useRouter();

  function handleSignOut() {
    void signOut().then(() => router.replace('/login'));
  }

  return (
    <>
      <Card className="p-6">
        <h2 className="mb-2 text-base font-semibold text-text-primary">{settings.accountInfo.title}</h2>
        <InfoRow label={settings.accountInfo.yourName} value={me.user.full_name} />
        <InfoRow label={settings.accountInfo.yourPhone} value={me.user.phone} />
        <InfoRow label={settings.accountInfo.yourRole} value={t.roleLabels[me.user.role]} />
      </Card>

      <EmailCard accessToken={accessToken} initialEmail={me.user.email} />

      <LanguageThemeSwitchCard />

      <Card className="p-6">
        <button
          type="button"
          onClick={handleSignOut}
          className="text-sm font-semibold text-danger hover:underline"
        >
          {settings.signOut}
        </button>
      </Card>
    </>
  );
}

function WebsiteDataTab({ accessToken }: { accessToken: string }) {
  const { me } = useCurrentUser();
  const { pages } = useLocale();
  const settings = pages.settings;
  const canEdit = me.user.role === 'owner';

  return (
    <>
      <AccountTypeCard accessToken={accessToken} canEdit={canEdit} initial={me.tenant.account_type} />

      {me.tenant.account_type === 'individual' ? (
        <FalLicenseCard accessToken={accessToken} canEdit={canEdit} initial={me.tenant.fal_license_number} />
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

      <SocialLinksCard
        accessToken={accessToken}
        initial={{
          social_instagram: me.tenant.social_instagram,
          social_tiktok: me.tenant.social_tiktok,
          social_whatsapp: me.tenant.social_whatsapp,
          social_snapchat: me.tenant.social_snapchat,
          social_phone: me.tenant.social_phone,
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

      <WebsiteTextFieldCard
        accessToken={accessToken}
        field="footer_description"
        icon={<MailIcon className="h-[18px] w-[18px] text-text-secondary" />}
        title={settings.websiteDescription.title}
        description={settings.websiteDescription.description}
        placeholder={settings.websiteDescription.placeholder}
        saveFailedMessage={settings.websiteDescription.saveFailed}
      />

      <WebsiteBrandingCard accessToken={accessToken} />
    </>
  );
}

/** حسابي (من الشريط السفلي بعرض الجوال، وقائمة الحساب المنسدلة بالشريط الجانبي على سطح المكتب) — شريط تبويب موحّد (بنفس شكل الدومين المخصص/الفرعي بصفحة الدومين) يجمع الحساب الشخصي، إدارة الموظفين، الفوترة والاشتراك، وبيانات الموقع في صفحة واحدة بدل ثلاث صفحات منفصلة. /team و/billing يبقيان يعملان (نفس المكوّنات بالضبط). */
export default function SettingsPage() {
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const settings = pages.settings;
  const canSeeTeam = me.user.role === 'owner' || me.user.role === 'admin';
  const canSeeBilling = me.user.role === 'owner';
  const canSeeWebsiteData = me.user.role === 'owner' || me.user.role === 'admin';

  const tabOptions = [
    { value: 'account' as const, label: settings.tabs.account },
    ...(canSeeTeam ? [{ value: 'team' as const, label: settings.tabs.team }] : []),
    ...(canSeeBilling ? [{ value: 'billing' as const, label: settings.tabs.billing }] : []),
    ...(canSeeWebsiteData ? [{ value: 'websiteData' as const, label: settings.tabs.websiteData }] : []),
  ];
  const [tab, setTab] = useState<SettingsTab>('account');

  return (
    <AppShell title={settings.pageTitle} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      <div className="mx-auto flex max-w-[640px] flex-col gap-5">
        {tabOptions.length > 1 && <SegmentedToggle value={tab} onChange={setTab} options={tabOptions} className="settings-tabs" />}

        {tab === 'account' && <AccountTab accessToken={accessToken} />}
        {tab === 'team' && (canSeeTeam ? <TeamManagementPanel /> : null)}
        {tab === 'billing' &&
          (canSeeBilling ? (
            <Suspense fallback={null}>
              <BillingPanel />
            </Suspense>
          ) : null)}
        {tab === 'websiteData' && (canSeeWebsiteData ? <WebsiteDataTab accessToken={accessToken} /> : null)}
      </div>
    </AppShell>
  );
}
