'use client';

import Link from 'next/link';
import { useEffect, useState, type FormEvent } from 'react';
import { customDomainInputSchema, subdomainInputSchema } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { DomainSkeleton } from '@/components/domain/domain-skeleton';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getPlatformRootDomain } from '@/lib/env/platform-root-domain';
import {
  getDomain,
  setDomain,
  removeDomain,
  updateSubdomain,
  verifyDomain,
  type DomainInfo,
} from '@/lib/api/tenant';
import { ApiRequestError } from '@/lib/api/client';

type DomainMode = 'custom' | 'subdomain';

function CopyIcon({ copied, className }: { copied: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}>
      {copied ? <path d="M5 12.5l4.5 4.5L19 7" /> : <><rect x="9" y="9" width="11" height="11" rx="2" /><path d="M5 15V6a2 2 0 0 1 2-2h9" /></>}
    </svg>
  );
}

/** Copies `value` to the clipboard, showing a checkmark for 1.5s as feedback — used for the long, easy-to-mistype CNAME/TXT values a founder must paste into their DNS provider. */
function CopyButton({ value, label }: { value: string; label: string }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      aria-label={label}
      title={label}
      className={`flex h-7 w-7 flex-none items-center justify-center rounded-[8px] ${
        copied ? 'text-success' : 'text-text-secondary hover:bg-surface-subtle'
      }`}
    >
      <CopyIcon copied={copied} className="h-[15px] w-[15px]" />
    </button>
  );
}

function CustomDomainCard({
  accessToken,
  domain,
  onChanged,
}: {
  accessToken: string;
  domain: DomainInfo;
  onChanged: () => void;
}) {
  const [input, setInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [notVerifiedYet, setNotVerifiedYet] = useState(false);
  const { pages } = useLocale();
  const t = pages.domain;

  async function handleSet(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = customDomainInputSchema.safeParse({ custom_domain: input });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.customDomain.invalidFormat);
      return;
    }
    setLoading(true);
    try {
      await setDomain(accessToken, result.data.custom_domain);
      setInput('');
      onChanged();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.customDomain.connectFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove() {
    setLoading(true);
    try {
      await removeDomain(accessToken);
      onChanged();
    } finally {
      setLoading(false);
    }
  }

  async function handleVerify() {
    setError(null);
    setNotVerifiedYet(false);
    setVerifying(true);
    try {
      const result = await verifyDomain(accessToken);
      // Refreshed either way — Cloudflare's certificate-validation DNS
      // records (see verify/route.ts) can newly appear on a check that's
      // still "not verified yet", and the owner needs to see those too.
      onChanged();
      if (!result.verified) {
        setNotVerifiedYet(true);
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.customDomain.verifyFailed);
    } finally {
      setVerifying(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-text-primary mb-1 text-base font-semibold">{t.customDomain.title}</h2>
      <p className="text-text-secondary mb-4 text-sm">{t.customDomain.subtitle}</p>

      {domain.custom_domain ? (
        <div className="flex flex-col gap-4">
          <div
            className={`rounded-input flex items-center gap-2.5 px-4 py-3 ${
              domain.custom_domain_status === 'verified'
                ? 'bg-success-surface'
                : 'bg-warning-surface'
            }`}
          >
            <span
              className={`h-2 w-2 flex-none rounded-full ${domain.custom_domain_status === 'verified' ? 'bg-success' : 'bg-warning'}`}
            />
            <span
              dir="ltr"
              className={`flex-1 text-sm font-semibold ${domain.custom_domain_status === 'verified' ? 'text-success' : 'text-warning'}`}
            >
              {domain.custom_domain}
            </span>
            <Badge
              status={domain.custom_domain_status === 'verified' ? 'active' : 'draft'}
              label={
                domain.custom_domain_status === 'verified'
                  ? t.customDomain.statusVerified
                  : t.customDomain.statusPending
              }
            />
          </div>
          {domain.custom_domain_status === 'pending' && domain.dns_records.length > 0 && (
            <>
              <div className="flex flex-col gap-3">
                {domain.dns_records.map((record) => (
                  <div key={`${record.type}-${record.name}-${record.value}`} className="rounded-input bg-surface-header flex flex-col gap-2.5 p-4">
                    <span className="text-text-primary w-fit rounded-full bg-surface-subtle-3 px-2.5 py-1 text-[11px] font-semibold" dir="ltr">
                      {record.type}
                    </span>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-text-secondary text-xs">{t.customDomain.dnsFieldName}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary min-w-0 flex-1 truncate text-sm font-medium" dir="ltr">
                          {record.name}
                        </span>
                        <CopyButton value={record.name} label={t.customDomain.copyValue} />
                      </div>
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <span className="text-text-secondary text-xs">{t.customDomain.dnsFieldValue}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-text-primary min-w-0 flex-1 truncate text-sm font-medium" dir="ltr">
                          {record.value}
                        </span>
                        <CopyButton value={record.value} label={t.customDomain.copyValue} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-text-secondary text-xs">{t.customDomain.dnsInstructions}</p>
              <Button
                type="button"
                variant="secondary"
                loading={verifying}
                onClick={() => void handleVerify()}
                className="w-fit"
              >
                {t.customDomain.verifyConnection}
              </Button>
              {notVerifiedYet && (
                <p className="text-warning text-sm">{t.customDomain.notVerifiedYet}</p>
              )}
            </>
          )}
          <Button
            type="button"
            variant="danger"
            onClick={handleRemove}
            disabled={loading}
            className="border-danger/30 hover:border-danger/50 w-fit border"
          >
            {t.customDomain.removeDomain}
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSet} className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <label className="text-text-primary text-sm font-medium">{t.customDomain.domainNameLabel}</label>
            <Input
              placeholder="example.com"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              dir="ltr"
              compact
            />
          </div>
          <Button type="submit" disabled={loading} className="sm:w-fit">
            {loading ? t.customDomain.connecting : t.customDomain.connectDomain}
          </Button>
        </form>
      )}
      <FormError message={error} />
    </Card>
  );
}

function SubdomainCard({
  accessToken,
  currentSubdomain,
  canEdit,
  showUpsell,
}: {
  accessToken: string;
  currentSubdomain: string;
  canEdit: boolean;
  showUpsell: boolean;
}) {
  const [input, setInput] = useState(currentSubdomain);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const rootDomain = getPlatformRootDomain();
  const { pages } = useLocale();
  const t = pages.domain;

  async function handleSave(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const result = subdomainInputSchema.safeParse({ subdomain: input });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.subdomain.invalidFormat);
      return;
    }
    setLoading(true);
    try {
      await updateSubdomain(accessToken, result.data.subdomain);
      window.location.reload();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.subdomain.updateFailed);
      setLoading(false);
    }
  }

  return (
    <Card className="p-6">
      <h2 className="text-text-primary mb-1 text-base font-semibold">{t.subdomain.title}</h2>
      <p className="text-text-secondary mb-4 text-sm">{t.subdomain.subtitle}</p>

      {canEdit ? (
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <label className="text-text-primary text-sm font-medium">{t.subdomain.usernameLabel}</label>
          <div
            className="rounded-input border-border-default flex max-w-[400px] items-stretch overflow-hidden border"
            dir="ltr"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value.toLowerCase())}
              dir="ltr"
              className="text-text-primary h-[50px] flex-1 border-none bg-transparent px-3.5 text-[15px] outline-none"
            />
            <span className="bg-surface-subtle-2 text-text-secondary flex flex-none items-center px-3.5 text-sm font-medium">
              .{rootDomain}
            </span>
          </div>
          <p className="text-text-secondary text-sm" dir="ltr">
            https://{input || currentSubdomain}.{rootDomain}
          </p>
          <FormError message={error} />
          <Button type="submit" disabled={loading} className="w-fit">
            {loading ? t.subdomain.saving : t.subdomain.saveChanges}
          </Button>
          {showUpsell && (
            <Link
              href="/settings?tab=billing"
              className="rounded-input bg-brand-surface text-brand px-4 py-3 text-sm hover:underline"
            >
              {t.subdomain.upsell}
            </Link>
          )}
        </form>
      ) : (
        <p className="text-text-primary text-sm font-medium" dir="ltr">
          {currentSubdomain}.{rootDomain}
        </p>
      )}
    </Card>
  );
}

