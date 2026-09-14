'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Property, Rental, RentalInput, RentalStatus } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { RentalForm } from '@/components/rentals/rental-form';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listProperties } from '@/lib/api/properties';
import { listRentals, createRental } from '@/lib/api/rentals';
import { RENTAL_STATUS_LABELS } from '@/lib/rental/labels';
import { formatDate } from '@/lib/format/date';

/** عنصر فرعي بمجموعة "العقارات" بالشريط — كانت تبويبًا داخل /properties، أصبحت صفحتها الخاصة. */
export default function RentalsPage() {
  const { me, accessToken } = useCurrentUser();
  const router = useRouter();
  const [rentals, setRentals] = useState<Rental[] | null>(null);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [statusFilter, setStatusFilter] = useState<RentalStatus | ''>('');
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void listProperties(accessToken).then((result) => {
      if (cancelled) return;
      setProperties(
        Object.fromEntries(result.properties.map((property) => [property.id, property])),
      );
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken]);

  useEffect(() => {
    let cancelled = false;
    void listRentals(accessToken, statusFilter ? { status: statusFilter } : {}).then((result) => {
      if (!cancelled) setRentals(result.rentals);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, statusFilter]);

  return (
    <AppShell
      title="الإيجارات"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RentalStatus | '')}
          className="w-[140px]"
          compact
        >
          <option value="">كل الحالات</option>
          {Object.entries(RENTAL_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button onClick={() => setShowCreate(true)}>+ إضافة إيجار</Button>
      </div>
      {showCreate && (
        <Modal title="إضافة إيجار" onClose={() => setShowCreate(false)}>
          <RentalForm
            mode="create"
            accessToken={accessToken}
            submitLabel="إضافة الإيجار"
            onSubmit={async (input) => {
              const { rental } = await createRental(accessToken, input as RentalInput);
              router.push(`/rentals/${rental.id}`);
            }}
          />
        </Modal>
      )}
      <Card className="overflow-hidden">
        {rentals === null ? (
          <TableSkeleton columns={5} />
        ) : rentals.length === 0 ? (
          <p className="text-text-secondary p-6 text-center">لا توجد عقود إيجار بعد</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-5 py-3 font-medium">العقار</th>
                  <th className="px-5 py-3 font-medium">المستأجر</th>
                  <th className="px-5 py-3 font-medium">الإيجار</th>
                  <th className="px-5 py-3 font-medium">نهاية العقد</th>
                  <th className="px-5 py-3 font-medium">الحالة</th>
                </tr>
              </thead>
              <tbody>
                {rentals.map((rental) => (
                  <tr key={rental.id} className="border-border-subtle border-t">
                    <td className="px-5 py-3">
                      <Link
                        href={`/rentals/${rental.id}`}
                        className="text-text-primary hover:text-brand font-medium"
                      >
                        {properties[rental.property_id]?.title_ar ?? rental.property_id}
                      </Link>
                    </td>
                    <td className="text-text-secondary px-5 py-3">{rental.tenant_name}</td>
                    <td className="text-text-secondary px-5 py-3" dir="ltr">
                      {rental.rent_amount.toLocaleString('en-US')} ر.س
                    </td>
                    <td className="text-text-secondary px-5 py-3" dir="ltr">
                      {formatDate(rental.contract_end_date)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={rental.status} label={RENTAL_STATUS_LABELS[rental.status]} />
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
