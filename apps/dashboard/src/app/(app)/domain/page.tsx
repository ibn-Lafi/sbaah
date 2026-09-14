'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { customDomainInputSchema, subdomainInputSchema } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { DomainSkeleton } from '@/components/domain/domain-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';
import {
  getDomain,
  setDomain,
  removeDomain,
  updateSubdomain,
  verifyDomain,
  type DomainInfo,
} from '@/lib/api/tenant';
import { ApiRequestError } from '@/lib/api/client';

type DomainMode = 'custom' | 'subdomain';

function CustomDomainCard({
  accessToken,
  domain,
  onChanged,
}: {
  accessToken: string;
  domain: DomainInfo;
  onChanged: () => void;
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notVerifiedYet, setNotVerifiedYet] = useState(false);

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
      onChanged();
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
      onChanged();
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setNotVerifiedYet(false);
    setVerifying(true);
    try {
      const result = await verifyDomain(accessToken);
      if (result.verified) {
        onChanged();
      } else {
        setNotVerifiedYet(true);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر التحقق من الربط');
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-text-primary mb-1 text-base font-semibold">الدومين المخصص</h2>
      <p className="text-text-secondary mb-4 text-sm">اربط دومينك الخاص بموقعك بدل النطاق الفرعي</p>

      {domain.custom_domain ? (
        <div className="flex flex-col gap-4">
          <div
            className={`rounded-input flex items-center gap-2.5 px-4 py-3 ${
              domain.custom_domain_status === 'verified'
                ? 'bg-success-surface'
                : 'bg-warning-surface'
            }`}
          >
            <span
              className={`h-2 w-2 flex-none rounded-full ${domain.custom_domain_status === 'verified' ? 'bg-success' : 'bg-warning'}`}
            />
            <span
              dir="ltr"
              className={`flex-1 text-sm font-semibold ${domain.custom_domain_status === 'verified' ? 'text-success' : 'text-warning'}`}
            >
              {domain.custom_domain}
            </span>
            <Badge
              status={domain.custom_domain_status === 'verified' ? 'active' : 'draft'}
              label={domain.custom_domain_status === 'verified' ? 'مُفعّل' : 'بانتظار ربط DNS'}
            />
          </div>
          {domain.custom_domain_status === 'pending' && domain.dns_records.length > 0 && (
            <>
              <div
                className="rounded-input bg-surface-header flex flex-col gap-2 p-4 text-sm"
                dir="ltr"
              >
                <div className="text-text-secondary flex justify-between text-xs">
                  <span>Type</span>
                  <span>Name</span>
                  <span>Value</span>
                </div>
                <div className="bg-border-subtle h-px" />
                {domain.dns_records.map((record) => (
                  <div
                    key={record.type}
                    className="text-text-primary flex justify-between gap-3 font-semibold"
                  >
                    <span>{record.type}</span>
                    <span className="truncate">{record.name}</span>
                    <span className="truncate">{record.value}</span>
                  </div>
                ))}
              </div>
              <p className="text-text-secondary text-xs">
                أضِف كلا السجلين لدى مزوّد الدومين — CNAME للربط وTXT لإثبات الملكية، كلاهما مطلوب
                قبل تفعيل الشهادة.
              </p>
              <Button
                type="button"
                variant="secondary"
                loading={verifying}
                onClick={() => void handleVerify()}
                className="w-fit"
              >
                اختبار الربط
              </Button>
              {notVerifiedYet && (
                <p className="text-warning text-sm">
                  لم يتم رصد الربط بعد — تأكد من إضافة السجلين أعلاه بالضبط لدى مزوّد الدومين، وقد
                  يستغرق انتشارها حتى ساعات قليلة قبل إعادة المحاولة.
                </p>
              )}
            </>
          )}
          <button
            type="button"
            onClick={handleRemove}
            disabled={loading}
            className="text-danger w-fit text-sm font-medium"
          >
            إلغاء ربط الدومين
          </button>
        </div>
      ) : (
        <form onSubmit={handleSet} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label className="text-text-primary text-sm font-medium">اسم الدومين</label>
            <Input
              placeholder="example.com"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              dir="ltr"
            />
          </div>
          <Button type="submit" disabled={loading} className="h-[50px] sm:w-fit">
            {loading ? 'جارٍ الربط...' : 'ربط الدومين'}
          </Button>
        </form>
      )}
      <FormError message={error} />
    </Card>
  );
}

function SubdomainCard({
  accessToken,
  currentSubdomain,
  canEdit,
  showUpsell,
}: {
  accessToken: string;
  currentSubdomain: string;
  canEdit: boolean;
  showUpsell: boolean;
}) {
  const [input, setInput] = useState(currentSubdomain);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const rootDomain = getPlatformRootDomain();

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = subdomainInputSchema.safeParse({ subdomain: input });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'نطاق فرعي غير صحيح');
      return;
    }
    setLoading(true);
    try {
      await updateSubdomain(accessToken, result.data.subdomain);
      window.location.reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر تحديث النطاق الفرعي');
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-text-primary mb-1 text-base font-semibold">النطاق الفرعي</h2>
      <p className="text-text-secondary mb-4 text-sm">عنوان موقعك الأساسي على سبعة</p>

      {canEdit ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <label className="text-text-primary text-sm font-medium">اسم المستخدم</label>
          <div
            className="rounded-input border-border-default flex max-w-[400px] items-stretch overflow-hidden border"
            dir="ltr"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toLowerCase())}
              dir="ltr"
              className="text-text-primary h-[50px] flex-1 border-none bg-transparent px-3.5 text-[15px] outline-none"
            />
            <span className="bg-surface-subtle-2 text-text-secondary flex flex-none items-center px-3.5 text-sm font-medium">
              .{rootDomain}
            </span>
          </div>
          <p className="text-text-secondary text-sm" dir="ltr">
            https://{input || currentSubdomain}.{rootDomain}
          </p>
          <FormError message={error} />
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
          {showUpsell && (
            <Link
              href="/billing"
              className="rounded-input bg-brand-surface text-brand px-4 py-3 text-sm hover:underline"
            >
              رقّي باقتك لربط دومين مخصص بدل النطاق الفرعي
            </Link>
          )}
        </form>
      ) : (
        <p className="text-text-primary text-sm font-medium" dir="ltr">
          {currentSubdomain}.{rootDomain}
        </p>
      )}
    </Card>
  );
}

