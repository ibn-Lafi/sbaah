'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { Tenant } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { listAccounts } from '@/lib/api/accounts';

/**
 * PRODUCT_SPEC section 4.3/15 (task 40/42) — every tenant with a pending
 * custom-domain request, across the whole platform. Reuses the accounts
 * list endpoint with the new `custom_domain_status` filter rather than a
 * dedicated one — same pagination/ordering, no duplicated backend logic.
 * Approving/rejecting happens on the account's own detail page
 * (`/accounts/[id]`), which already shows every other account field.
 */
export default function DomainRequestsPage() {
  const { accessToken } = useCurrentAdmin();
  const [accounts, setAccounts] = useState<Tenant[] | null>(null);

  useEffect(() => {
    void listAccounts(accessToken, { custom_domain_status: 'pending', page_size: 50 }).then((res) => setAccounts(res.accounts));
  }, [accessToken]);

  return (
    <ConsoleShell title="طلبات الدومين المخصص">
      <p className="mb-4 text-sm text-black/60">
        كل حساب طلب ربط نطاق مخصص ولم تتم مراجعته بعد. راجعوا DNS يدويًا (لا تحقق تلقائي حاليًا) من صفحة الحساب نفسها.
      </p>
      <Card className="overflow-hidden">
        {accounts === null ? (
          <p className="p-6 text-center text-black/60">جارٍ التحميل...</p>
        ) : accounts.length === 0 ? (
          <p className="p-6 text-center text-black/60">لا توجد طلبات دومين بانتظار المراجعة</p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-black/[0.03] text-right text-black/60">
              <tr>
                <th className="px-5 py-3 font-medium">الحساب</th>
                <th className="px-5 py-3 font-medium">الدومين المطلوب</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-t border-black/10">
                  <td className="px-5 py-3">
                    <Link href={`/accounts/${account.id}`} className="font-medium hover:text-brand">
                      {account.name_ar}
                    </Link>
                  </td>
                  <td className="px-5 py-3 text-black/60" dir="ltr">
                    {account.custom_domain}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Card>
    </ConsoleShell>
  );
}
