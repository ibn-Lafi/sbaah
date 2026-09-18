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
import { listBuildings, createBuilding } from '@/lib/api/hierarchy';
import { useLocale } from '@/lib/i18n/locale-context';

/** عنصر فرعي بمجموعة "العقارات" بالشريط — كانت تبويبًا داخل /properties، أصبحت صفحتها الخاصة. */
export default function BuildingsPage() {
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.buildings;
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
      title={t.list.title}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="mb-5 flex items-center justify-end">
        {canManage && <Button onClick={() => setShowCreate(true)}>{t.list.addButton}</Button>}
      </div>
      {showCreate && (
        <Modal title={t.list.createModalTitle} onClose={() => setShowCreate(false)}>
          <BuildingForm
            mode="create"
            accessToken={accessToken}
            submitLabel={t.list.createSubmitLabel}
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
          <p className="text-text-secondary p-6 text-center">{t.list.emptyState}</p>
        ) : (
          <div className="overflow-x-auto md:overflow-visible">
            <table className="w-full min-w-[360px] table-fixed text-sm md:min-w-0">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-3 py-3 md:px-4 font-medium">{t.list.table.name}</th>
                  <th className="px-3 py-3 md:px-4 font-medium">{t.list.table.floorsCount}</th>
                </tr>
              </thead>
              <tbody>
                {buildings.map((building) => (
                  <tr key={building.id} className="border-border-subtle border-t">
                    <td className="px-3 py-3 md:px-4">
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
