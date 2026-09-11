'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LEAD_STATUSES, type District, type Lead, type LeadStatus, type Property } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { CreateLeadForm } from '@/components/leads/create-lead-form';
import { LeadStatusPillSelect } from '@/components/leads/lead-status-pill-select';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { PersonAvatar } from '@/components/ui/person-avatar';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listLeads, updateLead } from '@/lib/api/leads';
import { listProperties } from '@/lib/api/properties';
import { listDistricts } from '@/lib/api/reference-data';
import { PROPERTY_TYPE_LABELS } from '@/lib/property/labels';
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from '@/lib/lead/labels';
import { formatDate } from '@/lib/format/date';

type StatusFilter = LeadStatus | 'all';

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'الكل' },
  ...LEAD_STATUSES.map((status) => ({ value: status, label: LEAD_STATUS_LABELS[status] })),
];

function propertySubtitle(property: Property | undefined, districts: Record<string, District>): string | null {
  if (!property) return null;
  const typeLabel = PROPERTY_TYPE_LABELS[property.property_type];
  const district = property.district_id ? districts[property.district_id] : undefined;
  return district ? `${typeLabel} · حي ${district.name_ar}` : typeLabel;
}

/**
 * جدول موحّد واحد (لا تبويب "لوحة المتابعة/جميع العملاء" — كانا نفس
 * البيانات بتغيير أعمدة فقط)، وتبويبات التصفية هي حالات العميل المحتمل
 * نفسها. عمود الحالة قائمة منسدلة ملوّنة تُحدَّث فورًا دون فتح التفاصيل.
 */
export default function LeadsPage() {
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [districts, setDistricts] = useState<Record<string, District>>({});
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listProperties(accessToken).then((result) => {
      if (cancelled) return;
      setProperties(Object.fromEntries(result.properties.map((property) => [property.id, property])));
    });
    void listDistricts().then((result) => {
      if (cancelled) return;
      setDistricts(Object.fromEntries(result.map((district) => [district.id, district])));
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

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
    setLeads((current) => current?.map((lead) => (lead.id === leadId ? { ...lead, ...updated } : lead)) ?? current);
  }

  const canManage = me.user.role !== 'agent';

  return (
    <AppShell
      title="إدارة العملاء"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mb-5 flex items-center justify-between gap-4">
        <div className="flex flex-1 items-center gap-2 overflow-x-auto">
          {FILTERS.map((filter) => (
            <button
              key={filter.value}
              type="button"
              onClick={() => setStatusFilter(filter.value)}
              className={`h-[36px] flex-none rounded-full px-4 text-[13px] font-medium transition-colors ${
                statusFilter === filter.value
                  ? 'bg-brand text-white'
                  : 'border border-border-default bg-surface-card text-text-secondary hover:border-text-placeholder'
              }`}
            >
              {filter.label}
            </button>
          ))}
        </div>
        {canManage && (
          <Button onClick={() => setShowCreate(true)} className="flex-none">
            + إضافة عميل محتمل
          </Button>
        )}
      </div>

      {showCreate && (
        <Modal title="إضافة عميل محتمل" onClose={() => setShowCreate(false)}>
          <CreateLeadForm accessToken={accessToken} onCreated={(lead) => router.push(`/leads/${lead.id}`)} />
        </Modal>
      )}

      <Card className="overflow-hidden">
        {leads === null ? (
          <TableSkeleton columns={5} />
        ) : leads.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">لا يوجد عملاء محتملون بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">العميل</th>
                <th className="px-5 py-3 font-medium">الجوال</th>
                <th className="px-5 py-3 font-medium">المصدر</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium">المتابعة القادمة</th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => {
                const property = lead.property_id ? properties[lead.property_id] : undefined;
                const subtitle = propertySubtitle(property, districts);
                return (
                  <tr
                    key={lead.id}
                    onClick={() => router.push(`/leads/${lead.id}`)}
                    className="cursor-pointer border-t border-border-subtle hover:bg-surface-subtle"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <PersonAvatar name={lead.full_name} size={32} />
                        <div className="min-w-0">
                          <Link
                            href={`/leads/${lead.id}`}
                            onClick={(event) => event.stopPropagation()}
                            className="block truncate font-medium text-text-primary hover:text-brand"
                          >
                            {lead.full_name}
                          </Link>
                          {subtitle && <p className="truncate text-xs text-text-secondary">{subtitle}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-text-secondary" dir="ltr">
                      {lead.phone ?? '—'}
                    </td>
                    <td className="px-5 py-3 text-text-secondary">{LEAD_SOURCE_LABELS[lead.source]}</td>
                    <td className="px-5 py-3">
                      <LeadStatusPillSelect value={lead.status} onChange={(status) => void handleStatusChange(lead.id, status)} />
                    </td>
                    <td className="px-5 py-3 text-text-secondary" dir="ltr">
                      {lead.follow_up_at ? formatDate(lead.follow_up_at) : '—'}
                    </td>
                    <td className="px-3 py-3 text-text-placeholder">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                        <path d="M15 6l-6 6 6 6" />
                      </svg>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
