'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { AccountType } from '@sbaah/shared';
import { ACCOUNT_TYPE_LABELS, accountTypeUpdateSchema, socialLinksUpdateSchema } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import {
  InstagramIcon,
  TiktokIcon,
  WhatsappIcon,
  SnapchatIcon,
  CallIcon,
} from '@/components/website/editor-icons';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { updateSocialLinks, updateAccountType, type SocialLinks } from '@/lib/api/tenant';
import { ApiRequestError } from '@/lib/api/client';

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

const ACCOUNT_TYPE_OPTIONS: { type: AccountType; label: string; description: string }[] = [
  { type: 'individual', label: 'فرد', description: 'وسيط مستقل يعمل باسمه برخصة فال' },
  { type: 'institution', label: 'مؤسسة', description: 'مؤسسة فردية لها سجل تجاري ورقم ضريبي' },
  { type: 'company', label: 'شركة', description: 'شركة عقارية بفريق ووسطاء متعددين' },
];

interface AccountTypeInitial {
  account_type: AccountType;
  name_ar: string;
  cr_number: string | null;
  tax_number: string | null;
}

/**
 * نوع الحساب — قابل للتبديل بأي اتجاه (فرد↔مؤسسة↔شركة) من داخل حسابي،
 * Owner فقط (assertOwner بنفس تقييد الدومين). يعيد تحميل الصفحة بعد
 * الحفظ لتحديث شارة النوع/الاسم المعروض في AppShell بلا حاجة لآلية
 * refresh مخصصة لـ me (نفس نمط صفحة الدومين).
 */
