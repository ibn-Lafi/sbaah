'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { signOut } from '@/lib/auth/session';

/** Placeholder home — account/plan management is task 38/42, cities/districts is task 39/42, custom-domain review is task 40/42. This task's scope is the scaffold + login + 2FA gate, proven end-to-end by reaching a real authenticated screen. */
export default function ConsoleHomePage() {
  const router = useRouter();
  const { admin } = useCurrentAdmin();

  async function handleSignOut() {
    await signOut();
    router.replace('/login');
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 px-6 text-center">
      <p className="text-lg font-semibold">مرحبًا {admin.full_name}</p>
      <p className="text-black/60">إدارة منصة سبعة — قيد الإنشاء (الحسابات/الباقات: المهمة 38/42)</p>
      <Button type="button" onClick={() => void handleSignOut()} className="w-fit">
        تسجيل الخروج
      </Button>
    </main>
  );
}
