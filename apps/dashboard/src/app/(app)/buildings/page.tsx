'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Building, BuildingInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { BuildingForm } from '@/components/hierarchy/building-form';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listBuildings, createBuilding } from '@/lib/api/hierarchy';

/** عنصر فرعي بمجموعة "العقارات" بالشريط — كانت تبويبًا داخل /properties، أصبحت صفحتها الخاصة. */
export default function BuildingsPage() {
  const { me, accessToken } = useCurrentUser();
  const router = useRouter();
  const [buildings, setBuildings] = useState<Building[] | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const canManage = me.user.role !== 'agent';

  useEffect(() => {
    let cancelled = false;
    void listBuildings(accessToken).then((result) => {
      if (!cancelled) setBuildings(result.buildings);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  return (
    <AppShell
      title="العمارات"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mb-5 flex items-center justify-end">
        {canManage && <Button onClick={() => setShowCreate(true)}>+ إضافة عمارة</Button>}
      </div>
      {showCreate && (
        <Modal title="إضافة عمارة" onClose={() => setShowCreate(false)}>
          <BuildingForm
            mode="create"
            accessToken={accessToken}
            submitLabel="إضافة العمارة"
            onSubmit={async (input) => {
              const { building } = await createBuilding(accessToken, input as BuildingInput);
              router.push(`/buildings/${building.id}`);
            }}
          />
        </Modal>
      )}
      <Card className="overflow-hidden">
        {buildings === null ? (
          <TableSkeleton columns={2} />
        ) : buildings.length === 0 ? (
          <p className="text-text-secondary p-6 text-center">لا توجد عمارات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-5 py-3 font-medium">اسم العمارة</th>
                  <th className="px-5 py-3 font-medium">عدد الطوابق</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((building) => (
                  <tr key={building.id} className="border-border-subtle border-t">
                    <td className="px-5 py-3">
                      <Link
                        href={`/buildings/${building.id}`}
                        className="text-text-primary hover:text-brand font-medium"
                      >
                        {building.name_ar}
                      </Link>
                    </td>
                    <td className="text-text-secondary px-5 py-3">
                      {building.floors_count ?? '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </AppShell>
  );
}
