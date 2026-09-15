'use client';

import { useEffect, useState } from 'react';
import { AppShell } from '@/components/layout/app-shell';
import { TeamInviteForm } from '@/components/team/team-invite-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { listTeam, updateTeamMember, type TeamMember } from '@/lib/api/team';

export default function TeamPage() {
  const { me, accessToken } = useCurrentUser();
  const { t, pages } = useLocale();
  const team = pages.team;
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [showInvite, setShowInvite] = useState(false);

  function reload() {
    void listTeam(accessToken).then((result) => setMembers(result.members));
  }

  useEffect(() => {
    reload();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function handleRoleChange(id: string, role: 'admin' | 'agent') {
    await updateTeamMember(accessToken, id, { role });
    reload();
  }

  async function handleStatusChange(id: string, status: 'active' | 'disabled') {
    await updateTeamMember(accessToken, id, { status });
    reload();
  }

  return (
    <AppShell
      title={team.pageTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="mb-5 flex items-center justify-end">
        <Button onClick={() => setShowInvite(true)}>{team.inviteButton}</Button>
      </div>

      {showInvite && (
        <Modal title={team.inviteModalTitle} onClose={() => setShowInvite(false)}>
          <TeamInviteForm
            accessToken={accessToken}
            onInvited={() => {
              setShowInvite(false);
              reload();
            }}
          />
        </Modal>
      )}

      <Card className="overflow-hidden">
        {members === null ? (
          <TableSkeleton columns={4} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[560px] text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-5 py-3 font-medium">{team.table.name}</th>
                  <th className="px-5 py-3 font-medium">{team.table.phone}</th>
                  <th className="px-5 py-3 font-medium">{team.table.role}</th>
                  <th className="px-5 py-3 font-medium">{team.table.status}</th>
                </tr>
              </thead>
              <tbody>
                {members.map((member) => {
                  const editable = member.role !== 'owner' && member.id !== me.user.id;
                  return (
                    <tr key={member.id} className="border-border-subtle border-t">
                      <td className="text-text-primary px-5 py-3 font-medium">
                        {member.full_name}
                      </td>
                      <td className="text-text-secondary px-5 py-3" dir="ltr">
                        {member.phone}
                      </td>
                      <td className="px-5 py-3">
                        {editable ? (
                          <Select
                            value={member.role}
                            onChange={(e) =>
                              handleRoleChange(member.id, e.target.value as 'admin' | 'agent')
                            }
                            className="h-9 py-0 text-sm"
                          >
                            <option value="admin">{t.roleLabels.admin}</option>
                            <option value="agent">{t.roleLabels.agent}</option>
                          </Select>
                        ) : (
                          t.roleLabels[member.role]
                        )}
                      </td>
                      <td className="px-5 py-3">
                        {editable && member.status === 'invited' ? (
                          <div className="flex items-center gap-2">
                            <Badge status={member.status} label={team.statusLabels.invited} />
                            <button
                              type="button"
                              onClick={() => handleStatusChange(member.id, 'disabled')}
                              className="text-danger text-xs hover:underline"
                            >
                              {team.cancelInvite}
                            </button>
                          </div>
                        ) : editable ? (
                          <Select
                            value={member.status}
                            onChange={(e) =>
                              handleStatusChange(member.id, e.target.value as 'active' | 'disabled')
                            }
                            className="h-9 py-0 text-sm"
                          >
                            <option value="active">{team.statusLabels.active}</option>
                            <option value="disabled">{team.statusLabels.disabled}</option>
                          </Select>
                        ) : (
                          <Badge status={member.status} label={team.statusLabels[member.status]} />
                        )}
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
