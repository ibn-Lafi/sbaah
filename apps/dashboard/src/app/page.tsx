'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { getMe, type MeResponse } from '@/lib/api/auth';
import { getAccessToken, signOut } from '@/lib/auth/session';
import { ROLE_LABELS } from '@/lib/auth/role-labels';

/**
 * Root route's guard: no session → /login. This is the first screen every
 * later task (25-31/42) builds real content inside — for now it only
 * proves the register/login → session → AppShell round trip actually
 * works, per task 24/42's scope.
 */
export default function DashboardHomePage() {
  const router = useRouter();
  const [me, setMe] = useState<MeResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      const accessToken = await getAccessToken();
      if (!accessToken) {
        router.replace('/login');
        return;
      }
      try {
        const profile = await getMe(accessToken);
        if (!cancelled) setMe(profile);
      } catch {
        router.replace('/login');
        return;
      }
      if (!cancelled) setLoading(false);
    }

    void load();
    return () => {
      cancelled = true;
    };
  }, [router]);

  if (loading || !me) {
    return <main className="flex min-h-screen items-center justify-center text-text-secondary">جارٍ التحميل...</main>;
  }

  return (
    <AppShell
      title="لوحة القيادة"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="flex flex-col items-start gap-4">
        <p className="text-lg text-text-primary">مرحبًا {me.user.full_name} — لوحة القيادة قيد الإنشاء</p>
        <Button
          variant="secondary"
          onClick={() => {
            void signOut().then(() => router.replace('/login'));
          }}
        >
          تسجيل الخروج
        </Button>
      </div>
    </AppShell>
  );
}
