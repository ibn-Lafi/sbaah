'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Property, PropertyInput, PropertyStatus } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { PropertyForm } from '@/components/properties/property-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { listProperties, createProperty } from '@/lib/api/properties';
import {
  LISTING_TYPE_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
} from '@/lib/property/labels';

/** "العقارات" هي أول عنصر فرعي بمجموعة "العقارات" بالشريط (نفس نمط مجموعة "الموقع الالكتروني") — العمارات/المشاريع/الإيجارات أصبحت صفحاتها الخاصة (buildings/page.tsx، projects/page.tsx، rentals/page.tsx). */
export default function PropertiesPage() {
  const { me, accessToken } = useCurrentUser();
  const router = useRouter();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);

  // PRODUCT_SPEC.md section 8: Agent has no owner_admin_manage policy on
  // properties (no insert/delete) — hide the action rather than show a
  // button that would 403.
  const canManage = me.user.role !== 'agent';

  useEffect(() => {
    let cancelled = false;
    void listProperties(accessToken, statusFilter ? { status: statusFilter } : {}).then(
      (result) => {
        if (!cancelled) setProperties(result.properties);
      },
    );
    return () => {
      cancelled = true;
    };
  }, [accessToken, statusFilter]);

  return (
    <AppShell
      title="العقارات"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PropertyStatus | '')}
          className="w-[140px]"
          compact
        >
          <option value="">كل الحالات</option>
          {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {canManage && <Button onClick={() => setShowCreate(true)}>+ إضافة عقار</Button>}
      </div>
      {showCreate && (
        <Modal title="إضافة عقار" onClose={() => setShowCreate(false)}>
          <PropertyForm
            mode="create"
            accessToken={accessToken}
            role={me.user.role}
            submitLabel="إضافة العقار"
            onSubmit={async (input) => {
              const { property } = await createProperty(accessToken, input as PropertyInput);
              router.push(`/properties/${property.id}`);
            }}
          />
        </Modal>
      )}
      <Card className="overflow-hidden">
        {properties === null ? (
          <TableSkeleton columns={4} />
        ) : properties.length === 0 ? (
          <p className="text-text-secondary p-6 text-center">لا توجد عقارات بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-5 py-3 font-medium">العنوان</th>
                  <th className="px-5 py-3 font-medium">النوع</th>
                  <th className="px-5 py-3 font-medium">السعر</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {properties.map((property) => (
                  <tr key={property.id} className="border-border-subtle border-t">
                    <td className="px-5 py-3">
                      <Link
                        href={`/properties/${property.id}`}
                        className="text-text-primary hover:text-brand font-medium"
                      >
                        {property.title_ar}
                      </Link>
                    </td>
                    <td className="text-text-secondary px-5 py-3">
                      {PROPERTY_TYPE_LABELS[property.property_type]} ·{' '}
                      {LISTING_TYPE_LABELS[property.listing_type]}
                    </td>
                    <td className="text-text-secondary px-5 py-3" dir="ltr">
                      {property.price.toLocaleString('en-US')} ر.س
                    </td>
                    <td className="px-5 py-3">
                      <Badge
                        status={property.status}
                        label={PROPERTY_STATUS_LABELS[property.status]}
                      />
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
