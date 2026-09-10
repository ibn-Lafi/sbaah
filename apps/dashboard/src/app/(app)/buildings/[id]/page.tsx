'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Building, BuildingUpdateInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { BuildingForm } from '@/components/hierarchy/building-form';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { deleteBuilding, getBuilding, updateBuilding } from '@/lib/api/hierarchy';
import { ApiRequestError } from '@/lib/api/client';

export default function EditBuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const [building, setBuilding] = useState<Building | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getBuilding(accessToken, id)
      .then(({ building: loaded }) => {
        if (!cancelled) setBuilding(loaded);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  const canManage = me.user.role !== 'agent';

  async function handleDelete() {
    if (!window.confirm('هل تريد حذف هذه العمارة نهائيًا؟')) return;
    setDeleteError(null);
    try {
      await deleteBuilding(accessToken, id);
      router.push('/buildings');
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف العمارة');
    }
  }

  if (notFound) {
    return (
      <AppShell
        title="عمارة غير موجودة"
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
        roleLabel={ROLE_LABELS[me.user.role]}
      >
        <p className="text-text-secondary">العمارة غير موجودة.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={building?.name_ar ?? 'تعديل عمارة'}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      {!building ? (
        <FormPageSkeleton fields={3} />
      ) : (
        <div className="flex max-w-[720px] flex-col gap-6">
          <Card className="p-8">
            <BuildingForm
              mode="edit"
              initialValues={building}
              accessToken={accessToken}
              submitLabel="حفظ التعديلات"
              onSubmit={async (input) => {
                const { building: updated } = await updateBuilding(accessToken, id, input as BuildingUpdateInput);
                setBuilding(updated);
              }}
            />
          </Card>

          {canManage && (
            <Card className="p-8">
              <FormError message={deleteError} />
              <Button variant="danger" onClick={() => void handleDelete()}>
                حذف العمارة نهائيًا
              </Button>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
