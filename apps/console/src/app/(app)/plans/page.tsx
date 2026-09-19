'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Plan } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { FormError } from '@/components/ui/form-error';
import { PlanForm } from '@/components/plans/plan-form';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { createPlan, deletePlan, listPlans, type PlanUsage } from '@/lib/api/plans';
import { ApiRequestError } from '@/lib/api/client';

export default function PlansPage() {
  const { accessToken } = useCurrentAdmin();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [usage, setUsage] = useState<Record<string, PlanUsage>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listPlans(accessToken).then((res) => {
      if (!cancelled) { setPlans(res.plans); setUsage(res.usage ?? {}); }
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  async function handleDelete(plan: Plan) {
    if (!window.confirm(`حذف باقة "${plan.name_ar}"؟`)) return;
    setError(null);
    try {
      await deletePlan(accessToken, plan.id);
      setPlans((prev) => prev && prev.filter((p) => p.id !== plan.id));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف الباقة');
    }
  }

  return (
    <ConsoleShell title="الباقات">
      <div className="mb-4 flex justify-end">
        <Button onClick={() => setShowCreate(true)}>+ باقة جديدة</Button>
      </div>

      {showCreate && (
        <Modal title="باقة جديدة" onClose={() => setShowCreate(false)}>
          <PlanForm
            submitLabel="إنشاء الباقة"
            onSubmit={async (input) => {
              const { plan } = await createPlan(accessToken, input);
              setPlans((prev) => (prev ? [...prev, plan] : [plan]));
              setShowCreate(false);
            }}
          />
        </Modal>
      )}

      <FormError message={error} />

      {plans && <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <Card className="p-4"><p className="text-xs text-text-secondary">الحسابات على الباقات</p><p className="mt-2 text-2xl font-semibold text-text-primary">{Object.values(usage).reduce((n,u)=>n+u.accounts,0).toLocaleString('ar-SA')}</p></Card>
        <Card className="p-4"><p className="text-xs text-text-secondary">الحسابات النشطة</p><p className="mt-2 text-2xl font-semibold text-text-primary">{Object.values(usage).reduce((n,u)=>n+u.active_accounts,0).toLocaleString('ar-SA')}</p></Card>
        <Card className="p-4"><p className="text-xs text-text-secondary">الفترات التجريبية النشطة</p><p className="mt-2 text-2xl font-semibold text-text-primary">{Object.values(usage).reduce((n,u)=>n+u.active_trials,0).toLocaleString('ar-SA')}</p></Card>
      </div>}

      <Card className="mt-4 overflow-hidden">
        {plans === null ? (
          <TableSkeleton columns={9} />
        ) : plans.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">لا توجد باقات بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">الدورة</th>
                <th className="px-5 py-3 font-medium">السعر</th>
                <th className="px-5 py-3 font-medium">حد العقارات</th>
                <th className="px-5 py-3 font-medium">حد الفريق</th>
                <th className="px-5 py-3 font-medium">نطاق مخصص</th>
                <th className="px-5 py-3 font-medium">العملاء</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/plans/${plan.id}`} className="font-medium hover:text-brand">
                      {plan.name_ar}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{plan.billing_cycle === 'monthly' ? 'شهري' : 'سنوي'}</td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {plan.price.toLocaleString('en-US')} SAR
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {plan.max_properties != null ? plan.max_properties.toLocaleString('en-US') : 'بلا حدود'}
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {plan.max_users != null ? plan.max_users.toLocaleString('en-US') : 'بلا حدود'}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{plan.custom_domain_allowed ? '✓' : '—'}</td>
                  <td className="px-5 py-3 text-text-secondary">{usage[plan.id]?.accounts ?? 0}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-[11px] py-[5px] text-[11px] font-medium ${
                        plan.is_active ? 'bg-success-surface text-success' : 'bg-surface-subtle-3 text-text-secondary'
                      }`}
                    >
                      {plan.is_active ? 'نشطة' : 'متوقفة'}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-left">
                    <button type="button" onClick={() => void handleDelete(plan)} className="text-danger hover:underline">
                      حذف
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </ConsoleShell>
  );
}
