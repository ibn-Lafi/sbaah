'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BrokerMarketerApplicantType } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { CreateBrokerMarketerForm } from '@/components/applicants/create-broker-marketer-form';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listBrokerMarketerApplications, type BrokerMarketerApplicationWithRelations } from '@/lib/api/broker-applications';
import { formatDate } from '@/lib/format/date';

const TABS: { type: BrokerMarketerApplicantType; label: string }[] = [
  { type: 'broker', label: 'وسيط' },
  { type: 'marketer', label: 'مسوّق' },
];

/**
 * "الوسطاء والمسوقين" — طلبات نموذج website_sections' broker_marketer_form
 * (migration 0032)، تُقرأ من نفس السجلات بتبويب حسب applicant_type، بلا
 * أي فرق بمصدر البيانات (مطابق لأسلوب لوحة المتابعة/جميع العملاء).
 */
export default function ApplicantsPage() {
  const { me, accessToken } = useCurrentUser();
  const [tab, setTab] = useState<BrokerMarketerApplicantType>('broker');
  const [applications, setApplications] = useState<BrokerMarketerApplicationWithRelations[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const canManage = me.user.role !== 'agent';

  useEffect(() => {
    let cancelled = false;
    setApplications(null);
    void listBrokerMarketerApplications(accessToken, { applicant_type: tab }).then((result) => {
      if (!cancelled) setApplications(result.applications);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, tab, refreshKey]);

  function handleCreated(application: BrokerMarketerApplicationWithRelations) {
    setShowCreate(false);
    if (application.applicant_type === tab) {
      setRefreshKey((key) => key + 1);
    } else {
      setTab(application.applicant_type);
    }
  }

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

      {canManage && (
        <div className="mb-5 flex justify-end">
          <Button onClick={() => setShowCreate(true)}>+ إضافة</Button>
        </div>
      )}

      {showCreate && (
        <Modal title="إضافة وسيط أو مسوّق" onClose={() => setShowCreate(false)}>
          <CreateBrokerMarketerForm accessToken={accessToken} onCreated={handleCreated} />
        </Modal>
      )}

      <Card className="overflow-hidden">
        {applications === null ? (
          <TableSkeleton columns={4} />
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <p className="text-text-secondary">لا يوجد {tab === 'broker' ? 'وسطاء' : 'مسوّقون'} بعد</p>
            <p className="text-xs text-text-placeholder">
              فعّل قسم &quot;نموذج الوسطاء والمسوقين&quot; من{' '}
              <Link href="/site/editor" className="text-brand hover:underline">
                محرر الموقع
              </Link>{' '}
              ليتمكن المهتمون من التقديم.
            </p>
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
