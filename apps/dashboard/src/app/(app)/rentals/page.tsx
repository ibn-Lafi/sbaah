'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Property, Rental, RentalStatus } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { KindTabs } from '@/components/properties/kind-tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listRentals } from '@/lib/api/rentals';
import { listProperties } from '@/lib/api/properties';
import { RENTAL_STATUS_LABELS } from '@/lib/rental/labels';

export default function RentalsListPage() {
  const { me, accessToken } = useCurrentUser();
  const [rentals, setRentals] = useState<Rental[] | null>(null);
  const [properties, setProperties] = useState<Record<string, Property>>({});
  const [statusFilter, setStatusFilter] = useState<RentalStatus | ''>('');

  useEffect(() => {
    let cancelled = false;
    void listProperties(accessToken).then((result) => {
      if (cancelled) return;
      setProperties(Object.fromEntries(result.properties.map((property) => [property.id, property])));
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
      <div className="mb-5">
        <KindTabs />
      </div>

      <div className="mb-5 flex items-center justify-between">
        <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RentalStatus | '')} className="w-[200px]">
          <option value="">كل الحالات</option>
          {Object.entries(RENTAL_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        <Link href="/rentals/new">
          <Button>+ إضافة إيجار</Button>
        </Link>
      </div>

      <Card className="overflow-hidden">
        {rentals === null ? (
          <p className="p-6 text-center text-text-secondary">جارٍ التحميل...</p>
        ) : rentals.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">لا توجد عقود إيجار بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
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
                <tr key={rental.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/rentals/${rental.id}`} className="font-medium text-text-primary hover:text-brand">
                      {properties[rental.property_id]?.title_ar ?? rental.property_id}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{rental.tenant_name}</td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {rental.rent_amount.toLocaleString('en-US')} ر.س
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {rental.contract_end_date}
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={rental.status} label={RENTAL_STATUS_LABELS[rental.status]} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </AppShell>
  );
}
