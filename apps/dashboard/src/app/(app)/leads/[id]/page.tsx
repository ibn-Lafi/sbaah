'use client';

import { use, useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { LEAD_STATUSES, type Asset } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { BackButton } from '@/components/ui/back-button';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DateTimePicker } from '@/components/ui/datetime-picker';
import { DeleteButton } from '@/components/ui/delete-button';
import { Input } from '@/components/ui/input';
import { PersonAvatar } from '@/components/ui/person-avatar';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { addLeadNote, deleteLead, getLead, updateLead, type LeadWithNotes } from '@/lib/api/leads';
import { getAsset } from '@/lib/api/real-estate';
import { listTeam, type TeamMember } from '@/lib/api/team';
import { ApiRequestError } from '@/lib/api/client';
import { datetimeLocalToIso, isoToDatetimeLocal } from '@/lib/lead/datetime';
import { formatRelativeTime } from '@/lib/format/date';
import { useLocale } from '@/lib/i18n/locale-context';
import { LeadRequirements } from '@/components/crm/lead-requirements';

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
  const [property, setProperty] = useState<Asset | null>(null);
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
        if (loaded.asset_id) {
          void getAsset(accessToken, loaded.asset_id).then(({ asset: loadedProperty }) => {
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
      setError(err instanceof ApiRequestError ? err.message : t.detail.errors.addNote);
    } finally {
      setNoteLoading(false);
    }
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

          <LeadRequirements leadId={id} accessToken={accessToken} />

          <div className="grid items-start gap-6 md:grid-cols-2">
            <Card className="order-2 p-8 md:order-1">
              <h2 className="mb-4 text-base font-semibold text-text-primary">{t.detail.notesTitle}</h2>
              <form onSubmit={handleAddNote} className="mb-5 flex gap-2">
                <Input
                  placeholder={t.detail.notePlaceholder}
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  className="flex-1"
                />
                <Button type="submit" disabled={noteLoading} className="flex-none">
                  {noteLoading ? t.detail.addingNote : t.detail.addNote}
                </Button>
              </form>
              {lead.lead_notes.length === 0 ? (
                <p className="text-sm text-text-secondary">{t.detail.noNotes}</p>
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
                    {t.detail.callAction}
                  </a>
                  <a
                    href={`https://wa.me/${lead.phone.replace(/^\+/, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className={`${ACTION_LINK_CLASSES} border border-border-default bg-surface-card text-text-primary hover:bg-surface-subtle`}
                  >
                    {t.detail.whatsappAction}
                  </a>
                </div>
              )}

              <div className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">{t.detail.statusLabel}</label>
                  <Select value={lead.status} onChange={(e) => void saveStatus(e.target.value)}>
                    {LEAD_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {t.statusLabels[status]}
                      </option>
                    ))}
                  </Select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">{t.detail.followUpLabel}</label>
                  <DateTimePicker
                    value={isoToDatetimeLocal(lead.follow_up_at)}
                    onChange={(value) => void saveFollowUp(value)}
                  />
                </div>

                {canManage && (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs text-text-secondary">{t.detail.assignedAgentLabel}</label>
                    <Select defaultValue={lead.assigned_agent_id ?? ''} onChange={(e) => void saveAssignedAgent(e.target.value)}>
                      <option value="">{t.detail.noAgent}</option>
                      {team.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.full_name}
                        </option>
                      ))}
                    </Select>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">{t.detail.propertyLabel}</label>
                  {property ? (
                    <Link
                      href={`/properties/${property.id}`}
                      className="rounded-input border border-border-default px-4 py-3 text-sm text-text-primary hover:border-brand"
                    >
                      <p className="font-medium">{property.name_ar}</p>
                      <p className="text-xs text-text-secondary">{property.asset_type}</p>
                    </Link>
                  ) : (
                    <p className="rounded-input border border-border-default px-4 py-3 text-sm text-text-secondary">{t.detail.noProperty}</p>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs text-text-secondary">{t.detail.sourceLabel}</label>
                  <p className="text-sm text-text-primary">{t.sourceLabels[lead.source]}</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}
    </AppShell>
  );
}
