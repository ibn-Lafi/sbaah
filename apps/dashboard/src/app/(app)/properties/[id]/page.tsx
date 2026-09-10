'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { PropertyUpdateInput, Rental, RentalInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { Modal } from '@/components/ui/modal';
import { PropertyForm } from '@/components/properties/property-form';
import { PropertyMediaManager } from '@/components/properties/property-media-manager';
import { RentalForm } from '@/components/rentals/rental-form';
import { FormPageSkeleton } from '@/components/ui/form-page-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { deleteProperty, getProperty, updateProperty, type PropertyWithMedia } from '@/lib/api/properties';
import { createRental, listRentals } from '@/lib/api/rentals';
import { RENTAL_STATUS_LABELS } from '@/lib/rental/labels';
import { ApiRequestError } from '@/lib/api/client';

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const [property, setProperty] = useState<PropertyWithMedia | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [notFound, setNotFound] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [showCreateRental, setShowCreateRental] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getProperty(accessToken, id)
      .then(({ property: loaded }) => {
        if (cancelled) return;
        setProperty(loaded);
        void listRentals(accessToken, { property_id: id }).then((result) => {
          if (!cancelled) setRentals(result.rentals);
        });
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
    if (!window.confirm('هل تريد حذف هذا العقار نهائيًا؟')) return;
    setDeleteError(null);
    try {
      await deleteProperty(accessToken, id);
      router.push('/properties');
    } catch (err) {
      setDeleteError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف العقار');
    }
  }

  if (notFound) {
    return (
      <AppShell
        title="عقار غير موجود"
        orgName={me.tenant.name_ar}
        accountType={me.tenant.account_type}
        roleLabel={ROLE_LABELS[me.user.role]}
      >
        <p className="text-text-secondary">العقار غير موجود.</p>
      </AppShell>
    );
  }

  return (
    <AppShell
      title={property?.title_ar ?? 'تعديل عقار'}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      {!property ? (
        <FormPageSkeleton fields={6} extraCards={2} />
      ) : (
        <div className="flex max-w-[720px] flex-col gap-6">
          <Card className="p-8">
            <PropertyForm
              mode="edit"
              initialValues={property}
              accessToken={accessToken}
              role={me.user.role}
              submitLabel="حفظ التعديلات"
              onSubmit={async (input) => {
                const { property: updated } = await updateProperty(accessToken, id, input as PropertyUpdateInput);
                setProperty({ ...updated, property_media: property.property_media });
              }}
            />
          </Card>

          <Card className="p-8">
            <h2 className="mb-4 text-base font-semibold text-text-primary">الصور والفيديو</h2>
            <PropertyMediaManager
              propertyId={id}
              accessToken={accessToken}
              media={property.property_media}
              onChange={(media) => setProperty({ ...property, property_media: media })}
            />
          </Card>

          <Card className="p-8">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-base font-semibold text-text-primary">عقود الإيجار على هذا العقار</h2>
              <button
                type="button"
                onClick={() => setShowCreateRental(true)}
                className="text-sm font-semibold text-brand hover:underline"
              >
                + إضافة إيجار
              </button>
            </div>
            {showCreateRental && (
              <Modal title="إضافة إيجار" onClose={() => setShowCreateRental(false)}>
                <RentalForm
                  mode="create"
                  accessToken={accessToken}
                  defaultPropertyId={id}
                  submitLabel="إضافة الإيجار"
                  onSubmit={async (input) => {
                    const { rental } = await createRental(accessToken, input as RentalInput);
                    setRentals((prev) => [...prev, rental]);
                    setShowCreateRental(false);
                  }}
                />
              </Modal>
            )}
            {rentals.length === 0 ? (
              <p className="text-sm text-text-secondary">لا عقود إيجار مسجّلة بعد.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {rentals.map((rental) => (
                  <li key={rental.id} className="flex items-center justify-between">
                    <Link href={`/rentals/${rental.id}`} className="text-sm font-medium text-text-primary hover:text-brand">
                      {rental.tenant_name}
                    </Link>
                    <Badge status={rental.status} label={RENTAL_STATUS_LABELS[rental.status]} />
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {canManage && (
            <Card className="p-8">
              <FormError message={deleteError} />
              <Button variant="danger" onClick={() => void handleDelete()}>
                حذف العقار نهائيًا
              </Button>
            </Card>
          )}
        </div>
      )}
    </AppShell>
  );
}
