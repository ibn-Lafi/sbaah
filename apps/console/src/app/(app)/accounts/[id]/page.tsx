'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Plan, Tenant, TenantStatus } from '@sbaah/shared';
import { ConsoleShell } from '@/components/layout/console-shell';
import { Card } from '@/components/ui/card';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { LoadingState } from '@/components/ui/loading-state';
import { TenantStatusBadge } from '@/components/ui/status-badge';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { getAccount, updateAccount, type DnsRecord } from '@/lib/api/accounts';
import { listPlans } from '@/lib/api/plans';
import { ApiRequestError } from '@/lib/api/client';
import { ACCOUNT_TYPE_LABELS, TENANT_STATUS_LABELS } from '@/lib/tenant/labels';

const STATUS_ACTIONS: { status: TenantStatus; label: string; confirm: string }[] = [
  { status: 'active', label: 'تفعيل', confirm: 'تفعيل هذا الحساب؟ سيتمكن مالكه من التعديل والنشر مجددًا.' },
  { status: 'suspended', label: 'تعليق', confirm: 'تعليق هذا الحساب؟ سيبقى موقعه وبياناته للقراءة فقط حتى يُفعَّل مجددًا.' },
  { status: 'cancelled', label: 'إلغاء', confirm: 'إلغاء هذا الحساب؟ هذا إجراء يُستخدم عادة لإنهاء الاشتراك نهائيًا.' },
];

