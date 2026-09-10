'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Property, PropertyStatus } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { KindTabs } from '@/components/properties/kind-tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { listProperties } from '@/lib/api/properties';
import { LISTING_TYPE_LABELS, PROPERTY_STATUS_LABELS, PROPERTY_TYPE_LABELS } from '@/lib/property/labels';

export default function PropertiesListPage() {
  const { me, accessToken } = useCurrentUser();
  const [properties, setProperties] = useState<Property[] | null>(null);
  const [statusFilter, setStatusFilter] = useState<PropertyStatus | ''>('');

  useEffect(() => {
    let cancelled = false;
    void listProperties(accessToken, statusFilter ? { status: statusFilter } : {}).then((result) => {
      if (!cancelled) setProperties(result.properties);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, statusFilter]);

  // PRODUCT_SPEC.md section 8: Agent has no properties_owner_admin_manage
  // policy (no insert/delete) — hide the action rather than show a button
  // that would 403.
  const canManage = me.user.role !== 'agent';

  return (
    <AppShell
      title="العقارات"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="mb-5">
        <KindTabs />
      </div>

      <div className="mb-5 flex items-center justify-between">
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as PropertyStatus | '')}
          className="w-[200px]"
        >
          <option value="">كل الحالات</option>
          {Object.entries(PROPERTY_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {canManage && (
          <Link href="/properties/new">
            <Button>+ إضافة عقار</Button>
          </Link>
        )}
      </div>

      <Card className="overflow-hidden">
        {properties === null ? (
          <p className="p-6 text-center text-text-secondary">جارٍ التحميل...</p>
        ) : properties.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">لا توجد عقارات بعد</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">العنوان</th>
                <th className="px-5 py-3 font-medium">النوع</th>
                <th className="px-5 py-3 font-medium">السعر</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
              </tr>
            </thead>
            <tbody>
              {properties.map((property) => (
                <tr key={property.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/properties/${property.id}`} className="font-medium text-text-primary hover:text-brand">
                      {property.title_ar}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">
                    {PROPERTY_TYPE_LABELS[property.property_type]} · {LISTING_TYPE_LABELS[property.listing_type]}
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {property.price.toLocaleString('en-US')} ر.س
                  </td>
                  <td className="px-5 py-3">
                    <Badge status={property.status} label={PROPERTY_STATUS_LABELS[property.status]} />
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
