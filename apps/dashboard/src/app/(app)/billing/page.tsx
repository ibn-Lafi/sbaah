'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getBilling, type BillingInfo } from '@/lib/api/billing';

function UsageBar({ label, used, max }: { label: string; used: number; max: number }) {
  const pct = Math.min(100, Math.round((used / max) * 100));
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-sm">
        <span className="text-text-secondary">{label}</span>
        <span className="font-medium text-text-primary" dir="ltr">
          {used} / {max}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-subtle">
        <div
          className={`h-full ${pct >= 100 ? 'bg-danger' : 'bg-brand'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

export default function BillingPage() {
  const { me, accessToken } = useCurrentUser();
  const [billing, setBilling] = useState<BillingInfo | null>(null);

  useEffect(() => {
    void getBilling(accessToken).then(setBilling);
  }, [accessToken]);

  return (
    <AppShell
      title="الفوترة والاشتراك"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="flex max-w-[560px] flex-col gap-5">
        {billing === null ? (
          <p className="text-sm text-text-secondary">جارٍ التحميل...</p>
        ) : (
          <>
            <Card className="p-6">
              <h2 className="mb-1 text-base font-semibold text-text-primary">الباقة الحالية</h2>
              <p className="mb-4 text-2xl font-bold text-brand" dir="ltr">
                {billing.plan.price.toLocaleString('en-US')} ر.س / شهريًا
              </p>
              <p className="text-sm text-text-secondary">{billing.plan.name_ar}</p>
            </Card>

            <Card className="flex flex-col gap-4 p-6">
              <h2 className="text-base font-semibold text-text-primary">الاستخدام الحالي</h2>
              <UsageBar label="العقارات" used={billing.usage.properties} max={billing.plan.max_properties} />
              <UsageBar label="أعضاء الفريق" used={billing.usage.users} max={billing.plan.max_users} />
            </Card>

            <Card className="p-6">
              <p className="text-sm text-text-secondary">
                لإدارة أو ترقية باقتك، تواصل مباشرة مع فريق سبعة — الدفع الإلكتروني للاشتراكات غير متاح حاليًا في لوحة
                التحكم.
              </p>
            </Card>
          </>
        )}
      </div>
    </AppShell>
  );
}
