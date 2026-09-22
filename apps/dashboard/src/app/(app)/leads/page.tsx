'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  LEAD_STATUSES,
  type Lead,
  type LeadStatus,
} from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { CreateLeadForm } from '@/components/leads/create-lead-form';
import { LeadStatusPillSelect } from '@/components/leads/lead-status-pill-select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { PersonAvatar } from '@/components/ui/person-avatar';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { listLeads, updateLead } from '@/lib/api/leads';
import { useLocale } from '@/lib/i18n/locale-context';
import type { PageDictionaries } from '@/lib/i18n/page-dictionaries';
import { formatDate } from '@/lib/format/date';

type StatusFilter = LeadStatus | 'all';

/**
 * جدول موحّد واحد (لا تبويب "لوحة المتابعة/جميع العملاء" — كانا نفس
 * البيانات بتغيير أعمدة فقط)، وتبويبات التصفية هي حالات العميل المحتمل
 * نفسها. عمود الحالة قائمة منسدلة ملوّنة تُحدَّث فورًا دون فتح التفاصيل.
 */
export default function LeadsPage() {
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.leads;
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLeads(null);
    const params = statusFilter === 'all' ? {} : { status: statusFilter };
    void listLeads(accessToken, params).then((result) => {
      if (!cancelled) setLeads(result.leads);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, statusFilter]);

  async function handleStatusChange(leadId: string, status: LeadStatus) {
    const { lead: updated } = await updateLead(accessToken, leadId, { status });
    setLeads(
      (current) =>
        current?.map((lead) => (lead.id === leadId ? { ...lead, ...updated } : lead)) ?? current,
    );
  }

  const canManage = me.user.role !== 'agent';

  return (
    <AppShell
      title={t.list.title}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
          className="w-[140px]"
          compact
        >
          <option value="all">{t.list.statusFilterAll}</option>
          {LEAD_STATUSES.map((status) => (
            <option key={status} value={status}>
              {t.statusLabels[status]}
            </option>
          ))}
        </Select>
        {canManage && <Button onClick={() => setShowCreate(true)}>+ عميل</Button>}
      </div>

      {showCreate && (
        <Modal title={t.createModal.title} onClose={() => setShowCreate(false)} maxWidth="620px" mobileCentered>
          <CreateLeadForm
            accessToken={accessToken}
            onCreated={(lead) => router.push(`/leads/${lead.id}`)}
          />
        </Modal>
      )}

      <Card className="overflow-hidden">
        {leads === null ? (
          <TableSkeleton columns={5} />
        ) : leads.length === 0 ? (
          <p className="text-text-secondary p-6 text-center">{t.list.emptyState}</p>
        ) : (
          <div className="overflow-hidden">
            <table className="w-full table-fixed text-xs sm:text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="w-[52%] px-2 py-3 text-right font-medium sm:w-auto sm:px-3 md:px-4">{t.list.table.name}</th>
                  <th className="hidden px-3 py-3 font-medium sm:table-cell md:px-4">{t.list.table.phone}</th>
                  <th className="hidden px-3 py-3 font-medium lg:table-cell md:px-4">{t.list.table.source}</th>
                  <th className="w-[36%] px-2 py-3 text-right font-medium sm:w-auto sm:px-3 md:px-4">{t.list.table.status}</th>
                  <th className="hidden px-3 py-3 font-medium md:table-cell md:px-4">{t.list.table.nextFollowUp}</th>
                  <th className="w-[12%] px-1 py-3 sm:w-10 sm:px-3" />
                </tr>
              </thead>
              <tbody>
                {leads.map((lead) => {
                  return (
                    <tr
                      key={lead.id}
                      onClick={() => router.push(`/leads/${lead.id}`)}
                      className="border-border-subtle hover:bg-surface-subtle cursor-pointer border-t"
                    >
                      <td className="px-3 py-3 md:px-4">
                        <div className="flex items-center gap-3">
                          <PersonAvatar name={lead.full_name} size={32} />
                          <div className="min-w-0">
                            <Link
                              href={`/leads/${lead.id}`}
                              onClick={(event) => event.stopPropagation()}
                              className="text-text-primary hover:text-brand block truncate font-medium"
                            >
                              {lead.full_name}
                            </Link>
                          </div>
                        </div>
                      </td>
                      <td className="text-text-secondary px-5 py-3" dir="ltr">
                        {lead.phone ?? '—'}
                      </td>
                      <td className="text-text-secondary px-5 py-3">
                        {t.sourceLabels[lead.source]}
                      </td>
                      <td className="px-3 py-3 md:px-4">
                        <LeadStatusPillSelect
                          value={lead.status}
                          onChange={(status) => void handleStatusChange(lead.id, status)}
                        />
                      </td>
                      <td className="text-text-secondary px-5 py-3" dir="ltr">
                        {lead.follow_up_at ? formatDate(lead.follow_up_at) : '—'}
                      </td>
                      <td className="text-text-placeholder px-3 py-3">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          className="h-4 w-4"
                        >
                          <path d="M15 6l-6 6 6 6" />
                        </svg>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
