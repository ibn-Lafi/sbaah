'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Plan } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { PlanForm } from '@/components/plans/plan-form';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { listPlans, updatePlan } from '@/lib/api/plans';

/** No single-plan GET endpoint exists (console/plans/[id] is PATCH-only) — plans are few, so the list is fetched and filtered client-side, same data the list page already loads. */
export default function EditPlanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useCurrentAdmin();
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);

  useEffect(() => {
    let cancelled = false;
    void listPlans(accessToken).then((res) => {
      if (!cancelled) setPlan(res.plans.find((p) => p.id === params.id) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, params.id]);

  return (
    <ConsoleShell title="تعديل الباقة">
      <Card className="max-w-xl p-6">
        {plan === undefined ? (
          <p className="text-center text-black/60">جارٍ التحميل...</p>
        ) : plan === null ? (
          <p className="text-center text-black/60">الباقة غير موجودة</p>
        ) : (
          <PlanForm
            initial={plan}
            submitLabel="حفظ التعديلات"
            onSubmit={async (input) => {
              await updatePlan(accessToken, plan.id, input);
              router.push('/plans');
            }}
          />
        )}
      </Card>
    </ConsoleShell>
  );
}
