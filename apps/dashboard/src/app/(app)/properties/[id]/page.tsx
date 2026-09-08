'use client';

import { use, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { PropertyUpdateInput } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { FormError } from '@/components/ui/form-error';
import { PropertyForm } from '@/components/properties/property-form';
import { PropertyMediaManager } from '@/components/properties/property-media-manager';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { deleteProperty, getProperty, updateProperty, type PropertyWithMedia } from '@/lib/api/properties';
import { ApiRequestError } from '@/lib/api/client';

export default function EditPropertyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const [property, setProperty] = useState<PropertyWithMedia | null>(null);
  const [notFound, setNotFound] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getProperty(accessToken, id)
      .then(({ property: loaded }) => {
        if (!cancelled) setProperty(loaded);
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
        <p className="text-text-secondary">جارٍ التحميل...</p>
      ) : (
        <div className="flex max-w-[720px] flex-col gap-6">
          <Card className="p-8">
            <PropertyForm
              mode="edit"
              initialValues={property}
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
