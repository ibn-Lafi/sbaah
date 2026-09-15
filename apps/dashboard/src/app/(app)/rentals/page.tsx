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
import { useLocale } from '@/lib/i18n/locale-context';
import { listProperties } from '@/lib/api/properties';
import { listRentals, createRental } from '@/lib/api/rentals';
import { formatDate } from '@/lib/format/date';

/** عنصر فرعي بمجموعة "العقارات" بالشريط — كانت تبويبًا داخل /properties، أصبحت صفحتها الخاصة. */
export default function RentalsPage() {
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.rentals;
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
      title={t.pageTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as RentalStatus | '')}
          className="w-[140px]"
          compact
        >
          <option value="">{t.allStatuses}</option>
          {Object.entries(t.statusLabels).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Button onClick={() => setShowCreate(true)}>{t.addRental}</Button>
      </div>
      {showCreate && (
        <Modal title={t.createModalTitle} onClose={() => setShowCreate(false)}>
          <RentalForm
            mode="create"
            accessToken={accessToken}
            submitLabel={t.createSubmitLabel}
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
          <p className="text-text-secondary p-6 text-center">{t.emptyState}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[700px] text-sm">
              <thead className="bg-surface-header text-text-secondary text-right">
                <tr>
                  <th className="px-5 py-3 font-medium">{t.table.property}</th>
                  <th className="px-5 py-3 font-medium">{t.table.tenant}</th>
                  <th className="px-5 py-3 font-medium">{t.table.rent}</th>
                  <th className="px-5 py-3 font-medium">{t.table.contractEnd}</th>
                  <th className="px-5 py-3 font-medium">{t.table.status}</th>
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
                      {rental.rent_amount.toLocaleString('en-US')} {t.table.currencySuffix}
                    </td>
                    <td className="text-text-secondary px-5 py-3" dir="ltr">
                      {formatDate(rental.contract_end_date)}
                    </td>
                    <td className="px-5 py-3">
                      <Badge status={rental.status} label={t.statusLabels[rental.status]} />
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
