'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Rental, RentalUpdateInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { BackButton } from '@/components/ui/back-button';
import { Card } from '@/components/ui/card';
import { DeleteButton } from '@/components/ui/delete-button';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { RentalForm } from '@/components/rentals/rental-form';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { deleteRental, getRental, updateRental } from '@/lib/api/rentals';
import { ApiRequestError } from '@/lib/api/client';

export default function EditRentalPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.rentals;
  const [rental, setRental] = useState<Rental | null>(null);
  const [notFound, setNotFound] = useState(false);

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
    try {
      await deleteRental(accessToken, id);
      router.push('/rentals');
    } catch (err) {
      throw new Error(err instanceof ApiRequestError ? err.message : t.detail.deleteFailed);
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
      title={rental ? t.detail.pageTitle(rental.tenant_name) : t.detail.editTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      {!rental ? (
        <FormPageSkeleton fields={5} />
      ) : (
        <div className="mx-auto flex max-w-[720px] flex-col gap-6">
          <BackButton href="/rentals" label="رجوع" className="self-start" />
          <Card className="p-8">
            <RentalForm
              mode="edit"
              initialValues={rental}
              accessToken={accessToken}
              submitLabel={t.detail.saveLabel}
              onSubmit={async (input) => {
                const { rental: updated } = await updateRental(accessToken, id, input as RentalUpdateInput);
                setRental(updated);
              }}
            />
          </Card>

          <DeleteButton
            label={t.detail.deleteLabel}
            confirmTitle={t.detail.deleteConfirmTitle}
            confirmMessage={t.detail.deleteConfirmMessage}
            onConfirm={handleDelete}
          />
        </div>
      )}
    </AppShell>
  );
}