/** الدومين — عنصر قائمة مستقل (مطابق للتصميم)، يجمع النطاق الفرعي والدومين المخصص بدل تفرقتهما بين الإعدادات ومحرر الموقع كما كان سابقًا. */
export default function DomainPage() {
  const { me, accessToken } = useCurrentUser();
  const [domain, setDomainState] = useState<DomainInfo | null>(null);
  const [mode, setMode] = useState<DomainMode>('custom');
  const canEdit = me.user.role === 'owner';

  function reload() {
    void getDomain(accessToken).then(setDomainState);
  }

  useEffect(reload, [accessToken]);

  return (
    <AppShell
      title="الدومين"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="flex max-w-[560px] flex-col gap-4">
        {domain === null ? (
          <DomainSkeleton />
        ) : !canEdit ? (
          <SubdomainCard
            accessToken={accessToken}
            currentSubdomain={me.tenant.subdomain}
            canEdit={false}
            showUpsell={false}
          />
        ) : domain.custom_domain_allowed ? (
          <>
            <div className="bg-surface-subtle-3 flex w-full max-w-[320px] gap-1 rounded-full p-1">
              <button
                type="button"
                onClick={() => setMode('custom')}
                className={`h-10 flex-1 rounded-full text-[13px] font-semibold ${mode === 'custom' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'}`}
              >
                الدومين المخصص
              </button>
              <button
                type="button"
                onClick={() => setMode('subdomain')}
                className={`h-10 flex-1 rounded-full text-[13px] font-semibold ${mode === 'subdomain' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'}`}
              >
                النطاق الفرعي
              </button>
            </div>
            {mode === 'custom' ? (
              <CustomDomainCard accessToken={accessToken} domain={domain} onChanged={reload} />
            ) : (
              <SubdomainCard
                accessToken={accessToken}
                currentSubdomain={me.tenant.subdomain}
                canEdit
                showUpsell={false}
              />
            )}
          </>
        ) : (
          <SubdomainCard
            accessToken={accessToken}
            currentSubdomain={me.tenant.subdomain}
            canEdit
            showUpsell
          />
        )}
      </div>
    </AppShell>
  );
}
