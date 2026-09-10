'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { LoadingState } from '@/components/ui/loading-state';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { getDashboardSummary, type DashboardSummary } from '@/lib/api/dashboard';
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from '@/lib/lead/labels';

const WEEKDAY_AR = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

function dayLabel(dateIso: string, range: 7 | 30): string {
  const d = new Date(dateIso + 'T00:00:00Z');
  return range === 7 ? (WEEKDAY_AR[d.getUTCDay()] ?? '') : String(d.getUTCDate());
}

function KpiCard({ label, value, delta, deltaTone }: { label: string; value: string; delta: string; deltaTone: 'success' | 'warning' | 'muted' }) {
  const deltaClass = deltaTone === 'success' ? 'text-success' : deltaTone === 'warning' ? 'text-warning' : 'text-text-secondary';
  return (
    <div className="flex flex-col gap-2.5 rounded-[18px] bg-surface-card p-5 shadow-[0_2px_12px_rgba(31,29,34,.06)]">
      <span className="text-[13px] text-text-secondary">{label}</span>
      <span className="text-[30px] font-bold leading-none text-text-primary" dir="ltr">
        {value}
      </span>
      <span className={`text-xs font-medium ${deltaClass}`}>{delta}</span>
    </div>
  );
}

export default function DashboardHomePage() {
  const { me, accessToken } = useCurrentUser();
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => {
    void getDashboardSummary(accessToken).then(setSummary);
  }, [accessToken]);

  const bars = summary?.property_views ? summary.property_views.daily.slice(-range) : [];
  const maxCount = Math.max(1, ...bars.map((b) => b.count));

  return (
    <AppShell title="لوحة القيادة" orgName={me.tenant.name_ar} accountType={me.tenant.account_type} roleLabel={ROLE_LABELS[me.user.role]}>
      {summary === null ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label="العقارات المنشورة"
              value={summary.properties.published.toLocaleString('en-US')}
              delta={`+${summary.properties.published_this_month} هذا الشهر`}
              deltaTone="success"
            />
            <KpiCard
              label="المشاهدات (٣٠ يومًا)"
              value={summary.property_views ? summary.property_views.total.toLocaleString('en-US') : '—'}
              delta={
                summary.property_views?.delta_pct !== null && summary.property_views?.delta_pct !== undefined
                  ? `${summary.property_views.delta_pct >= 0 ? '+' : ''}${summary.property_views.delta_pct}% مقابل الأسبوع السابق`
                  : 'لا تتوفر بيانات كافية بعد'
              }
              deltaTone={summary.property_views && (summary.property_views.delta_pct ?? 0) >= 0 ? 'success' : 'warning'}
            />
            <KpiCard
              label="العملاء المحتملون"
              value={summary.leads.total.toLocaleString('en-US')}
              delta={`+${summary.leads.this_month} هذا الشهر`}
              deltaTone="warning"
            />
            <KpiCard label="معدل التحويل" value={`${summary.leads.conversion_rate}%`} delta="من إجمالي العملاء المحتملين" deltaTone="muted" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-[18px] rounded-[18px] bg-surface-card p-[22px] shadow-[0_2px_12px_rgba(31,29,34,.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">المشاهدات</h2>
                {summary.property_views && (
                  <div className="flex gap-0.5 rounded-full bg-surface-subtle-3 p-[3px]">
                    {([7, 30] as const).map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRange(r)}
                        className={`rounded-full px-3.5 py-1.5 text-xs font-medium ${
                          range === r ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'
                        }`}
                      >
                        {r === 7 ? '٧ أيام' : '٣٠ يومًا'}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {summary.property_views ? (
                <div className="flex h-[240px] items-end gap-1.5">
                  {bars.map((b) => (
                    <div key={b.date} className="flex h-full flex-1 flex-col items-center justify-end gap-2">
                      {range === 7 && <span className="text-[11px] font-medium text-text-secondary">{b.count}</span>}
                      <div
                        className="w-full rounded-t-lg bg-brand"
                        style={{ height: `${Math.max(3, (b.count / maxCount) * 100)}%` }}
                        title={`${b.date}: ${b.count}`}
                      />
                      <span className="text-[11px] text-text-placeholder">{dayLabel(b.date, range)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">إحصائيات المشاهدات غير متاحة لصلاحيتك.</p>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-[18px] bg-surface-card p-[22px] shadow-[0_2px_12px_rgba(31,29,34,.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">آخر العملاء المحتملين</h2>
                <Link href="/leads" className="text-xs font-semibold text-brand">
                  عرض الكل
                </Link>
              </div>
              {summary.latest_leads.length === 0 ? (
                <p className="text-sm text-text-secondary">لا يوجد عملاء محتملون بعد.</p>
              ) : (
                <div className="flex flex-col">
                  {summary.latest_leads.map((lead) => (
                    <Link
                      key={lead.id}
                      href={`/leads/${lead.id}`}
                      className="flex items-center gap-[11px] border-b border-surface-subtle py-2.5 last:border-0"
                    >
                      <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-full bg-brand-surface text-[13px] font-semibold text-brand">
                        {lead.full_name.trim().charAt(0)}
                      </span>
                      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                        <span className="truncate text-[13px] font-medium text-text-primary">{lead.full_name}</span>
                        <span className="text-[11px] text-text-secondary">{LEAD_SOURCE_LABELS[lead.source]}</span>
                      </div>
                      <Badge status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
