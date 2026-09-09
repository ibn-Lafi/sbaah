'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Lead, LeadStatus, Property } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listLeads } from '@/lib/api/leads';
import { listProperties } from '@/lib/api/properties';
import { LEAD_SOURCE_LABELS, LEAD_STATUS_LABELS } from '@/lib/lead/labels';

type Tab = 'pipeline' | 'all';

/**
 * Two tabs, same underlying `leads` table (PRODUCT_SPEC section 4: "شاشة
 * جميع العملاء عرض/تبويب مختلف على نفس الجدول، بلا أي تغيير في نموذج
 * البيانات") — not a separate CRM concept, no new endpoint needed.
 * "لوحة المتابعة" is pipeline-focused (status filter, follow-up date);
 * "جميع العملاء" is a contact directory (no status filter, contact info
 * first) — genuinely different emphasis on the same rows, not a
 * cosmetic duplicate.
 */
export default function LeadsPage() {
  const { me, accessToken } = useCurrentUser();
  const [tab, setTab] = useState<Tab>('pipeline');
  const [leads, setLeads] = useState<Lead[] | null>(null);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [statusFilter, setStatusFilter] = useState<LeadStatus | ''>('');

  useEffect(() => {
    let cancelled = false;
    void listProperties(accessToken).then((result) => {
      if (cancelled) return;
      setProperties(Object.fromEntries(result.properties.map((property) => [property.id, property])));
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    const params = tab === 'pipeline' && statusFilter ? { status: statusFilter } : {};
    void listLeads(accessToken, params).then((result) => {
      if (!cancelled) setLeads(result.leads);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, tab, statusFilter]);

  const canManage = me.user.role !== 'agent';

  return (
    <AppShell
      title="العملاء المحتملون"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-2 rounded-control bg-surface-subtle p-1">
          <button
            type="button"
            onClick={() => setTab('pipeline')}
            className={`h-9 rounded-control px-4 text-sm font-semibold transition-colors ${
              tab === 'pipeline' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'
            }`}
          >
            لوحة المتابعة
          </button>
          <button
            type="button"
            onClick={() => setTab('all')}
            className={`h-9 rounded-control px-4 text-sm font-semibold transition-colors ${
              tab === 'all' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'
            }`}
          >
            جميع العملاء
          </button>
        </div>

        <div className="flex items-center gap-3">
          {tab === 'pipeline' && (
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as LeadStatus | '')} className="w-[200px]">
              <option value="">كل الحالات</option>
              {Object.entries(LEAD_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          )}
          {canManage && (
            <Link href="/leads/new">
              <Button>+ إضافة عميل محتمل</Button>
            </Link>
          )}
        </div>
      </div>

      <Card className="overflow-hidden">
        {leads === null ? (
          <p className="p-6 text-center text-text-secondary">جارٍ التحميل...</p>
        ) : leads.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">لا يوجد عملاء محتملون بعد</p>
        ) : tab === 'pipeline' ? (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">العقار</th>
                <th className="px-5 py-3 font-medium">المصدر</th>
                <th className="px-5 py-3 font-medium">تاريخ المتابعة</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-text-primary hover:text-brand">
                      {lead.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {lead.property_id ? (properties[lead.property_id]?.title_ar ?? lead.property_id) : '—'}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{LEAD_SOURCE_LABELS[lead.source]}</td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {lead.follow_up_at ? new Date(lead.follow_up_at).toLocaleString('en-GB') : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">الجوال</th>
                <th className="px-5 py-3 font-medium">البريد</th>
                <th className="px-5 py-3 font-medium">العقار</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/leads/${lead.id}`} className="font-medium text-text-primary hover:text-brand">
                      {lead.full_name}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {lead.phone ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {lead.email ?? '—'}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {lead.property_id ? (properties[lead.property_id]?.title_ar ?? lead.property_id) : '—'}
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
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