export default function AccountDetailPage() {
  const params = useParams<{ id: string }>();
  const { accessToken } = useCurrentAdmin();
  const [account, setAccount] = useState<Tenant | null>(null);
  const [dnsRecord, setDnsRecord] = useState<DnsRecord | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void Promise.all([getAccount(accessToken, params.id), listPlans(accessToken)]).then(([accountRes, plansRes]) => {
      if (cancelled) return;
      setAccount(accountRes.account);
      setDnsRecord(accountRes.dns_record);
      setPlans(plansRes.plans);
    });
    return () => {
      cancelled = true;
    };
  }, [accessToken, params.id]);

  async function handleStatusChange(status: TenantStatus, confirmMessage: string) {
    if (!account || status === account.status) return;
    if (!window.confirm(confirmMessage)) return;
    setError(null);
    setBusy(true);
    try {
      const { account: updated } = await updateAccount(accessToken, account.id, { status });
      setAccount(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر تحديث حالة الحساب');
    } finally {
      setBusy(false);
    }
  }

  async function handlePlanChange(planId: string) {
    if (!account || planId === account.plan_id) return;
    setError(null);
    setBusy(true);
    try {
      const { account: updated } = await updateAccount(accessToken, account.id, { plan_id: planId });
      setAccount(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر تحديث الباقة');
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveDomain() {
    if (!account) return;
    if (!window.confirm(`تأكيد أن ${account.custom_domain} يشير فعليًا إلى العنوان أعلاه، وتفعيله؟`)) return;
    setError(null);
    setBusy(true);
    try {
      const { account: updated } = await updateAccount(accessToken, account.id, { custom_domain_status: 'verified' });
      setAccount(updated);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر تفعيل الدومين');
    } finally {
      setBusy(false);
    }
  }

  async function handleRejectDomain() {
    if (!account) return;
    if (!window.confirm(`رفض طلب ${account.custom_domain}؟ سيُطلَب من صاحب الحساب تصحيح إعدادات DNS وإعادة الطلب.`)) return;
    setError(null);
    setBusy(true);
    try {
      const { account: updated } = await updateAccount(accessToken, account.id, { clear_custom_domain: true });
      setAccount(updated);
      setDnsRecord(null);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر رفض طلب الدومين');
    } finally {
      setBusy(false);
    }
  }

  return (
    <ConsoleShell title="تفاصيل الحساب">
      {account === null ? (
        <LoadingState />
      ) : (
        <div className="flex flex-col gap-5">
          <Card className="flex items-center justify-between p-6">
            <div>
              <h2 className="text-lg font-bold">{account.name_ar}</h2>
              <p className="text-sm text-text-secondary" dir="ltr">
                {account.name_en}
              </p>
            </div>
            <TenantStatusBadge status={account.status} />
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold">بيانات الحساب</h3>
            <dl className="grid grid-cols-2 gap-4 text-sm sm:grid-cols-3">
              <div>
                <dt className="text-text-muted">نوع الحساب</dt>
                <dd className="mt-0.5 font-medium">{ACCOUNT_TYPE_LABELS[account.account_type]}</dd>
              </div>
              <div>
                <dt className="text-text-muted">رخصة فال</dt>
                <dd className="mt-0.5 font-medium" dir="ltr">
                  {account.fal_license_number}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">السجل التجاري</dt>
                <dd className="mt-0.5 font-medium" dir="ltr">
                  {account.cr_number ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">الرقم الضريبي</dt>
                <dd className="mt-0.5 font-medium" dir="ltr">
                  {account.tax_number ?? '—'}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">النطاق الفرعي</dt>
                <dd className="mt-0.5 font-medium" dir="ltr">
                  {account.subdomain}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">النطاق المخصص</dt>
                <dd className="mt-0.5 font-medium" dir="ltr">
                  {account.custom_domain ?? '—'}
                  {account.custom_domain_status && ` (${account.custom_domain_status})`}
                </dd>
              </div>
              <div>
                <dt className="text-text-muted">تاريخ الإنشاء</dt>
                <dd className="mt-0.5 font-medium" dir="ltr">
                  {new Date(account.created_at).toLocaleDateString('en-GB')}
                </dd>
              </div>
            </dl>
          </Card>

          <Card className="p-6">
            <h3 className="mb-1 font-semibold">حالة الحساب</h3>
            <p className="mb-4 text-sm text-text-secondary">الحالة الحالية: {TENANT_STATUS_LABELS[account.status]}</p>
            <div className="flex flex-wrap gap-3">
              {STATUS_ACTIONS.filter((action) => action.status !== account.status).map((action) => (
                <Button
                  key={action.status}
                  type="button"
                  variant={action.status === 'active' ? 'primary' : 'danger'}
                  disabled={busy}
                  onClick={() => void handleStatusChange(action.status, action.confirm)}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <h3 className="mb-4 font-semibold">الباقة</h3>
            <Select value={account.plan_id} onChange={(e) => void handlePlanChange(e.target.value)} disabled={busy} className="w-[260px]">
              {plans.map((plan) => (
                <option key={plan.id} value={plan.id}>
                  {plan.name_ar} — {plan.price.toLocaleString('en-US')} ريال/شهريًا
                </option>
              ))}
            </Select>
          </Card>

          {account.custom_domain && (
            <Card className="p-6">
              <h3 className="mb-1 font-semibold">طلب الدومين المخصص</h3>
              <p className="mb-4 text-sm text-text-secondary">
                الدومين المطلوب: <span dir="ltr">{account.custom_domain}</span> — الحالة:{' '}
                {account.custom_domain_status === 'verified' ? 'مفعَّل' : 'بانتظار المراجعة'}
              </p>

              {dnsRecord && (
                <div className="mb-4 rounded-lg bg-surface-subtle p-4 text-sm">
                  <p className="mb-2 text-text-secondary">
                    تحققوا يدويًا (عبر أي أداة DNS lookup) أن هذا النطاق يشير فعليًا إلى العنوان التالي قبل التفعيل:
                  </p>
                  <div dir="ltr" className="flex flex-col gap-1 font-mono text-xs">
                    <span>Type: {dnsRecord.type}</span>
                    <span>Name: {dnsRecord.name}</span>
                    <span>Value: {dnsRecord.value}</span>
                  </div>
                </div>
              )}

              {account.custom_domain_status === 'pending' && (
                <div className="flex flex-wrap gap-3">
                  <Button type="button" disabled={busy} onClick={() => void handleApproveDomain()}>
                    تفعيل الدومين
                  </Button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleRejectDomain()}
                    className="text-sm font-medium text-danger hover:underline disabled:opacity-50"
                  >
                    رفض الطلب
                  </button>
                </div>
              )}
            </Card>
          )}

          <FormError message={error} />
        </div>
      )}
    </ConsoleShell>
  );
}
