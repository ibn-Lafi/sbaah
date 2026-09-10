'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Tenant, TenantStatus } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { TableSkeleton } from '@/components/ui/table-skeleton';
import { TenantStatusBadge } from '@/components/ui/status-badge';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { listAccounts, type AccountListResponse } from '@/lib/api/accounts';
import { ACCOUNT_TYPE_LABELS, TENANT_STATUS_LABELS } from '@/lib/tenant/labels';

const PAGE_SIZE = 20;

export default function AccountsPage() {
  const { accessToken } = useCurrentAdmin();
  const [statusFilter, setStatusFilter] = useState<TenantStatus | ''>('');
  const [page, setPage] = useState(1);
  const [result, setResult] = useState<AccountListResponse | null>(null);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    void listAccounts(accessToken, { status: statusFilter || undefined, page }).then((res) => {
      if (!cancelled) setResult(res);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, statusFilter, page]);

  const totalPages = result ? Math.max(1, Math.ceil(result.total / PAGE_SIZE)) : 1;

  return (
    <ConsoleShell title="الحسابات">
      <div className="mb-4 flex items-center justify-between">
        <Select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as TenantStatus | '');
            setPage(1);
          }}
          className="w-[180px]"
        >
          <option value="">كل الحالات</option>
          {Object.entries(TENANT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>
        {result && <span className="text-sm text-text-secondary">{result.total} حساب</span>}
      </div>

      <Card className="overflow-hidden">
        {result === null ? (
          <TableSkeleton columns={5} />
        ) : result.accounts.length === 0 ? (
          <p className="p-6 text-center text-text-secondary">لا توجد حسابات</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-surface-header text-right text-text-secondary">
              <tr>
                <th className="px-5 py-3 font-medium">الاسم</th>
                <th className="px-5 py-3 font-medium">النوع</th>
                <th className="px-5 py-3 font-medium">النطاق الفرعي</th>
                <th className="px-5 py-3 font-medium">الحالة</th>
                <th className="px-5 py-3 font-medium">تاريخ الإنشاء</th>
              </tr>
            </thead>
            <tbody>
              {result.accounts.map((account: Tenant) => (
                <tr key={account.id} className="border-t border-border-subtle">
                  <td className="px-5 py-3">
                    <Link href={`/accounts/${account.id}`} className="font-medium hover:text-brand">
                      {account.name_ar}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-text-secondary">{ACCOUNT_TYPE_LABELS[account.account_type]}</td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {account.subdomain}
                  </td>
                  <td className="px-5 py-3">
                    <TenantStatusBadge status={account.status} />
                  </td>
                  <td className="px-5 py-3 text-text-secondary" dir="ltr">
                    {new Date(account.created_at).toLocaleDateString('en-GB')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>

      {result && totalPages > 1 && (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className="rounded-lg border border-border-default px-3 py-1.5 disabled:opacity-40"
          >
            السابق
          </button>
          <span className="text-text-secondary">
            صفحة {page} من {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-lg border border-border-default px-3 py-1.5 disabled:opacity-40"
          >
            التالي
          </button>
        </div>
      )}
    </ConsoleShell>
  );
}
