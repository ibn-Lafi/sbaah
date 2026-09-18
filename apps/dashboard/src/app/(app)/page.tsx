'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { DashboardHomeSkeleton } from '@/components/dashboard/dashboard-home-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { getDashboardSummary, type DashboardSummary } from '@/lib/api/dashboard';
import { useLocale } from '@/lib/i18n/locale-context';

function dayLabel(dateIso: string, range: 7 | 30, weekdayShort: readonly string[]): string {
  const d = new Date(dateIso + 'T00:00:00Z');
  return range === 7 ? (weekdayShort[d.getUTCDay()] ?? '') : String(d.getUTCDate());
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
  const { pages } = useLocale();
  const t = pages.dashboardHome;
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [range, setRange] = useState<7 | 30>(7);

  useEffect(() => {
    void getDashboardSummary(accessToken).then(setSummary);
  }, [accessToken]);

  const setupTasks = [
    { label: 'أكمل بيانات المنشأة', href: '/settings?tab=organization', done: Boolean(me.tenant.fal_license_number) },
    { label: 'أضف أول عقار', href: '/properties', done: (summary?.properties.total ?? 0) > 0 },
    { label: 'أضف معلومات التواصل', href: '/settings?tab=contact', done: Boolean(me.tenant.social_whatsapp || me.tenant.social_instagram || me.tenant.social_tiktok || me.tenant.social_snapchat || me.tenant.social_facebook || me.tenant.social_x || me.tenant.social_telegram) },
    { label: 'خصّص موقعك العقاري', href: '/website/editor', done: false },
  ];
  const completedSetup = setupTasks.filter((task) => task.done).length;
  const bars = summary?.property_views ? summary.property_views.daily.slice(-range) : [];
  const maxCount = Math.max(1, ...bars.map((b) => b.count));

  return (
    <AppShell title={t.title} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      {summary === null ? (
        <DashboardHomeSkeleton />
      ) : (
        <div className="flex flex-col gap-5">
          {completedSetup < setupTasks.length && (
            <section className="rounded-[22px] border border-border-subtle bg-surface-card p-5 shadow-[0_2px_12px_rgba(31,29,34,.06)]">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-medium text-text-secondary">ابدأ بخطوات بسيطة</p>
                  <h2 className="mt-1 text-lg font-bold text-text-primary">جهّز مكتبك العقاري 🚀</h2>
                </div>
                <strong className="text-sm text-brand" dir="ltr">{completedSetup}/{setupTasks.length}</strong>
              </div>
              <div className="mb-4 h-2 overflow-hidden rounded-full bg-surface-subtle-3">
                <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${(completedSetup / setupTasks.length) * 100}%` }} />
              </div>
              <div className="flex flex-col gap-2">
                {setupTasks.map((task, index) => (
                  <Link key={task.label} href={task.href} className="flex min-h-14 items-center justify-between rounded-2xl border border-border-subtle px-4 py-3 transition-colors hover:border-brand/40 hover:bg-brand/[.04]">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${task.done ? 'bg-brand text-white' : 'bg-brand/[.09] text-brand'}`}>{task.done ? '✓' : index + 1}</span>
                      <span className={`text-sm font-semibold ${task.done ? 'text-text-secondary line-through' : 'text-text-primary'}`}>{task.label}</span>
                    </div>
                    <span className="text-lg text-brand" aria-hidden="true">←</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <KpiCard
              label={t.kpis.publishedProperties}
              value={summary.properties.published.toLocaleString('en-US')}
              delta={t.kpis.publishedThisMonth(summary.properties.published_this_month)}
              deltaTone="success"
            />
            <KpiCard
              label={t.kpis.views}
              value={summary.property_views ? summary.property_views.total.toLocaleString('en-US') : '—'}
              delta={
                summary.property_views?.delta_pct !== null && summary.property_views?.delta_pct !== undefined
                  ? t.kpis.viewsDelta(summary.property_views.delta_pct)
                  : t.kpis.viewsNotEnoughData
              }
              deltaTone={summary.property_views && (summary.property_views.delta_pct ?? 0) >= 0 ? 'success' : 'warning'}
            />
            <KpiCard
              label={t.kpis.leads}
              value={summary.leads.total.toLocaleString('en-US')}
              delta={t.kpis.leadsThisMonth(summary.leads.this_month)}
              deltaTone="warning"
            />
            <KpiCard label={t.kpis.conversionRate} value={`${summary.leads.conversion_rate}%`} delta={t.kpis.ofAllLeads} deltaTone="muted" />
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
            <div className="flex flex-col gap-[18px] rounded-[18px] bg-surface-card p-[22px] shadow-[0_2px_12px_rgba(31,29,34,.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">{t.viewsChart.title}</h2>
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
                        {r === 7 ? t.viewsChart.range7Days : t.viewsChart.range30Days}
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
                      <span className="text-[11px] text-text-placeholder">{dayLabel(b.date, range, t.weekdayShort)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-text-secondary">{t.viewsChart.unavailable}</p>
              )}
            </div>

            <div className="flex flex-col gap-3 rounded-[18px] bg-surface-card p-[22px] shadow-[0_2px_12px_rgba(31,29,34,.06)]">
              <div className="flex items-center justify-between">
                <h2 className="text-base font-semibold text-text-primary">{t.latestLeads.title}</h2>
                <Link href="/leads" className="text-xs font-semibold text-brand">
                  {t.latestLeads.viewAll}
                </Link>
              </div>
              {summary.latest_leads.length === 0 ? (
                <p className="text-sm text-text-secondary">{t.latestLeads.emptyState}</p>
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
                        <span className="text-[11px] text-text-secondary">{pages.leads.sourceLabels[lead.source]}</span>
                      </div>
                      <Badge status={lead.status} label={pages.leads.statusLabels[lead.status]} />
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
