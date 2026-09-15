'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import type { PageDictionaries } from '@/lib/i18n/page-dictionaries';

/**
 * سوق التطبيقات — شبكة بطاقات (نفس نمط تصميم المؤسس: أيقونة الشعار الرسمي +
 * اسم + وصف + تصنيف + سعر + زر "أضف التطبيق")، وليست سوقًا فعليًا
 * بتكاملات حقيقية (لا يوجد OAuth أو ربط خلفي لأي منها). واتساب فقط
 * تطبيق مُفعّل فعليًا (رقم واتساب بصفحة "الإعدادات" هو التكامل الحقيقي
 * الوحيد الموجود بالمنتج) لذا زرّه يفتح تلك الصفحة مباشرة؛ البقية "قريبًا"
 * بصدق بدل ادّعاء إضافة تطبيق لا يوجد ربط فعلي له.
 *
 * الأيقونات: شعارات رسمية (حزمة simple-icons، CC0) محفوظة بـ
 * public/app-icons — بلونها الرسمي. البطاقات ذات الألوان الفاتحة جدًا
 * (Mailchimp الأصفر، سلة النعناعي، سناب شات الأصفر) توضع على مربع داكن
 * بدل الفاتح لتبقى مقروءة، والباقي على المربع الفاتح المعتاد.
 */
type AppSlug = keyof PageDictionaries['apps']['apps'];

interface AppConfig {
  slug: AppSlug;
  tile: 'light' | 'dark';
  connected: boolean;
}

const APPS: AppConfig[] = [
  { slug: 'whatsapp', tile: 'light', connected: true },
  { slug: 'googleanalytics', tile: 'light', connected: false },
  { slug: 'mailchimp', tile: 'dark', connected: false },
  { slug: 'zapier', tile: 'light', connected: false },
  { slug: 'salla', tile: 'dark', connected: false },
  { slug: 'snapchat', tile: 'dark', connected: false },
];

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" className={className}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="M20 20l-4.8-4.8" />
    </svg>
  );
}

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

function AppIcon({ app, name }: { app: AppConfig; name: string }) {
  return (
    <div
      className={`flex h-14 w-14 flex-none items-center justify-center rounded-[16px] p-3 ${
        app.tile === 'dark' ? 'bg-text-primary' : 'bg-surface-subtle'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static local brand mark, not a Next/Image-managed remote asset */}
      <img src={`/app-icons/${app.slug}.svg`} alt={name} className="h-full w-full object-contain" />
    </div>
  );
}

function AppCard({
  app,
  entry,
  t,
}: {
  app: AppConfig;
  entry: PageDictionaries['apps']['apps'][AppSlug];
  t: PageDictionaries['apps'];
}) {
  const [justClicked, setJustClicked] = useState(false);

  return (
    <div className="rounded-card bg-surface-subtle-2 flex flex-col gap-3.5 p-5">
      <AppIcon app={app} name={entry.name} />
      <div className="text-text-primary text-[17px] font-bold">{entry.name}</div>
      <p className="text-text-secondary text-sm leading-relaxed">{entry.description}</p>
      <span className="border-border-default text-text-secondary w-fit rounded-full border px-3.5 py-1.5 text-xs">
        {entry.category}
      </span>
      <div className="mt-1 flex items-center justify-between gap-2">
        {app.connected ? (
          <Link
            href="/settings"
            className="border-border-default text-text-primary hover:bg-surface-card flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {t.addApp}
          </Link>
        ) : (
          <button
            type="button"
            onClick={() => {
              setJustClicked(true);
              window.setTimeout(() => setJustClicked(false), 1800);
            }}
            className="border-border-default text-text-primary hover:bg-surface-card flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {justClicked ? t.comingSoon : t.addApp}
          </button>
        )}
        <span className="bg-brand-surface text-brand rounded-[8px] px-2.5 py-1 text-xs font-semibold">
          {entry.price}
        </span>
      </div>
    </div>
  );
}

export default function AppsPage() {
  const { me } = useCurrentUser();
  const { pages } = useLocale();
  const t = pages.apps;
  const [query, setQuery] = useState('');

  const visibleApps = useMemo(
    () =>
      query.trim()
        ? APPS.filter((app) =>
            t.apps[app.slug].name.toLowerCase().includes(query.trim().toLowerCase()),
          )
        : APPS,
    [query, t],
  );

  return (
    <AppShell
      title={t.pageTitle}
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
    >
      <div className="border-border-default mb-5 flex h-12 items-center gap-2 rounded-full border px-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.searchPlaceholder}
          className="text-text-primary placeholder:text-text-placeholder h-full flex-1 border-none bg-transparent text-sm outline-none"
        />
        <SearchIcon className="text-text-secondary h-[18px] w-[18px] flex-none" />
      </div>

      {visibleApps.length === 0 ? (
        <p className="text-text-secondary py-10 text-center">{t.noResults}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleApps.map((app) => (
            <AppCard key={app.slug} app={app} entry={t.apps[app.slug]} t={t} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
