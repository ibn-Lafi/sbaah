'use client';

import { useRouter } from 'next/navigation';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { PlanForm } from '@/components/plans/plan-form';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { createPlan } from '@/lib/api/plans';

export default function NewPlanPage() {
  const router = useRouter();
  const { accessToken } = useCurrentAdmin();

  return (
    <ConsoleShell title="باقة جديدة">
      <Card className="max-w-xl p-6">
        <PlanForm
          submitLabel="إنشاء الباقة"
          onSubmit={async (input) => {
            await createPlan(accessToken, input);
            router.push('/plans');
          }}
        />
      </Card>
    </ConsoleShell>
  );
}
