'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Plan } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { LoadingState } from '@/components/ui/loading-state';
import { PlanForm } from '@/components/plans/plan-form';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { deletePlan, listPlans, updatePlan } from '@/lib/api/plans';
import { ApiRequestError } from '@/lib/api/client';

/** No single-plan GET endpoint exists (console/plans/[id] is PATCH/DELETE-only) — plans are few, so the list is fetched and filtered client-side, same data the list page already loads. */
export default function EditPlanPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { accessToken } = useCurrentAdmin();
  const [plan, setPlan] = useState<Plan | null | undefined>(undefined);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listPlans(accessToken).then((res) => {
      if (!cancelled) setPlan(res.plans.find((p) => p.id === params.id) ?? null);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, params.id]);

  async function handleDelete() {
    if (!plan || !window.confirm(`حذف باقة "${plan.name_ar}"؟`)) return;
    setDeleteError(null);
    try {
      await deletePlan(accessToken, plan.id);
      router.push('/plans');
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف الباقة');
    }
  }

  return (
    <ConsoleShell title="تعديل الباقة">
      <Card className="max-w-xl p-6">
        {plan === undefined ? (
          <LoadingState />
        ) : plan === null ? (
          <p className="text-center text-text-secondary">الباقة غير موجودة</p>
        ) : (
          <>
            <PlanForm
              initial={plan}
              submitLabel="حفظ التعديلات"
              onSubmit={async (input) => {
                await updatePlan(accessToken, plan.id, input);
                router.push('/plans');
              }}
            />
            <div className="mt-6 border-t border-border-subtle pt-4">
              <FormError message={deleteError} />
              <button type="button" onClick={() => void handleDelete()} className="text-sm text-danger hover:underline">
                حذف هذه الباقة
              </button>
            </div>
          </>
        )}
      </Card>
    </ConsoleShell>
  );
}
