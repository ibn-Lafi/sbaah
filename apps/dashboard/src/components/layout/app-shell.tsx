import type { AccountType } from '@sbaah/shared';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

interface AppShellProps {
  title: string;
  orgName: string;
  accountType: AccountType;
  roleLabel: string;
  children: React.ReactNode;
}

/** The authenticated dashboard chrome — every route under `(app)` renders inside this. */
export function AppShell({ title, orgName, accountType, roleLabel, children }: AppShellProps) {
  return (
    <div className="flex min-h-screen">
      <Sidebar orgName={orgName} accountType={accountType} roleLabel={roleLabel} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <div className="flex-1 overflow-auto p-7">{children}</div>
      </div>
    </div>
  );
}
