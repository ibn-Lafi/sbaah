'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getDashboardSummary, type DashboardSummary } from '@/lib/api/dashboard';
import { LEAD_SOURCE_LABELS } from '@/lib/lead/labels';

function KpiCard({ label, value, href, tone }: { label: string; value: number; href: string; tone?: 'danger' }) {
  return (
    <Link href={href}>
      <Card className="flex flex-col gap-1 p-6 transition-shadow hover:shadow-[0_2px_16px_rgba(31,29,34,.1)]">
        <span className="text-sm text-text-secondary">{label}</span>
        <span className={`text-3xl font-bold ${tone === 'danger' && value > 0 ? 'text-danger' : 'text-text-primary'}`} dir="ltr">
          {value.toLocaleString('en-US')}
        </span>
      </Card>
    </Link>
  );
}

export default function DashboardHomePage() {
  const { me, accessToken } = useCurrentUser();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);

  useEffect(() => {
    void getDashboardSummary(accessToken).then(setSummary);
  }, [accessToken]);

  return (
    <AppShell
      title="لوحة القيادة"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <p className="mb-6 text-lg text-text-primary">مرحبًا {me.user.full_name}</p>

      {summary === null ? (
        <p className="text-text-secondary">جارٍ التحميل...</p>
      ) : (
        <div className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <KpiCard label="العقارات المنشورة" value={summary.properties.published} href="/properties" />
            <KpiCard label="إجمالي العقارات" value={summary.properties.total} href="/properties" />
            <KpiCard label="العملاء المحتملون" value={summary.leads.total} href="/leads" />
            <KpiCard label="متابعات متأخرة" value={summary.leads.overdue_follow_ups} href="/leads" tone="danger" />
          </div>

          {summary.property_views && (
            <KpiCard label="مشاهدات العقارات (إجمالي)" value={summary.property_views.total} href="/properties" />
          )}

          <Card className="p-6">
            <h2 className="mb-4 text-base font-semibold text-text-primary">مصادر العملاء المحتملين</h2>
            {summary.leads.total === 0 ? (
              <p className="text-sm text-text-secondary">لا يوجد عملاء محتملون بعد.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {Object.entries(summary.leads.by_source).map(([source, count]) => {
                  const pct = summary.leads.total > 0 ? Math.round((count / summary.leads.total) * 100) : 0;
                  return (
                    <li key={source} className="flex items-center gap-3 text-sm">
                      <span className="w-28 flex-none text-text-secondary">
                        {LEAD_SOURCE_LABELS[source as keyof typeof LEAD_SOURCE_LABELS]}
                      </span>
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-subtle">
                        <div className="h-full bg-brand" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="w-10 flex-none text-left font-medium text-text-primary" dir="ltr">
                        {count}
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>
        </div>
      )}
    </AppShell>
  );
}
