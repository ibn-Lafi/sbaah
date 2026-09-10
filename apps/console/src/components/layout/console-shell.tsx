'use client';

import { useState } from 'react';
import { Sidebar } from './sidebar';
import { Topbar } from './topbar';

/**
 * The authenticated console chrome — matches apps/dashboard's AppShell
 * structure (Sidebar + Topbar). Every route under `(app)` renders inside
 * this. Owns the mobile drawer's open state (Topbar's hamburger button
 * triggers it, Sidebar renders it) — UI/UX audit finding: console had no
 * responsive handling for the sidebar at all below `md`.
 */
export function ConsoleShell({ title, children }: { title: string; children: React.ReactNode }) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      <Sidebar mobileOpen={mobileNavOpen} onMobileClose={() => setMobileNavOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar title={title} onMenuClick={() => setMobileNavOpen(true)} />
        <div className="flex-1 overflow-auto p-4 md:p-7">{children}</div>
      </div>
    </div>
  );
}
