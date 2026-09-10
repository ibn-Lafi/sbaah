'use client';

import { AppShell } from '@/components/layout/app-shell';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';

/**
 * التطبيقات — شبكة عرض ثابتة (نفس النمط في تصميم المؤسس: أسماء تكاملات
 * بحالة متصل/قريبًا)، وليست سوقًا فعليًا بتكاملات حقيقية (لا يوجد OAuth
 * أو ربط خلفي لأي منها). واتساب فقط معلّم "متصل" لأنه التكامل الحقيقي
 * الوحيد الموجود فعليًا في المنتج (زر التواصل عبر واتساب) — الباقي
 * "قريبًا" بصدق بدل نسخ حالة "متصل" الوهمية من التصميم الأصلي لتطبيقات
 * غير موجودة فعليًا.
 */
const APPS = [
  { name: 'واتساب بزنس', connected: true },
  { name: 'Google Analytics', connected: false },
  { name: 'Mailchimp', connected: false },
  { name: 'Zapier', connected: false },
  { name: 'سلة', connected: false },
  { name: 'Snapchat Ads', connected: false },
];

export default function AppsPage() {
  const { me } = useCurrentUser();

  return (
    <AppShell title="التطبيقات" orgName={me.tenant.name_ar} accountType={me.tenant.account_type} roleLabel={ROLE_LABELS[me.user.role]}>
      <div className="flex flex-col gap-4">
        <div>
          <h2 className="text-lg font-semibold text-text-primary">التطبيقات والتكاملات</h2>
          <p className="text-sm text-text-secondary">وصّل موقعك وأدواتك بخدمات أخرى</p>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {APPS.map((app) => (
            <div key={app.name} className="flex flex-col gap-3.5 rounded-card bg-surface-card p-5 shadow-[0_2px_12px_rgba(31,29,34,.06)]">
              <div className="h-11 w-11 rounded-[12px] bg-brand-surface" />
              <div className="text-[15px] font-semibold text-text-primary">{app.name}</div>
              {app.connected ? (
                <span className="w-fit rounded-full bg-success-surface px-3.5 py-1.5 text-xs font-medium text-success">متصل</span>
              ) : (
                <span className="w-fit rounded-full bg-surface-subtle-3 px-4 py-1.5 text-xs font-medium text-text-secondary">قريبًا</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