/** الدومين — عنصر قائمة مستقل (مطابق للتصميم)، يجمع النطاق الفرعي والدومين المخصص بدل تفرقتهما بين الإعدادات ومحرر الموقع كما كان سابقًا. */
export default function DomainPage() {
  const { me, accessToken } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.domain;
  const [domain, setDomainState] = useState<DomainInfo | null>(null);
  const [mode, setMode] = useState<DomainMode>('custom');
  const canEdit = me.user.role === 'owner';

  function reload() {
    void getDomain(accessToken).then(setDomainState);
  }

  useEffect(reload, [accessToken]);

  return (
    <AppShell
      title={t.pageTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="mx-auto flex max-w-[560px] flex-col gap-4">
        {domain === null ? (
          <DomainSkeleton />
        ) : !canEdit ? (
          <SubdomainCard
            accessToken={accessToken}
            currentSubdomain={me.tenant.subdomain}
            canEdit={false}
            showUpsell={false}
          />
        ) : domain.custom_domain_allowed ? (
          <>
            <SegmentedToggle
              className="max-w-[320px]"
              value={mode}
              onChange={setMode}
              options={[
                { value: 'custom', label: t.modeToggle.custom },
                { value: 'subdomain', label: t.modeToggle.subdomain },
              ]}
            />
            {mode === 'custom' ? (
              <CustomDomainCard accessToken={accessToken} domain={domain} onChanged={reload} />
            ) : (
              <SubdomainCard
                accessToken={accessToken}
                currentSubdomain={me.tenant.subdomain}
                canEdit
                showUpsell={false}
              />
            )}
          </>
        ) : (
          <SubdomainCard
            accessToken={accessToken}
            currentSubdomain={me.tenant.subdomain}
            canEdit
            showUpsell
          />
        )}
      </div>
    </AppShell>
  );
}
