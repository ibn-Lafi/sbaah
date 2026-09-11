'use client';

import { use, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LEAD_STATUSES, type Property } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DeleteButton } from '@/components/ui/delete-button';
import { Input } from '@/components/ui/input';
import { PersonAvatar } from '@/components/ui/person-avatar';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { addLeadNote, deleteLead, getLead, updateLead, type LeadWithNotes } from '@/lib/api/leads';
import { getProperty } from '@/lib/api/properties';
import { listTeam, type TeamMember } from '@/lib/api/team';
import { ApiRequestError } from '@/lib/api/client';
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from '@/lib/lead/labels';
import { PROPERTY_TYPE_LABELS } from '@/lib/property/labels';
import { datetimeLocalToIso, isoToDatetimeLocal } from '@/lib/lead/datetime';
import { formatRelativeTime } from '@/lib/format/date';

const ACTION_LINK_CLASSES =
  'rounded-control inline-flex h-[44px] flex-1 items-center justify-center gap-2 text-sm font-semibold transition-colors';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const [lead, setLead] = useState<LeadWithNotes | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noteText, setNoteText] = useState('');
  const [noteLoading, setNoteLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getLead(accessToken, id)
      .then(({ lead: loaded }) => {
        if (cancelled) return;
        setLead(loaded);
        if (loaded.property_id) {
          void getProperty(accessToken, loaded.property_id).then(({ property: loadedProperty }) => {
            if (!cancelled) setProperty(loadedProperty);
          });
        }
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
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ المسؤول');
    }
  }

  async function saveStatus(status: string) {
    setError(null);
    try {
      const { lead: updated } = await updateLead(accessToken, id, { status: status as (typeof LEAD_STATUSES)[number] });
      setLead((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ الحالة');
    }
  }

  async function saveFollowUp(localValue: string) {
    setError(null);
    try {
      const { lead: updated } = await updateLead(accessToken, id, { follow_up_at: datetimeLocalToIso(localValue) });
      setLead((current) => (current ? { ...current, ...updated } : current));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حفظ تاريخ المتابعة');
    }
  }

  async function handleAddNote(event: FormEvent) {
    event.preventDefault();
    if (!noteText.trim() || !lead) return;
    setNoteLoading(true);
    setError(null);
    try {
      const { note } = await addLeadNote(accessToken, id, noteText);
      setLead({ ...lead, lead_notes: [note, ...lead.lead_notes] });
      setNoteText('');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إضافة الملاحظة');
    } finally {
      setNoteLoading(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteLead(accessToken, id);
      router.push('/leads');
    } catch (err) {
      throw new Error(err instanceof ApiRequestError ? err.message : 'تعذّر حذف العميل المحتمل');
    }
  }

  if (notFound) {
    return (
      <AppShell
        title="عميل محتمل غير موجود"
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
        roleLabel={ROLE_LABELS[me.user.role]}
      >
        <p className="text-text-secondary">العميل المحتمل غير موجود.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={lead?.full_name ?? 'تفاصيل العميل المحتمل'}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      {!lead ? (
        <FormPageSkeleton fields={4} extraCards={1} />
      ) : (
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <Link href="/leads" className="flex w-fit items-center gap-1 text-sm font-medium text-text-secondary hover:text-brand">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="h-4 w-4">
                <path d="M15 6l-6 6 6 6" />
              </svg>
              رجوع لقائمة الطلبات
            </Link>
            {canManage && (
              <DeleteButton
                label="حذف العميل المحتمل"
                confirmTitle="حذف العميل المحتمل"
                confirmMessage="سيتم حذف هذا العميل المحتمل وكل ملاحظاته نهائيًا، ولا يمكن التراجع عن هذا الإجراء."
                onConfirm={handleDelete}
              />
            )}
          </div>

          <FormError message={error} />

          <div className="grid items-start gap-6 md:grid-cols-2">
            <Card className="order-2 p-8 md:order-1">
              <h2 className="mb-4 text-base font-semibold text-text-primary">سجل الملاحظات</h2>
              <form onSubmit={handleAddNote} className="mb-5 flex gap-2">
                <Input
                  placeholder="أضف ملاحظة عن المكالمة أو الزيارة..."
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={noteLoading} className="flex-none">
                  {noteLoading ? 'جارٍ الإضافة...' : 'إضافة'}
                </Button>
              </form>
              {lead.lead_notes.length === 0 ? (
                <p className="text-sm text-text-secondary">لا ملاحظات بعد.</p>
              ) : (
                <ul className="flex flex-col gap-4">
                  {lead.lead_notes.map((note) => (
                    <li key={note.id} className="flex gap-2.5">
                      <span className="mt-[7px] h-1.5 w-1.5 flex-none rounded-full bg-brand" />
                      <div className="min-w-0">
                        <p className="text-sm text-text-primary">{note.note_text}</p>
                        <p className="mt-0.5 text-xs text-text-secondary">{formatRelativeTime(note.created_at)}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="order-1 p-8 md:order-2">
              <div className="mb-5 flex items-center gap-3">
                <PersonAvatar name={lead.full_name} size={48} />
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-text-primary">{lead.full_name}</p>
                  <p className="text-sm text-text-secondary" dir="ltr">
                    {lead.phone ?? '—'}
                  </p>
                </div>
              </div>

              {lead.phone && (
                <div className="mb-5 flex gap-2">
                  <a href={`tel:${lead.phone}`} className={`${ACTION_LINK_CLASSES} bg-brand text-white hover:bg-brand-hover`}>
                    اتصال
                  </a>
                  <a
                    href={`https://wa.me/${lead.phone.replace(/^\+/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`${ACTION_LINK_CLASSES} border border-border-default bg-surface-card text-text-primary hover:bg-surface-subtle`}
                  >
                    واتساب
                  </a>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">حالة الطلب</label>
                  <Select value={lead.status} onChange={(e) => void saveStatus(e.target.value)}>
                    {LEAD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {LEAD_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">تاريخ المتابعة القادمة</label>
                  <Input
                    type="datetime-local"
                    defaultValue={isoToDatetimeLocal(lead.follow_up_at)}
                    onBlur={(e) => void saveFollowUp(e.target.value)}
                  />
                </div>

                {canManage && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-secondary">المسؤول عن المتابعة</label>
                    <Select defaultValue={lead.assigned_agent_id ?? ''} onChange={(e) => void saveAssignedAgent(e.target.value)}>
                      <option value="">بلا مسؤول</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">العقار المرتبط</label>
                  {property ? (
                    <Link
                      href={`/properties/${property.id}`}
                      className="rounded-input border border-border-default px-4 py-3 text-sm text-text-primary hover:border-brand"
                    >
                      <p className="font-medium">{property.title_ar}</p>
                      <p className="text-xs text-text-secondary">{PROPERTY_TYPE_LABELS[property.property_type]}</p>
                    </Link>
                  ) : (
                    <p className="rounded-input border border-border-default px-4 py-3 text-sm text-text-secondary">بلا عقار محدد</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">المصدر</label>
                  <p className="text-sm text-text-primary">{LEAD_SOURCE_LABELS[lead.source]}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
