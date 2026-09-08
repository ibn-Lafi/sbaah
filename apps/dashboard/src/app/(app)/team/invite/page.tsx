'use client';

import { useRouter } from 'next/navigation';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { TeamInviteForm } from '@/components/team/team-invite-form';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';

export default function TeamInvitePage() {
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();

  return (
    <AppShell
      title="دعوة عضو جديد"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <Card className="max-w-[560px] p-8">
        <p className="mb-5 text-sm text-text-secondary">
          بعد إرسال الدعوة، أبلغ العضو برقم جواله المسجَّل ليدخل بنفسه من صفحة تسجيل الدخول عبر رمز التحقق (OTP) — لا
          حاجة لكلمة مرور مبدئية.
        </p>
        <TeamInviteForm accessToken={accessToken} onInvited={() => router.push('/team')} />
      </Card>
    </AppShell>
  );
}
