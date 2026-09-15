'use client';

import { AppShell } from '@/components/layout/app-shell';
import { TeamManagementPanel } from '@/components/team/team-management-panel';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';

export default function TeamPage() {
  const { me } = useCurrentUser();
  const { pages } = useLocale();

  return (
    <AppShell title={pages.team.pageTitle} orgName={me.tenant.name_ar} accountType={me.tenant.account_type}>
      <TeamManagementPanel />
    </AppShell>
  );
}
