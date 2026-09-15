'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Building, BuildingUpdateInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Card } from '@/components/ui/card';
import { DeleteButton } from '@/components/ui/delete-button';
import { BuildingForm } from '@/components/hierarchy/building-form';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { deleteBuilding, getBuilding, updateBuilding } from '@/lib/api/hierarchy';
import { ApiRequestError } from '@/lib/api/client';
import { useLocale } from '@/lib/i18n/locale-context';

export default function EditBuildingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.buildings;
  const [building, setBuilding] = useState<Building | null>(null);
  const [notFound, setNotFound] = useState(false);

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
    try {
      await deleteBuilding(accessToken, id);
      router.push('/buildings');
    } catch (err) {
      throw new Error(err instanceof ApiRequestError ? err.message : t.detail.deleteFallbackError);
    }
  }

  if (notFound) {
    return (
      <AppShell
        title={t.detail.notFoundTitle}
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
      >
        <p className="text-text-secondary">{t.detail.notFoundMessage}</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={building?.name_ar ?? t.detail.defaultTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
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
              submitLabel={t.detail.editSubmitLabel}
              onSubmit={async (input) => {
                const { building: updated } = await updateBuilding(accessToken, id, input as BuildingUpdateInput);
                setBuilding(updated);
              }}
            />
          </Card>

          {canManage && (
            <DeleteButton
              label={t.detail.deleteLabel}
              confirmTitle={t.detail.deleteConfirmTitle}
              confirmMessage={t.detail.deleteConfirmMessage}
              onConfirm={handleDelete}
            />
          )}
        </div>
      )}
    </AppShell>
  );
}
