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
import { LoadingState } from '@/components/ui/loading-state';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';
import { getDomain, setDomain, removeDomain, updateSubdomain, type DomainInfo } from '@/lib/api/tenant';
import { ApiRequestError } from '@/lib/api/client';

type DomainMode = 'custom' | 'subdomain';

function CustomDomainCard({ accessToken, domain, onChanged }: { accessToken: string; domain: DomainInfo; onChanged: () => void }) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

  return (
    <Card className="p-6">
      <h2 className="mb-1 text-base font-semibold text-text-primary">الدومين المخصص</h2>
      <p className="mb-4 text-sm text-text-secondary">اربط دومينك الخاص بموقعك بدل النطاق الفرعي</p>

      {domain.custom_domain ? (
        <div className="flex flex-col gap-4">
          <div
            className={`flex items-center gap-2.5 rounded-input px-4 py-3 ${
              domain.custom_domain_status === 'verified' ? 'bg-success-surface' : 'bg-warning-surface'
            }`}
          >
            <span className={`h-2 w-2 flex-none rounded-full ${domain.custom_domain_status === 'verified' ? 'bg-success' : 'bg-warning'}`} />
            <span dir="ltr" className={`flex-1 text-sm font-semibold ${domain.custom_domain_status === 'verified' ? 'text-success' : 'text-warning'}`}>
              {domain.custom_domain}
            </span>
            <Badge
              status={domain.custom_domain_status === 'verified' ? 'active' : 'draft'}
              label={domain.custom_domain_status === 'verified' ? 'مُفعّل' : 'بانتظار ربط DNS'}
            />
          </div>
          {domain.custom_domain_status === 'pending' && domain.dns_record && (
            <div className="flex flex-col gap-2 rounded-input bg-surface-header p-4 text-sm" dir="ltr">
              <div className="flex justify-between text-xs text-text-secondary">
                <span>Type</span>
                <span>Name</span>
                <span>Value</span>
              </div>
              <div className="h-px bg-border-subtle" />
              <div className="flex justify-between font-semibold text-text-primary">
                <span>{domain.dns_record.type}</span>
                <span>{domain.dns_record.name}</span>
                <span>{domain.dns_record.value}</span>
              </div>
            </div>
          )}
          <button type="button" onClick={handleRemove} disabled={loading} className="w-fit text-sm font-medium text-danger">
            إلغاء ربط الدومين
          </button>
        </div>
      ) : (
        <form onSubmit={handleSet} className="flex items-end gap-3">
          <div className="flex flex-1 flex-col gap-2">
            <label className="text-sm font-medium text-text-primary">اسم الدومين</label>
            <Input placeholder="example.com" value={input} onChange={(e) => setInput(e.target.value)} dir="ltr" />
          </div>
          <Button type="submit" disabled={loading} className="h-[50px]">
            {loading ? 'جارٍ الربط...' : 'ربط الدومين'}
          </Button>
        </form>
      )}
      <FormError message={error} />
    </Card>
  );
}

function SubdomainCard({ accessToken, currentSubdomain, canEdit, showUpsell }: { accessToken: string; currentSubdomain: string; canEdit: boolean; showUpsell: boolean }) {
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
      <h2 className="mb-1 text-base font-semibold text-text-primary">النطاق الفرعي</h2>
      <p className="mb-4 text-sm text-text-secondary">عنوان موقعك الأساسي على سبعة</p>

      {canEdit ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <label className="text-sm font-medium text-text-primary">اسم المستخدم</label>
          <div className="flex max-w-[400px] items-stretch overflow-hidden rounded-input border border-border-default" dir="ltr">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toLowerCase())}
              dir="ltr"
              className="h-[50px] flex-1 border-none bg-transparent px-3.5 text-[15px] text-text-primary outline-none"
            />
            <span className="flex flex-none items-center bg-surface-subtle-2 px-3.5 text-sm font-medium text-text-secondary">.{rootDomain}</span>
          </div>
          <p className="text-sm text-text-secondary" dir="ltr">
            https://{input || currentSubdomain}.{rootDomain}
          </p>
          <FormError message={error} />
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
          </Button>
          {showUpsell && (
            <Link href="/billing" className="rounded-input bg-brand-surface px-4 py-3 text-sm text-brand hover:underline">
              رقّي باقتك لربط دومين مخصص بدل النطاق الفرعي
            </Link>
          )}
        </form>
      ) : (
        <p className="text-sm font-medium text-text-primary" dir="ltr">
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
    <AppShell title="الدومين" orgName={me.tenant.name_ar} accountType={me.tenant.account_type} roleLabel={ROLE_LABELS[me.user.role]}>
      <div className="flex max-w-[560px] flex-col gap-4">
        {domain === null ? (
          <LoadingState />
        ) : !canEdit ? (
          <SubdomainCard accessToken={accessToken} currentSubdomain={me.tenant.subdomain} canEdit={false} showUpsell={false} />
        ) : domain.custom_domain_allowed ? (
          <>
            <div className="flex w-[320px] gap-1 rounded-full bg-surface-subtle-3 p-1">
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
              <SubdomainCard accessToken={accessToken} currentSubdomain={me.tenant.subdomain} canEdit showUpsell={false} />
            )}
          </>
        ) : (
          <SubdomainCard accessToken={accessToken} currentSubdomain={me.tenant.subdomain} canEdit showUpsell />
        )}
      </div>
    </AppShell>
  );
}