function AccountTypeCard({ accessToken, initial, canEdit }: { accessToken: string; initial: AccountTypeInitial; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
  const [accountType, setAccountType] = useState<AccountType>(initial.account_type);
  const [fullName, setFullName] = useState(initial.name_ar);
  const [nameAr, setNameAr] = useState(initial.name_ar);
  const [crNumber, setCrNumber] = useState(initial.cr_number ?? '');
  const [taxNumber, setTaxNumber] = useState(initial.tax_number ?? '');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function cancel() {
    setEditing(false);
    setError(null);
    setAccountType(initial.account_type);
    setFullName(initial.name_ar);
    setNameAr(initial.name_ar);
    setCrNumber(initial.cr_number ?? '');
    setTaxNumber(initial.tax_number ?? '');
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const payload =
      accountType === 'individual'
        ? { account_type: 'individual' as const, full_name: fullName }
        : { account_type: accountType, name_ar: nameAr, cr_number: crNumber, tax_number: taxNumber };

    const result = accountTypeUpdateSchema.safeParse(payload);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'تحقق من البيانات المدخلة');
      return;
    }

    setLoading(true);
    try {
      await updateAccountType(accessToken, result.data);
      window.location.reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر تبديل نوع الحساب');
      setLoading(false);
    }
  }

  if (!editing) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-base font-semibold text-text-primary">نوع الحساب</h2>
            <p className="text-sm text-text-secondary">{ACCOUNT_TYPE_LABELS[initial.account_type]}</p>
          </div>
          {canEdit && (
            <Button type="button" variant="secondary" onClick={() => setEditing(true)}>
              تبديل النوع
            </Button>
          )}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-base font-semibold text-text-primary">تبديل نوع الحساب</h2>
      <p className="mb-4 text-sm text-text-secondary">يحدّد النوع الحقول المطلوبة وشكل صفحة &quot;من نحن&quot; في موقعك.</p>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-4">
        <div className="flex flex-col gap-3">
          {ACCOUNT_TYPE_OPTIONS.map(({ type, label, description }) => {
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

        {accountType === 'individual' ? (
          <Input placeholder="الاسم الثلاثي" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        ) : (
          <>
            <Input
              placeholder={accountType === 'institution' ? 'اسم المؤسسة' : 'اسم الشركة'}
              value={nameAr}
              onChange={(e) => setNameAr(e.target.value)}
            />
            <Input placeholder="رقم السجل التجاري" value={crNumber} onChange={(e) => setCrNumber(e.target.value)} dir="ltr" />
            <Input placeholder="الرقم الضريبي" value={taxNumber} onChange={(e) => setTaxNumber(e.target.value)} dir="ltr" />
          </>
        )}

        <FormError message={error} />
        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>
            {loading ? 'جارٍ الحفظ...' : 'حفظ'}
          </Button>
          <Button type="button" variant="secondary" onClick={cancel} disabled={loading}>
            إلغاء
          </Button>
        </div>
      </form>
    </Card>
  );
}

const SOCIAL_FIELDS: { key: keyof SocialLinks; label: string; placeholder: string; Icon: typeof InstagramIcon }[] = [
  { key: 'social_instagram', label: 'إنستغرام', placeholder: 'رابط حساب إنستغرام', Icon: InstagramIcon },
  { key: 'social_tiktok', label: 'تيك توك', placeholder: 'رابط حساب تيك توك', Icon: TiktokIcon },
  { key: 'social_snapchat', label: 'سناب شات', placeholder: 'رابط حساب سناب شات', Icon: SnapchatIcon },
];

/** حقلا واتساب/اتصال يُخزَّنان كأرقام بلا + (966 متبوعة بتسعة أرقام) لتوافق digitsOnly() بالموقع العام — يُعرضان دائمًا برمز +966 ثابت مثل بقية حقول الجوال. */
const PHONE_SOCIAL_FIELDS: { key: 'social_whatsapp' | 'social_phone'; label: string; Icon: typeof WhatsappIcon }[] = [
  { key: 'social_whatsapp', label: 'واتساب', Icon: WhatsappIcon },
  { key: 'social_phone', label: 'اتصال', Icon: CallIcon },
];

/** حسابات التواصل الاجتماعي — تُعرض تلقائيًا (فقط ما تمت تعبئته) في تذييل الموقع العام (site/editor's أسفل الصفحة). */
function SocialLinksCard({ accessToken, initial }: { accessToken: string; initial: SocialLinks }) {
  const [draft, setDraft] = useState<SocialLinks>(initial);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    const result = socialLinksUpdateSchema.safeParse(draft);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'تحقق من البيانات المدخلة');
      return;
    }
    setLoading(true);
    try {
      const updated = await updateSocialLinks(accessToken, result.data);
      setDraft(updated);
      setSaved(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ حسابات التواصل');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-base font-semibold text-text-primary">حسابات التواصل الاجتماعي</h2>
      <p className="mb-4 text-sm text-text-secondary">
        يظهر في تذييل موقعك الإلكتروني فقط ما تمت تعبئته هنا.
      </p>
      <form onSubmit={(e) => void handleSubmit(e)} className="flex flex-col gap-3">
        {PHONE_SOCIAL_FIELDS.map(({ key, label, Icon }) => (
          <div key={key} className="flex flex-col gap-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-primary">
              <Icon className="h-[16px] w-[16px] text-text-secondary" />
              {label}
            </label>
            <PhoneInput
              storagePrefix="966"
              placeholder="5xxxxxxxx"
              value={draft[key] ?? ''}
              onChange={(value) => setDraft((c) => ({ ...c, [key]: value }))}
            />
          </div>
        ))}
        {SOCIAL_FIELDS.map(({ key, label, placeholder, Icon }) => (
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
          {loading ? 'جارٍ الحفظ...' : saved ? 'تم الحفظ ✓' : 'حفظ'}
        </Button>
      </form>
    </Card>
  );
}

/** حسابي (من قائمة الحساب المنسدلة أسفل الشريط الجانبي) — بيانات الحساب + حسابات التواصل الاجتماعي؛ النطاق الفرعي/الدومين المخصص انتقلا إلى /domain (عنصر قائمة مستقل، مطابق للتصميم). */
export default function SettingsPage() {
  const { me, accessToken } = useCurrentUser();

  return (
    <AppShell
      title="الإعدادات"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="flex max-w-[640px] flex-col gap-5">
        <Card className="p-6">
          <h2 className="mb-2 text-base font-semibold text-text-primary">بيانات الحساب</h2>
          <InfoRow label="اسم الحساب" value={me.tenant.name_ar} />
          <InfoRow label="اسمك" value={me.user.full_name} />
          <InfoRow label="جوالك" value={me.user.phone} />
          <InfoRow label="دورك" value={ROLE_LABELS[me.user.role]} />
        </Card>

        <AccountTypeCard
          accessToken={accessToken}
          canEdit={me.user.role === 'owner'}
          initial={{
            account_type: me.tenant.account_type,
            name_ar: me.tenant.name_ar,
            cr_number: me.tenant.cr_number,
            tax_number: me.tenant.tax_number,
          }}
        />

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

        <Card className="p-6">
          <h2 className="mb-1 text-base font-semibold text-text-primary">النطاق الفرعي والدومين المخصص</h2>
          <p className="text-sm text-text-secondary">
            إدارة النطاق الفرعي والدومين المخصص انتقلت إلى{' '}
            <Link href="/domain" className="font-semibold text-brand hover:underline">
              الدومين
            </Link>
            .
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
