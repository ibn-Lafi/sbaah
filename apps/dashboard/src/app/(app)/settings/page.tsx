'use client';

import Link from 'next/link';
import type { AccountType } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  individual: 'فرد',
  institution: 'مؤسسة',
  company: 'شركة',
};

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border-subtle py-3 last:border-0">
      <span className="text-sm text-text-secondary">{label}</span>
      <span className="text-sm font-medium text-text-primary" dir={/^[+0-9]/.test(value) ? 'ltr' : undefined}>
        {value}
      </span>
    </div>
  );
}

/** حسابي (من قائمة الحساب المنسدلة أسفل الشريط الجانبي) — بيانات الحساب فقط؛ النطاق الفرعي/الدومين المخصص انتقلا إلى /domain (عنصر قائمة مستقل، مطابق للتصميم). */
export default function SettingsPage() {
  const { me } = useCurrentUser();

  return (
    <AppShell
      title="الإعدادات"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="flex max-w-[640px] flex-col gap-5">
        <Card className="p-6">
          <h2 className="mb-2 text-base font-semibold text-text-primary">بيانات الحساب</h2>
          <InfoRow label="اسم الحساب" value={me.tenant.name_ar} />
          <InfoRow label="نوع الحساب" value={ACCOUNT_TYPE_LABELS[me.tenant.account_type]} />
          <InfoRow label="اسمك" value={me.user.full_name} />
          <InfoRow label="جوالك" value={me.user.phone} />
          <InfoRow label="دورك" value={ROLE_LABELS[me.user.role]} />
        </Card>

        <Card className="p-6">
          <h2 className="mb-1 text-base font-semibold text-text-primary">النطاق الفرعي والدومين المخصص</h2>
          <p className="text-sm text-text-secondary">
            إدارة النطاق الفرعي والدومين المخصص انتقلت إلى{' '}
            <Link href="/domain" className="font-semibold text-brand hover:underline">
              الدومين
            </Link>
            .
          </p>
        </Card>
      </div>
    </AppShell>
  );
}
