'use client';

import { use, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LEAD_STATUSES, type Property } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormError } from '@/components/ui/form-error';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { addLeadNote, deleteLead, getLead, updateLead, type LeadWithNotes } from '@/lib/api/leads';
import { getProperty } from '@/lib/api/properties';
import { listTeam, type TeamMember } from '@/lib/api/team';
import { ApiRequestError } from '@/lib/api/client';
import { LEAD_STATUS_LABELS, LEAD_SOURCE_LABELS } from '@/lib/lead/labels';
import { datetimeLocalToIso, isoToDatetimeLocal } from '@/lib/lead/datetime';

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const [lead, setLead] = useState<LeadWithNotes | null>(null);
  const [property, setProperty] = useState<Property | null>(null);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);
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
    if (!window.confirm('هل تريد حذف هذا العميل المحتمل نهائيًا؟')) return;
    setDeleteError(null);
    try {
      await deleteLead(accessToken, id);
      router.push('/leads');
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف العميل المحتمل');
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
        <p className="text-text-secondary">جارٍ التحميل...</p>
      ) : (
        <div className="flex max-w-[720px] flex-col gap-6">
          <FormError message={error} />

          <Card className="p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">بيانات التواصل</h2>
              <Badge status={lead.status} label={LEAD_STATUS_LABELS[lead.status]} />
            </div>
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-text-secondary">الجوال</dt>
                <dd className="font-medium text-text-primary" dir="ltr">
                  {lead.phone ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">البريد الإلكتروني</dt>
                <dd className="font-medium text-text-primary" dir="ltr">
                  {lead.email ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">العقار</dt>
                <dd className="font-medium text-text-primary">
                  {property ? (
                    <Link href={`/properties/${property.id}`} className="hover:text-brand">
                      {property.title_ar}
                    </Link>
                  ) : (
                    '—'
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-text-secondary">المصدر</dt>
                <dd className="font-medium text-text-primary">{LEAD_SOURCE_LABELS[lead.source]}</dd>
              </div>
            </dl>
          </Card>

          <Card className="p-8">
            <h2 className="mb-4 text-base font-semibold text-text-primary">المتابعة</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary">الحالة</label>
                <Select value={lead.status} onChange={(e) => void saveStatus(e.target.value)}>
                  {LEAD_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {LEAD_STATUS_LABELS[status]}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary">تاريخ المتابعة</label>
                <Input
                  type="datetime-local"
                  defaultValue={isoToDatetimeLocal(lead.follow_up_at)}
                  onBlur={(e) => void saveFollowUp(e.target.value)}
                />
              </div>
              {canManage && (
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">المسؤول عن المتابعة</label>
                  <Select
                    defaultValue={lead.assigned_agent_id ?? ''}
                    onChange={(e) => void saveAssignedAgent(e.target.value)}
                  >
                    <option value="">بلا مسؤول</option>
                    {team.map((member) => (
                      <option key={member.id} value={member.id}>
                        {member.full_name}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
            </div>
          </Card>

          <Card className="p-8">
            <h2 className="mb-4 text-base font-semibold text-text-primary">الملاحظات</h2>
            <form onSubmit={handleAddNote} className="mb-4 flex flex-col gap-2">
              <Textarea placeholder="أضف ملاحظة..." value={noteText} onChange={(e) => setNoteText(e.target.value)} />
              <Button type="submit" variant="secondary" disabled={noteLoading} className="w-fit">
                {noteLoading ? 'جارٍ الإضافة...' : 'إضافة ملاحظة'}
              </Button>
            </form>
            {lead.lead_notes.length === 0 ? (
              <p className="text-sm text-text-secondary">لا ملاحظات بعد.</p>
            ) : (
              <ul className="flex flex-col gap-3">
                {lead.lead_notes.map((note) => (
                  <li key={note.id} className="rounded-input bg-surface-subtle p-3 text-sm">
                    <p className="text-text-primary">{note.note_text}</p>
                    <p className="mt-1 text-xs text-text-secondary" dir="ltr">
                      {new Date(note.created_at).toLocaleString('en-GB')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {canManage && (
            <Card className="p-8">
              <FormError message={deleteError} />
              <Button variant="danger" onClick={() => void handleDelete()}>
                حذف العميل المحتمل نهائيًا
              </Button>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
