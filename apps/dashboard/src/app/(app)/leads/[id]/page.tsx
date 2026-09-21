'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LEAD_STATUSES } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { BackButton } from '@/components/ui/back-button';
import { Card } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { DeleteButton } from '@/components/ui/delete-button';
import { PersonAvatar } from '@/components/ui/person-avatar';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { deleteLead, getLead, updateLead, type Customer360Snapshot, type LeadWithNotes } from '@/lib/api/leads';
import { listTeam, type TeamMember } from '@/lib/api/team';
import { ApiRequestError } from '@/lib/api/client';
import { datetimeLocalToIso, isoToDatetimeLocal } from '@/lib/lead/datetime';
import { useLocale } from '@/lib/i18n/locale-context';
import { LeadRequirements } from '@/components/crm/lead-requirements';
import { Customer360Overview } from '@/components/crm/customer-360-overview';
import { CustomerQuickActions } from '@/components/crm/customer-quick-actions';
import { CustomerJourney3D } from '@/components/crm/customer-journey-3d';

// Matches Button's h-[46px] — these are <a> tags (tel:/WhatsApp deep links), not <button>s, so they can't use the Button component itself, but should still line up with it.
const ACTION_LINK_CLASSES =
  'rounded-control inline-flex h-[46px] flex-1 items-center justify-center gap-2 text-sm font-semibold transition-colors';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.leads;
  const [lead, setLead] = useState<LeadWithNotes | null>(null);
  const [customer360, setCustomer360] = useState<Customer360Snapshot | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getLead(accessToken, id)
      .then(({ lead: loaded, customer360: snapshot }) => {
        if (cancelled) return;
        setLead(loaded);
        setCustomer360(snapshot);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  const canManage = me.user.role !== 'agent';

  useEffect(() => {
    if (canManage) {
      void listTeam(accessToken).then((result) => setTeam(result.members));
    }
  }, [accessToken, canManage]);

  async function saveAssignedAgent(assignedAgentId: string) {
    setError(null);
    try {
      const { lead: updated } = await updateLead(accessToken, id, { assigned_agent_id: assignedAgentId || null });
      setLead((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.detail.errors.saveAgent);
    }
  }

  async function saveStatus(status: string) {
    setError(null);
    try {
      const { lead: updated } = await updateLead(accessToken, id, { status: status as (typeof LEAD_STATUSES)[number] });
      setLead((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.detail.errors.saveStatus);
    }
  }

  async function saveFollowUp(localValue: string) {
    setError(null);
    try {
      const { lead: updated } = await updateLead(accessToken, id, { follow_up_at: datetimeLocalToIso(localValue) });
      setLead((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.detail.errors.saveFollowUp);
    }
  }

  async function refreshCustomer360() {
    const result = await getLead(accessToken, id);
    setLead(result.lead);
    setCustomer360(result.customer360);
  }

  async function handleDelete() {
    try {
      await deleteLead(accessToken, id);
      router.push('/leads');
    } catch (err) {
      throw new Error(err instanceof ApiRequestError ? err.message : t.detail.errors.delete);
    }
  }

  if (notFound) {
    return (
      <AppShell
        title={t.detail.notFoundTitle}
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
      >
        <p className="text-text-secondary">{t.detail.notFoundMessage}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={lead?.full_name ?? t.detail.defaultTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      {!lead ? (
        <FormPageSkeleton fields={4} extraCards={1} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <BackButton href="/leads" label={t.detail.backLabel} />
            {canManage && (
              <DeleteButton
                label={t.detail.deleteLabel}
                confirmTitle={t.detail.deleteConfirmTitle}
                confirmMessage={t.detail.deleteConfirmMessage}
                onConfirm={handleDelete}
              />
            )}
          </div>

          <FormError message={error} />

          <Card className="p-4 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <PersonAvatar name={lead.full_name} size={56} />
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-lg font-semibold text-text-primary">{lead.full_name}</h2>
                    {customer360?.party && <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs text-text-secondary">عميل Rent Plus</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-sm text-text-secondary">
                    <span dir="ltr">{lead.phone ?? 'بدون رقم جوال'}</span>
                    {lead.email && <span>{lead.email}</span>}
                    <span>{t.sourceLabels[lead.source]}</span>
                  </div>
                </div>
              </div>

              {lead.phone && (
                <div className="grid w-full grid-cols-2 gap-2 lg:w-auto lg:min-w-[260px]">
                  <a href={`tel:${lead.phone}`} className={`${ACTION_LINK_CLASSES} bg-brand text-white hover:bg-brand-hover`}>{t.detail.callAction}</a>
                  <a href={`https://wa.me/${lead.phone.replace(/^\+/, '')}`} target="_blank" rel="noreferrer" className={`${ACTION_LINK_CLASSES} border border-border-default bg-surface-card text-text-primary hover:bg-surface-subtle`}>{t.detail.whatsappAction}</a>
                </div>
              )}
            </div>

            <details className="mt-5 border-t border-border-subtle pt-4">
              <summary className="cursor-pointer select-none text-sm font-semibold text-text-primary">إدارة بيانات العميل <span className="ms-1 text-xs font-normal text-text-secondary">الحالة، المتابعة، المسؤول والمصدر</span></summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                <div className="flex flex-col gap-1"><label className="text-xs text-text-secondary">{t.detail.statusLabel}</label><Select value={lead.status} onChange={(e) => void saveStatus(e.target.value)}>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{t.statusLabels[status]}</option>)}</Select></div>
                <div className="flex flex-col gap-1"><label className="text-xs text-text-secondary">{t.detail.followUpLabel}</label><DateTimePicker value={isoToDatetimeLocal(lead.follow_up_at)} onChange={(value) => void saveFollowUp(value)} /></div>
                {canManage && <div className="flex flex-col gap-1"><label className="text-xs text-text-secondary">{t.detail.assignedAgentLabel}</label><Select value={lead.assigned_agent_id ?? ''} onChange={(e) => void saveAssignedAgent(e.target.value)}><option value="">{t.detail.noAgent}</option>{team.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</Select></div>}
                <div className="flex flex-col gap-1"><label className="text-xs text-text-secondary">مصدر العميل</label><p className="rounded-input border border-border-default px-3 py-3 text-sm text-text-primary">{t.sourceLabels[lead.source]}</p></div>
              </div>
            </details>
          </Card>

          <div className="flex items-center justify-between gap-3 rounded-card border border-border-subtle bg-surface-card p-3 md:p-4"><div className="min-w-0"><p className="text-sm font-semibold text-text-primary">ماذا تريد أن تفعل؟</p><p className="mt-0.5 hidden text-xs text-text-secondary sm:block">المتابعة والمهمة والمعاينة والملاحظة من مكان واحد.</p></div><CustomerQuickActions leadId={id} accessToken={accessToken} currentUserId={me.user.id} onChanged={refreshCustomer360} /></div>

          {customer360 && <CustomerJourney3D lead={lead} data={customer360} />}

          {customer360 && <Customer360Overview lead={lead} data={customer360} />}

          <LeadRequirements leadId={id} accessToken={accessToken} />
        </div>
      )}
    </AppShell>
  );
}
