'use client';

import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';

/** المتقدمون للوظائف — شاشة حالة فارغة فقط في التصميم الأصلي (لا نظام توظيف حقيقي خلفها)، بزر يرجّع لمحرر الموقع. */
export default function ApplicantsPage() {
  const { me } = useCurrentUser();

  return (
    <AppShell title="المتقدمون للوظائف" orgName={me.tenant.name_ar} accountType={me.tenant.account_type} roleLabel={ROLE_LABELS[me.user.role]}>
      <div className="flex flex-col items-center gap-[18px] rounded-card bg-surface-card px-10 py-[72px] text-center shadow-[0_2px_12px_rgba(31,29,34,.06)]">
        <div
          className="h-[88px] w-[120px] rounded-[16px] border border-dashed border-border-secondary"
          style={{ background: 'repeating-linear-gradient(135deg, #FBFAFC 0 8px, #F2F0F4 8px 16px)' }}
        />
        <div className="flex max-w-[420px] flex-col gap-2">
          <h2 className="text-xl font-semibold text-text-primary">لا يوجد متقدمون للوظائف بعد</h2>
          <p className="text-sm leading-[1.75] text-text-secondary">
            أضف صفحة وظائف لموقعك من محرر الموقع ليتمكن المهتمون من التقديم، وستظهر طلباتهم هنا.
          </p>
        </div>
        <Link
          href="/site"
          className="rounded-input border border-border-default bg-surface-card px-6 py-3 text-sm font-medium text-text-primary hover:bg-surface-subtle"
        >
          محرر الموقع
        </Link>
      </div>
    </AppShell>
  );
}
