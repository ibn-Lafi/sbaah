'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import type { PageDictionaries } from '@/lib/i18n/page-dictionaries';

/**
 * سوق التطبيقات — شبكة بطاقات (نفس نمط تصميم المؤسس: أيقونة الشعار الرسمي +
 * اسم + وصف + تصنيف + سعر + زر "أضف التطبيق")، وليست سوقًا فعليًا
 * واتساب يفتح إعداداته الحالية. أي تطبيق غير موصول فعليًا يبقى "قريبًا"
 * بدل إظهار حالة اتصال غير حقيقية.
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
  compact = false,
}: {
  app: AppConfig;
  entry: PageDictionaries['apps']['apps'][AppSlug];
  t: PageDictionaries['apps'];
  compact?: boolean;
}) {
  const [justClicked, setJustClicked] = useState(false);

  return (
    <div className={`rounded-card bg-surface-subtle-2 flex h-full flex-col ${compact ? 'gap-2.5 p-3.5 sm:gap-3 sm:p-4' : 'gap-3.5 p-5'}`}>
      <div className={compact ? 'scale-[.82] origin-top-right -mb-2 sm:scale-90 sm:-mb-1' : ''}><AppIcon app={app} name={entry.name} /></div>
      <div className={`text-text-primary font-bold ${compact ? 'text-[14px] sm:text-[15px]' : 'text-[17px]'}`}>{entry.name}</div>
      <p className={`text-text-secondary leading-relaxed ${compact ? 'line-clamp-2 text-[12px] sm:text-[13px]' : 'text-sm'}`}>{entry.description}</p>
      <span className={`border-border-default text-text-secondary w-fit rounded-full border ${compact ? 'px-2.5 py-1 text-[10px] sm:text-[11px]' : 'px-3.5 py-1.5 text-xs'}`}>
        {entry.category}
      </span>
      <div className="mt-1 flex items-center justify-between gap-2">
        {app.connected ? (
          <Link
            href="/settings"
            className={`border-border-default text-text-primary hover:bg-surface-card flex items-center gap-1.5 rounded-full border font-semibold ${compact ? 'px-3 py-1.5 text-[11px] sm:text-xs' : 'px-4 py-2 text-[13px]'}`}
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
            className={`border-border-default text-text-primary hover:bg-surface-card flex items-center gap-1.5 rounded-full border font-semibold ${compact ? 'px-3 py-1.5 text-[11px] sm:text-xs' : 'px-4 py-2 text-[13px]'}`}
          >
            <PlusIcon className="h-3.5 w-3.5" />
            {justClicked ? t.comingSoon : t.addApp}
          </button>
        )}
        <span className={`bg-brand-surface text-brand rounded-[8px] font-semibold ${compact ? 'px-2 py-1 text-[10px] sm:text-[11px]' : 'px-2.5 py-1 text-xs'}`}>
          {entry.price}
        </span>
      </div>
    </div>
  );
}

export default function AppsPage() {
  const { me } = useCurrentUser();
  const { pages, locale } = useLocale();
  const t = pages.apps;
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [searchOpen]);

  const installedApps = useMemo(() => APPS.filter((app) => app.connected), []);

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
      <div className="mb-5 flex justify-end">
        <div className={`border-border-default flex h-[42px] items-center overflow-hidden border transition-[width,background-color,box-shadow] duration-300 ease-out ${searchOpen ? 'bg-surface-card w-full rounded-full shadow-[0_1px_6px_rgba(31,29,34,.08)] sm:w-[320px]' : 'w-[42px] rounded-full'}`}>
          <button
            type="button"
            onClick={() => {
              setSearchOpen((open) => {
                if (open) setQuery('');
                return !open;
              });
            }}
            aria-label={t.searchPlaceholder}
            className="text-text-primary bg-surface-subtle flex h-[42px] w-[42px] flex-none items-center justify-center rounded-full"
          >
            <SearchIcon className="h-[18px] w-[18px]" />
          </button>
          <div className={`flex min-w-0 flex-1 items-center transition-opacity duration-200 ${searchOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Escape') {
                  setSearchOpen(false);
                  setQuery('');
                }
              }}
              placeholder={t.searchPlaceholder}
              className="text-text-primary placeholder:text-text-placeholder min-w-0 flex-1 border-none bg-transparent px-3 text-sm outline-none"
            />
            <button
              type="button"
              onClick={() => {
                setSearchOpen(false);
                setQuery('');
              }}
              aria-label={locale === 'ar' ? 'إغلاق البحث' : 'Close search'}
              className="text-text-secondary hover:bg-surface-subtle me-1 flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg leading-none"
            >
              ×
            </button>
          </div>
        </div>
      </div>

      {installedApps.length > 0 && (
        <section className="mb-6">
          <h2 className="text-text-primary mb-3 text-base font-bold">{locale === 'ar' ? 'التطبيقات المثبتة' : 'Installed apps'}</h2>
          <div className="-mx-1 flex snap-x snap-mandatory flex-nowrap gap-3 overflow-x-auto px-1 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {installedApps.map((app) => (
              <div key={app.slug} className="w-[178px] min-w-[178px] snap-start sm:w-[220px] sm:min-w-[220px] md:w-[250px] md:min-w-[250px]">
                <AppCard app={app} entry={t.apps[app.slug]} t={t} compact />
              </div>
            ))}
          </div>
        </section>
      )}

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
