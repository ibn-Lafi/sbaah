'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Plan } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { listPlans } from '@/lib/api/plans';

export default function PlansPage() {
  const { accessToken } = useCurrentAdmin();
  const [plans, setPlans] = useState<Plan[] | null>(null);

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
        <Link href="/plans/new">
          <Button>+ باقة جديدة</Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {plans === null ? (
          <p className="p-6 text-center text-black/60">جارٍ التحميل...</p>
        ) : plans.length === 0 ? (
          <p className="p-6 text-center text-black/60">لا توجد باقات بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-right text-black/60">
              <tr>
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">السعر</th>
                <th className="px-5 py-3 font-medium">حد العقارات</th>
                <th className="px-5 py-3 font-medium">حد الفريق</th>
                <th className="px-5 py-3 font-medium">نطاق مخصص</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {plans.map((plan) => (
                <tr key={plan.id} className="border-t border-black/10">
                  <td className="px-5 py-3">
                    <Link href={`/plans/${plan.id}`} className="font-medium hover:text-brand">
                      {plan.name_ar}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-black/60" dir="ltr">
                    {plan.price.toLocaleString('en-US')} SAR
                  </td>
                  <td className="px-5 py-3 text-black/60" dir="ltr">
                    {plan.max_properties.toLocaleString('en-US')}
                  </td>
                  <td className="px-5 py-3 text-black/60" dir="ltr">
                    {plan.max_users.toLocaleString('en-US')}
                  </td>
                  <td className="px-5 py-3 text-black/60">{plan.custom_domain_allowed ? '✓' : '—'}</td>
                  <td className="px-5 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${
                        plan.is_active ? 'bg-green-50 text-green-700' : 'bg-black/5 text-black/50'
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
