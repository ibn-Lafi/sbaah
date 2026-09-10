'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Rental, RentalUpdateInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { LoadingState } from '@/components/ui/loading-state';
import { RentalForm } from '@/components/rentals/rental-form';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { deleteRental, getRental, updateRental } from '@/lib/api/rentals';
import { ApiRequestError } from '@/lib/api/client';

export default function EditRentalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const [rental, setRental] = useState<Rental | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getRental(accessToken, id)
      .then(({ rental: loaded }) => {
        if (!cancelled) setRental(loaded);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [accessToken, id]);

  async function handleDelete() {
    if (!window.confirm('هل تريد حذف عقد الإيجار هذا نهائيًا؟')) return;
    setDeleteError(null);
    try {
      await deleteRental(accessToken, id);
      router.push('/rentals');
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف الإيجار');
    }
  }

  if (notFound) {
    return (
      <AppShell
        title="إيجار غير موجود"
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
        roleLabel={ROLE_LABELS[me.user.role]}
      >
        <p className="text-text-secondary">الإيجار غير موجود.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={rental ? `إيجار — ${rental.tenant_name}` : 'تعديل إيجار'}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      {!rental ? (
        <LoadingState />
      ) : (
        <div className="flex max-w-[720px] flex-col gap-6">
          <Card className="p-8">
            <RentalForm
              mode="edit"
              initialValues={rental}
              accessToken={accessToken}
              submitLabel="حفظ التعديلات"
              onSubmit={async (input) => {
                const { rental: updated } = await updateRental(accessToken, id, input as RentalUpdateInput);
                setRental(updated);
              }}
            />
          </Card>

          <Card className="p-8">
            <FormError message={deleteError} />
            <Button variant="danger" onClick={() => void handleDelete()}>
              حذف عقد الإيجار نهائيًا
            </Button>
          </Card>
        </div>
      )}
    </AppShell>
  );
}
