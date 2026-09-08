'use client';

import { useEffect, useState, type FormEvent } from 'react';
import type { AccountType } from '@sbaah/shared';
import { customDomainInputSchema } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getDomain, setDomain, removeDomain, type DomainInfo } from '@/lib/api/tenant';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  individual: 'فرد',
  institution: 'مؤسسة',
  company: 'شركة',
};

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
      setError(err instanceof Error ? err.message : 'تعذّر ربط الدومين');
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
      <Card className="p-6">
        <h2 className="mb-1 text-base font-semibold text-text-primary">الدومين المخصص</h2>
        <p className="text-sm text-text-secondary">إدارة الدومين متاحة لمالك الحساب فقط.</p>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="mb-4 text-base font-semibold text-text-primary">الدومين المخصص</h2>

      {domain === null ? (
        <p className="text-sm text-text-secondary">جارٍ التحميل...</p>
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
          <Input
            placeholder="example.com"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            dir="ltr"
          />
          <FormError message={error} />
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? 'جارٍ الربط...' : 'ربط دومين'}
          </Button>
        </form>
      )}
    </Card>
  );
}

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
          <InfoRow label="نوع الحساب" value={ACCOUNT_TYPE_LABELS[me.tenant.account_type]} />
          <InfoRow label="النطاق الفرعي" value={`${me.tenant.subdomain}.${getPlatformRootDomain()}`} />
          <InfoRow label="اسمك" value={me.user.full_name} />
          <InfoRow label="جوالك" value={me.user.phone} />
          <InfoRow label="دورك" value={ROLE_LABELS[me.user.role]} />
        </Card>

        <DomainSection accessToken={accessToken} ownerOnly={me.user.role === 'owner'} />
      </div>
    </AppShell>
  );
}
