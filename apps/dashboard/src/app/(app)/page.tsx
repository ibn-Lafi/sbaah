'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth/session';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';

export default function DashboardHomePage() {
  const router = useRouter();
  const { me } = useCurrentUser();

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
