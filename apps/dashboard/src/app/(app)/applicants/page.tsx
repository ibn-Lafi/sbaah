'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BrokerMarketerApplicantType } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listBrokerMarketerApplications, type BrokerMarketerApplicationWithRelations } from '@/lib/api/broker-applications';

const TABS: { type: BrokerMarketerApplicantType; label: string }[] = [
  { type: 'broker', label: 'وسيط' },
  { type: 'marketer', label: 'مسوّق' },
];

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB');
}

/**
 * "الوسطاء والمسوقين" — طلبات نموذج website_sections' broker_marketer_form
 * (migration 0032)، تُقرأ من نفس السجلات بتبويب حسب applicant_type، بلا
 * أي فرق بمصدر البيانات (مطابق لأسلوب لوحة المتابعة/جميع العملاء).
 */
export default function ApplicantsPage() {
  const { me, accessToken } = useCurrentUser();
  const [tab, setTab] = useState<BrokerMarketerApplicantType>('broker');
  const [applications, setApplications] = useState<BrokerMarketerApplicationWithRelations[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    setApplications(null);
    void listBrokerMarketerApplications(accessToken, { applicant_type: tab }).then((result) => {
      if (!cancelled) setApplications(result.applications);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, tab]);

  return (
    <AppShell title="الوسطاء والمسوقين" orgName={me.tenant.name_ar} accountType={me.tenant.account_type} roleLabel={ROLE_LABELS[me.user.role]}>
      <div className="mb-5">
        <div className="mx-auto flex max-w-[640px] items-center justify-center gap-0.5 rounded-full bg-surface-card p-[5px] shadow-[0_1px_6px_rgba(31,29,34,.08)]">
          {TABS.map((item) => (
            <button
              key={item.type}
              type="button"
              onClick={() => setTab(item.type)}
              className={`flex h-[34px] flex-1 items-center justify-center rounded-full px-[18px] text-[13px] ${
                tab === item.type ? 'bg-brand-surface font-semibold text-brand' : 'font-normal text-text-secondary'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <Card className="overflow-hidden">
        {applications === null ? (
          <TableSkeleton columns={4} />
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center gap-[18px] px-10 py-[72px] text-center">
            <div
              className="h-[88px] w-[120px] rounded-[16px] border border-dashed border-border-secondary"
              style={{ background: 'repeating-linear-gradient(135deg, #FBFAFC 0 8px, #F2F0F4 8px 16px)' }}
            />
            <div className="flex max-w-[420px] flex-col gap-2">
              <h2 className="text-xl font-semibold text-text-primary">
                لا يوجد {tab === 'broker' ? 'وسطاء' : 'مسوّقون'} بعد
              </h2>
              <p className="text-sm leading-[1.75] text-text-secondary">
                فعّل قسم &quot;نموذج الوسطاء والمسوقين&quot; من محرر الموقع ليتمكن المهتمون من التقديم، وستظهر طلباتهم هنا.
              </p>
            </div>
            <Link
              href="/site/editor"
              className="rounded-input border border-border-default bg-surface-card px-6 py-3 text-sm font-medium text-text-primary hover:bg-surface-subtle"
            >
              محرر الموقع
            </Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">المدينة</th>
                <th className="px-5 py-3 font-medium">رخصة فال</th>
                <th className="px-5 py-3 font-medium">العقار</th>
                <th className="px-5 py-3 font-medium">التاريخ</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3 font-medium text-text-primary">{application.full_name}</td>
                  <td className="px-5 py-3 text-text-secondary">{application.cities?.name_ar ?? '—'}</td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {application.fal_license_number}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {application.properties ? (
                      <Link href={`/properties/${application.properties.id}`} className="text-brand hover:underline">
                        {application.properties.title_ar}
                      </Link>
                    ) : (
                      'طلب عام'
                    )}
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {formatDate(application.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
