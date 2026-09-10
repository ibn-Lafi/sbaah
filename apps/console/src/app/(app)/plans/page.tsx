'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Plan } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { PlanForm } from '@/components/plans/plan-form';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { createPlan, listPlans } from '@/lib/api/plans';

export default function PlansPage() {
  const { accessToken } = useCurrentAdmin();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listPlans(accessToken).then((res) => {
      if (!cancelled) setPlans(res.plans);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

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

      <Card className="overflow-hidden">
        {plans === null ? (
          <TableSkeleton columns={7} />
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
                <th className="px-5 py-3 font-medium">الحالة</th>
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
                    {plan.max_properties.toLocaleString('en-US')}
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {plan.max_users.toLocaleString('en-US')}
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{plan.custom_domain_allowed ? '✓' : '—'}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        plan.is_active ? 'bg-green-50 text-green-700' : 'bg-black/5 text-text-muted'
                      }`}
                    >
                      {plan.is_active ? 'نشطة' : 'متوقفة'}
                    </span>
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
