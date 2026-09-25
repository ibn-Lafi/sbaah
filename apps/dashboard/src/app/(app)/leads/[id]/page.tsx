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
import { DetailLoadError } from '@/components/ui/detail-load-error';
import { FormError } from '@/components/ui/form-error';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { deleteLead, getLead, updateLead, type Customer360Snapshot, type LeadWithNotes } from '@/lib/api/leads';
import { ApiRequestError, isNotFoundError } from '@/lib/api/client';
import { datetimeLocalToIso, isoToDatetimeLocal } from '@/lib/lead/datetime';
import { useLocale } from '@/lib/i18n/locale-context';
import { Customer360Overview, type CustomerDetailTab } from '@/components/crm/customer-360-overview';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { CustomerQuickActions } from '@/components/crm/customer-quick-actions';
import { LeadRequirements } from '@/components/crm/lead-requirements';
import { LeadRealEstateInterests } from '@/components/crm/lead-real-estate-interests';

// Matches Button's h-[46px] — these are <a> tags (tel:/WhatsApp deep links), not <button>s, so they can't use the Button component itself, but should still line up with it.
const ACTION_LINK_CLASSES =
  'rounded-control inline-flex h-10 flex-1 items-center justify-center gap-1.5 text-xs font-semibold transition-colors md:h-[46px] md:text-sm';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.leads;
  const [lead, setLead] = useState<LeadWithNotes | null>(null);
  const [customer360, setCustomer360] = useState<Customer360Snapshot | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<CustomerDetailTab>('overview');

  useEffect(() => {
    let cancelled = false;
    getLead(accessToken, id)
      .then(({ lead: loaded, customer360: snapshot }) => {
        if (cancelled) return;
        setLead(loaded);
        setCustomer360(snapshot);
        setNotFound(false);
        setLoadError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        if (isNotFoundError(err)) setNotFound(true);
        else setLoadError(err instanceof ApiRequestError ? err.message : t.detail.errors.load);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id, retryKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const canManage = me.user.role !== 'agent';
  const isProspect = customer360?.customer_kind === 'prospect';

  useEffect(() => {
    if (canManage) {
    }
  }, [accessToken, canManage]);
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

  if (loadError) {
    return (
      <AppShell title={t.detail.defaultTitle} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
        <DetailLoadError message={loadError} retryLabel={t.detail.retry} onRetry={() => setRetryKey((value) => value + 1)} />
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

          <Card className="p-3 md:p-6">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="scale-[.86] md:scale-100"><PersonAvatar name={lead.full_name} size={56} /></div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="truncate text-base font-semibold text-text-primary md:text-lg">{lead.full_name}</h2>
                    {customer360 && <span className="rounded-full bg-surface-subtle px-2.5 py-1 text-xs text-text-secondary">{isProspect ? 'عميل محتمل' : 'عميل'}</span>}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-x-2 gap-y-0.5 text-xs text-text-secondary md:gap-x-3 md:text-sm">
                    <span dir="ltr">{lead.phone ?? 'بدون رقم جوال'}</span>
                    {lead.email && <span>{lead.email}</span>}
                    <span>{t.sourceLabels[lead.source]}</span>
                  </div>
                </div>
              </div>

              <div className="grid w-full grid-cols-2 gap-1.5 lg:w-auto lg:min-w-[240px] lg:gap-2">
                {lead.phone?<a href={`tel:${lead.phone}`} className={`${ACTION_LINK_CLASSES} bg-brand text-white hover:bg-brand-hover`}>{t.detail.callAction}</a>:<span className={`${ACTION_LINK_CLASSES} cursor-not-allowed bg-surface-subtle text-text-tertiary`}>اتصال</span>}
                {lead.phone?<a href={`https://wa.me/${lead.phone.replace(/^\+/, '')}`} target="_blank" rel="noreferrer" className={`${ACTION_LINK_CLASSES} border border-border-default bg-surface-card text-text-primary hover:bg-surface-subtle`}>{t.detail.whatsappAction}</a>:<span className={`${ACTION_LINK_CLASSES} cursor-not-allowed border border-border-default text-text-tertiary`}>واتساب</span>}
              </div>
            </div>

            {isProspect && <div className="mt-4 flex items-center gap-2 border-t border-border-subtle pt-4"><span className="text-xs text-text-secondary">الحالة</span><span className="rounded-full border border-brand/20 bg-brand/[.06] px-2.5 py-1 text-xs font-semibold text-brand">{t.statusLabels[lead.status]}</span></div>}

            <details className="mt-4 border-t border-border-subtle pt-4">
              <summary className="cursor-pointer select-none text-sm font-semibold text-text-primary">إدارة بيانات العميل <span className="ms-1 text-xs font-normal text-text-secondary">الحالة، المتابعة، المسؤول والمصدر</span></summary>
              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
                {isProspect ? <div className="flex flex-col gap-1"><label className="text-xs text-text-secondary">{t.detail.statusLabel}</label><Select value={lead.status} onChange={(e) => void saveStatus(e.target.value)}>{LEAD_STATUSES.map((status) => <option key={status} value={status}>{t.statusLabels[status]}</option>)}</Select></div> : <div className="flex flex-col gap-1"><label className="text-xs text-text-secondary">نوع العميل</label><p className="rounded-input border border-border-default px-3 py-3 text-sm font-medium text-text-primary">{customer360?.customer_relationships.map((relationship) => relationship === 'tenant' ? 'مستأجر' : 'مشتري').join(' · ') || 'عميل'}</p></div>}
                <div className="flex flex-col gap-1"><label className="text-xs text-text-secondary">{t.detail.followUpLabel}</label><DateTimePicker value={isoToDatetimeLocal(lead.follow_up_at)} onChange={(value) => void saveFollowUp(value)} /></div>
                
                <div className="flex flex-col gap-1"><label className="text-xs text-text-secondary">مصدر العميل</label><p className="rounded-input border border-border-default px-3 py-3 text-sm text-text-primary">{t.sourceLabels[lead.source]}</p></div>
              </div>
            </details>
          </Card>

          {customer360 && (
            <>
              <SegmentedToggle
                value={detailTab}
                onChange={setDetailTab}
                options={isProspect ? [
                  { value: 'overview', label: 'المعلومات والسجل' },
                  { value: 'actions', label: 'المتابعة والإجراءات' },
                  { value: 'interests', label: 'الاهتمامات العقارية' },
                  { value: 'requirements', label: 'المتطلبات' },
                  { value: 'viewings', label: 'المعاينات' },
                  { value: 'opportunities', label: 'الحجوزات والصفقات' },
                ] : [
                  { value: 'overview', label: 'المعلومات وسجل العميل' },
                  { value: 'actions', label: 'الإجراءات' },
                  { value: 'rent', label: 'العقود والإيجار' },
                  { value: 'purchase', label: 'الشراء' },
                  { value: 'maintenance', label: 'الصيانة' },
                ]}
                className="settings-tabs"
              />

              {detailTab === 'overview' && (
                <Card className="p-3 md:p-5">
                  <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                    <div><p className="text-xs text-text-secondary">الاسم</p><p className="mt-1 font-medium">{lead.full_name}</p></div>
                    <div><p className="text-xs text-text-secondary">الجوال</p><p className="mt-1 font-medium" dir="ltr">{lead.phone ?? '—'}</p></div>
                    <div><p className="text-xs text-text-secondary">البريد الإلكتروني</p><p className="mt-1 truncate font-medium">{lead.email ?? '—'}</p></div>
                    <div><p className="text-xs text-text-secondary">المصدر</p><p className="mt-1 font-medium">{t.sourceLabels[lead.source]}</p></div>
                  </div>
                </Card>
              )}

              {detailTab === 'actions' && (
                <div className="flex items-center justify-between gap-2 rounded-card border border-border-subtle bg-surface-card p-2.5 md:gap-3 md:p-4">
                  <div className="min-w-0"><p className="text-xs font-semibold text-text-primary md:text-sm">{isProspect ? 'متابعة العميل المحتمل' : 'إجراء على العميل'}</p><p className="mt-0.5 hidden text-xs text-text-secondary sm:block">المتابعة والمهمة والمعاينة والملاحظة من مكان واحد.</p></div>
                  <CustomerQuickActions leadId={id} accessToken={accessToken} currentUserId={me.user.id} onChanged={refreshCustomer360} />
                </div>
              )}

              {detailTab === 'interests' ? (
                <LeadRealEstateInterests leadId={id} accessToken={accessToken} interests={customer360.interests} onSaved={refreshCustomer360} />
              ) : detailTab === 'requirements' ? (
                <Card className="p-4 md:p-6"><LeadRequirements leadId={id} accessToken={accessToken} embedded onSaved={refreshCustomer360} /></Card>
              ) : (
                <Customer360Overview lead={lead} data={customer360} tab={detailTab} accessToken={accessToken} onChanged={refreshCustomer360} />
              )}
            </>
          )}

        </div>
      )}
    </AppShell>
  );
}
