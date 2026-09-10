'use client';

import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/**
 * The authenticated console chrome — matches apps/dashboard's AppShell
 * structure (Sidebar + Topbar) instead of the old single top-nav-bar
 * layout (UI/UX audit finding). Every route under `(app)` renders inside
 * this.
 */
export function ConsoleShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} />
        <div className="flex-1 overflow-auto p-7">{children}</div>
      </div>
    </div>
  );
}
