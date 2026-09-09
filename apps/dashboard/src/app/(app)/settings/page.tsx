'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import type { AccountType } from '@sbaah/shared';
import { subdomainInputSchema } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';
import { updateSubdomain } from '@/lib/api/tenant';
import { ApiRequestError } from '@/lib/api/client';

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

/** Owner-only, same tier as custom domain (api's PATCH /v1/tenant/subdomain enforces this too). Reloads on success — the subdomain is read once into (app)/layout.tsx's shared user context, simplest way to keep the topbar's "زيارة الموقع" link and this page in sync. */
function SubdomainSection({ accessToken, currentSubdomain, canEdit }: { accessToken: string; currentSubdomain: string; canEdit: boolean }) {
  const [editing, setEditing] = useState(false);
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

  if (!canEdit) {
    return <InfoRow label="النطاق الفرعي" value={`${currentSubdomain}.${rootDomain}`} />;
  }

  if (!editing) {
    return (
      <div className="flex items-center justify-between border-b border-border-subtle py-3 last:border-0">
        <span className="text-sm text-text-secondary">النطاق الفرعي</span>
        <div className="flex items-center gap-3">
          <span className="text-sm font-medium text-text-primary" dir="ltr">
            {currentSubdomain}.{rootDomain}
          </span>
          <button
            type="button"
            onClick={() => {
              setInput(currentSubdomain);
              setEditing(true);
            }}
            className="text-xs font-semibold text-brand hover:underline"
          >
            تعديل
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSave} className="border-b border-border-subtle py-3 last:border-0">
      <div className="mb-2 flex items-center justify-between">
        <span className="text-sm text-text-secondary">النطاق الفرعي</span>
      </div>
      <div className="flex items-center gap-2">
        <Input value={input} onChange={(e) => setInput(e.target.value.toLowerCase())} dir="ltr" className="flex-1" />
        <span className="text-sm text-text-secondary" dir="ltr">
          .{rootDomain}
        </span>
      </div>
      <FormError message={error} />
      <div className="mt-2 flex gap-2">
        <Button type="submit" disabled={loading} className="h-8 px-3 text-xs">
          {loading ? 'جارٍ الحفظ...' : 'حفظ'}
        </Button>
        <button type="button" onClick={() => setEditing(false)} className="text-xs text-text-secondary hover:underline">
          إلغاء
        </button>
      </div>
    </form>
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
          <SubdomainSection accessToken={accessToken} currentSubdomain={me.tenant.subdomain} canEdit={me.user.role === 'owner'} />
          <InfoRow label="اسمك" value={me.user.full_name} />
          <InfoRow label="جوالك" value={me.user.phone} />
          <InfoRow label="دورك" value={ROLE_LABELS[me.user.role]} />
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 text-base font-semibold text-text-primary">الدومين المخصص</h2>
          <p className="text-sm text-text-secondary">
            إدارة الدومين المخصص انتقلت إلى{' '}
            <Link href="/site" className="font-semibold text-brand hover:underline">
              محرر الموقع
            </Link>
            .
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
