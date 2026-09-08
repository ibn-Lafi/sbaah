'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Building } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listBuildings } from '@/lib/api/hierarchy';

export default function BuildingsListPage() {
  const { me, accessToken } = useCurrentUser();
  const [buildings, setBuildings] = useState<Building[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    void listBuildings(accessToken).then((result) => {
      if (!cancelled) setBuildings(result.buildings);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  // RLS (buildings_owner_admin_manage): Agent has no write policy on buildings.
  const canManage = me.user.role !== 'agent';

  return (
    <AppShell
      title="العمارات"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mb-5 flex items-center justify-end">
        {canManage && (
          <Link href="/buildings/new">
            <Button>+ إضافة عمارة</Button>
          </Link>
        )}
      </div>

      <Card className="overflow-hidden">
        {buildings === null ? (
          <p className="p-6 text-center text-text-secondary">جارٍ التحميل...</p>
        ) : buildings.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">لا توجد عمارات بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">اسم العمارة</th>
                <th className="px-5 py-3 font-medium">عدد الطوابق</th>
              </tr>
            </thead>
            <tbody>
              {buildings.map((building) => (
                <tr key={building.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/buildings/${building.id}`} className="font-medium text-text-primary hover:text-brand">
                      {building.name_ar}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{building.floors_count ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
