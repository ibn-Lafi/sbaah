'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { USER_STATUS_LABELS } from '@/lib/team/labels';
import { listTeam, updateTeamMember, type TeamMember } from '@/lib/api/team';

export default function TeamPage() {
  const { me, accessToken } = useCurrentUser();
  const [members, setMembers] = useState<TeamMember[] | null>(null);

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
      title="الفريق"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mb-5 flex items-center justify-end">
        <Link href="/team/invite">
          <Button>+ دعوة عضو</Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {members === null ? (
          <TableSkeleton columns={4} />
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">الجوال</th>
                <th className="px-5 py-3 font-medium">الدور</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => {
                const editable = member.role !== 'owner' && member.id !== me.user.id;
                return (
                  <tr key={member.id} className="border-t border-border-subtle">
                    <td className="px-5 py-3 font-medium text-text-primary">{member.full_name}</td>
                    <td className="px-5 py-3 text-text-secondary" dir="ltr">
                      {member.phone}
                    </td>
                    <td className="px-5 py-3">
                      {editable ? (
                        <Select
                          value={member.role}
                          onChange={(e) => handleRoleChange(member.id, e.target.value as 'admin' | 'agent')}
                          className="h-9 py-0 text-sm"
                        >
                          <option value="admin">{ROLE_LABELS.admin}</option>
                          <option value="agent">{ROLE_LABELS.agent}</option>
                        </Select>
                      ) : (
                        ROLE_LABELS[member.role]
                      )}
                    </td>
                    <td className="px-5 py-3">
                      {editable && member.status === 'invited' ? (
                        <div className="flex items-center gap-2">
                          <Badge status={member.status} label={USER_STATUS_LABELS.invited} />
                          <button
                            type="button"
                            onClick={() => handleStatusChange(member.id, 'disabled')}
                            className="text-xs text-danger hover:underline"
                          >
                            إلغاء الدعوة
                          </button>
                        </div>
                      ) : editable ? (
                        <Select
                          value={member.status}
                          onChange={(e) => handleStatusChange(member.id, e.target.value as 'active' | 'disabled')}
                          className="h-9 py-0 text-sm"
                        >
                          <option value="active">{USER_STATUS_LABELS.active}</option>
                          <option value="disabled">{USER_STATUS_LABELS.disabled}</option>
                        </Select>
                      ) : (
                        <Badge status={member.status} label={USER_STATUS_LABELS[member.status]} />
                      )}
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
