'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { signOut } from '@/lib/auth/session';

const NAV_ITEMS = [
  { href: '/accounts', label: 'الحسابات' },
  { href: '/plans', label: 'الباقات' },
  { href: '/cities', label: 'المدن' },
  { href: '/districts', label: 'الأحياء' },
];

/** Every authenticated console screen wraps its content in this — small top nav, no sidebar (console has far fewer sections than dashboard). */
export function ConsoleShell({ title, children }: { title: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { admin } = useCurrentAdmin();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <div className="min-h-screen">
      <header className="flex items-center justify-between border-b border-black/10 bg-white px-6 py-3">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-brand">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-brand text-xs font-bold text-white">٧</span>
            سبعة
          </Link>
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-lg px-3 py-2 text-sm font-medium ${
                    active ? 'bg-brand/10 text-brand' : 'text-black/60 hover:text-black'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <div className="flex items-center gap-4 text-sm">
          <span className="text-black/60">{admin.full_name}</span>
          <button type="button" onClick={() => void handleSignOut()} className="font-medium text-black/60 hover:text-red-600">
            تسجيل الخروج
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="mb-5 text-xl font-bold">{title}</h1>
        {children}
      </main>
    </div>
  );
}
