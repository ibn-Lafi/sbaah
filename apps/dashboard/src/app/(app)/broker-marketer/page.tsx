'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { BrokerMarketerApplicantType } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { CreateBrokerMarketerForm } from '@/components/broker-marketer/create-broker-marketer-form';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import {
  listBrokerMarketerApplications,
  type BrokerMarketerApplicationWithRelations,
} from '@/lib/api/broker-marketer';
import { formatDate } from '@/lib/format/date';

/**
 * "الوسطاء والمسوقين" — طلبات نموذج website_sections' broker_marketer_form
 * (migration 0032)، تُقرأ من نفس السجلات بتبويب حسب applicant_type، بلا
 * أي فرق بمصدر البيانات (مطابق لأسلوب لوحة المتابعة/جميع العملاء).
 */
export default function BrokerMarketerPage() {
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.brokerMarketer;
  const TABS: { value: BrokerMarketerApplicantType; label: string }[] = [
    { value: 'broker', label: t.tabs.broker },
    { value: 'marketer', label: t.tabs.marketer },
  ];
  const [tab, setTab] = useState<BrokerMarketerApplicantType>('broker');
  const [applications, setApplications] = useState<BrokerMarketerApplicationWithRelations[] | null>(
    null,
  );
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
    <AppShell
      title={t.pageTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="mb-5">
        <SegmentedToggle className="mx-auto max-w-[320px]" value={tab} onChange={setTab} options={TABS} />
      </div>

      {canManage && (
        <div className="mb-5 flex justify-end">
          <Button onClick={() => setShowCreate(true)}>{t.addButton}</Button>
        </div>
      )}

      {showCreate && (
        <Modal title={t.createModalTitle} onClose={() => setShowCreate(false)}>
          <CreateBrokerMarketerForm accessToken={accessToken} onCreated={handleCreated} />
        </Modal>
      )}

      <Card className="overflow-hidden">
        {applications === null ? (
          <TableSkeleton columns={4} />
        ) : applications.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <p className="text-text-secondary">{t.emptyState.noneYet(tab)}</p>
            <p className="text-text-placeholder text-xs">
              {t.emptyState.hintPrefix}{' '}
              <Link href="/website/editor" className="text-brand hover:underline">
                {t.emptyState.hintLink}
              </Link>{' '}
              {t.emptyState.hintSuffix}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto md:overflow-visible">
            <table className="w-full min-w-[580px] table-fixed text-sm md:min-w-0">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-3 py-3 md:px-4 font-medium">{t.table.name}</th>
                  <th className="px-3 py-3 md:px-4 font-medium">{t.table.city}</th>
                  <th className="px-3 py-3 md:px-4 font-medium">{t.table.falLicense}</th>
                  <th className="px-3 py-3 md:px-4 font-medium">{t.table.property}</th>
                  <th className="px-3 py-3 md:px-4 font-medium">{t.table.date}</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => (
                  <tr key={application.id} className="border-border-subtle border-t">
                    <td className="text-text-primary px-5 py-3 font-medium">
                      {application.full_name}
                    </td>
                    <td className="text-text-secondary px-5 py-3">
                      {application.cities?.name_ar ?? '—'}
                    </td>
                    <td className="text-text-secondary px-5 py-3" dir="ltr">
                      {application.fal_license_number}
                    </td>
                    <td className="text-text-secondary px-5 py-3">
                      {application.properties ? (
                        <Link
                          href={`/properties/${application.properties.id}`}
                          className="text-brand hover:underline"
                        >
                          {application.properties.title_ar}
                        </Link>
                      ) : (
                        t.table.generalApplication
                      )}
                    </td>
                    <td className="text-text-secondary px-5 py-3" dir="ltr">
                      {formatDate(application.created_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
