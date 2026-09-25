'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { BrandIcon } from '@/components/ui/brand-mark';
import { LanguageToggle } from './language-toggle';
import { ThemeToggle } from './theme-toggle';
import { getNavItems, isNavGroup } from './nav-items';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';

interface TopbarProps { title: string; siteUrl: string; }

function SearchIcon({ className }: { className?: string }) {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" className={className}><circle cx="10.5" cy="10.5" r="6.5" /><path d="M20 20l-4.7-4.7" /></svg>;
}

export function Topbar({ title, siteUrl }: TopbarProps) {
  const { t, locale } = useLocale();
  const { me, business, capabilities } = useCurrentUser();
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [siteMenuOpen, setSiteMenuOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const searchable = useMemo(() => {
    const items = getNavItems(t)
      .filter((item) => !item.roles || item.roles.includes(me.user.role))
      .filter((item) => !business.configured || !item.capability || capabilities.has(item.capability));
    return items.flatMap((item) => isNavGroup(item)
      ? item.children
          .filter((child) => !business.configured || !child.capability || capabilities.has(child.capability))
          .map((child) => ({ href: child.href, label: child.label, group: item.label }))
      : [{ href: item.href, label: item.label, group: '' }]);
  }, [t, me.user.role, business.configured, capabilities]);

  const results = useMemo(() => {
    const q = query.trim().toLocaleLowerCase(locale === 'ar' ? 'ar' : 'en');
    if (!q) return searchable;
    return searchable.filter((item) => `${item.label} ${item.group}`.toLocaleLowerCase(locale === 'ar' ? 'ar' : 'en').includes(q));
  }, [query, searchable, locale]);

  useEffect(() => {
    if (searchOpen) window.setTimeout(() => inputRef.current?.focus(), 80);
  }, [searchOpen]);

  function navigate(href: string) {
    setSearchOpen(false);
    setQuery('');
    window.location.href = href;
  }

  return (
    <div className="bg-brand md:border-border-subtle md:bg-surface-card relative flex h-20 flex-none items-center gap-2 px-4 pb-5 md:h-[72px] md:gap-4 md:border-b md:px-7 md:pb-0">
      <div className="flex-none md:hidden"><BrandIcon size={28} tone="white" /></div>
      <div className="md:text-text-primary min-w-0 flex-1 truncate text-[15px] font-semibold text-white md:flex-none md:text-[19px]">{title}</div>
      <div className="hidden flex-1 md:block" />

      <div className="relative flex-none">
        <div className={`flex items-center overflow-hidden transition-[width,background-color,box-shadow] duration-300 ease-out ${searchOpen ? 'bg-surface-card w-[280px] rounded-full shadow-[0_1px_6px_rgba(31,29,34,.11)]' : 'w-[42px]'} md:h-[42px]`}>
          <button type="button" onClick={() => setSearchOpen((v) => !v)} aria-label={t.topbar.searchPlaceholder} className={`flex h-9 w-9 flex-none items-center justify-center rounded-full md:h-[42px] md:w-[42px] ${searchOpen ? 'text-text-primary' : 'bg-white/15 text-white md:bg-surface-subtle md:text-text-primary'}`}>
            <SearchIcon className="h-[17px] w-[17px] md:h-[19px] md:w-[19px]" />
          </button>
          <div className={`flex min-w-0 flex-1 items-center transition-opacity duration-200 ${searchOpen ? 'opacity-100' : 'pointer-events-none opacity-0'}`}>
            <input ref={inputRef} value={query} onChange={(e) => setQuery(e.target.value)} onKeyDown={(e) => { if (e.key === 'Escape') { setSearchOpen(false); setQuery(''); } if (e.key === 'Enter' && results[0]) navigate(results[0].href); }} placeholder={t.topbar.searchPlaceholder} className="text-text-primary min-w-0 flex-1 border-none bg-transparent text-[13px] outline-none" />
            <button type="button" onClick={() => { setSearchOpen(false); setQuery(''); }} aria-label={locale === 'ar' ? 'إغلاق البحث' : 'Close search'} className="text-text-secondary hover:bg-surface-subtle me-1 flex h-8 w-8 flex-none items-center justify-center rounded-full text-lg leading-none transition-colors">×</button>
          </div>
        </div>
        {searchOpen && (
          <div className="bg-surface-card border-border-subtle absolute end-0 top-[48px] z-[100] max-h-[320px] w-[min(320px,calc(100vw-32px))] overflow-auto rounded-[18px] border p-2 shadow-[0_12px_36px_rgba(31,29,34,.18)] md:w-[320px]">
            {results.length ? results.slice(0, 10).map((item) => (
              <button key={item.href} type="button" onClick={() => navigate(item.href)} className="hover:bg-surface-subtle flex w-full items-center justify-between gap-3 rounded-[12px] px-3 py-2.5 text-start">
                <span className="text-text-primary truncate text-sm font-medium">{item.label}</span>
                {item.group && <span className="text-text-tertiary flex-none text-[11px]">{item.group}</span>}
              </button>
            )) : <div className="text-text-secondary px-3 py-5 text-center text-sm">{locale === 'ar' ? 'لا توجد نتائج' : 'No results'}</div>}
          </div>
        )}
      </div>

      <div className="hidden items-center gap-4 md:flex"><ThemeToggle /><LanguageToggle /></div>
      <div className="relative flex-none">
        <button type="button" onClick={() => setSiteMenuOpen((v) => !v)} aria-label={t.topbar.visitSite} title={t.topbar.visitSite} className="md:bg-surface-subtle flex h-9 w-9 flex-none items-center justify-center rounded-full bg-white/15 text-white md:h-[42px] md:w-[42px] md:text-text-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-[17px] w-[17px] md:h-[19px] md:w-[19px]"><path d="M14 4h6v6M10 14 20 4M13 4H7a3 3 0 0 0-3 3v10a3 3 0 0 0 3-3v-6" /></svg>
        </button>
        {siteMenuOpen && (
          <div className="bg-surface-card border-border-subtle absolute end-0 top-[48px] z-[110] w-[min(340px,calc(100vw-32px))] rounded-[18px] border p-3 shadow-[0_12px_36px_rgba(31,29,34,.18)]">
            <div className="mb-2 flex items-center gap-2">
              <div dir="ltr" className="bg-surface-subtle text-text-secondary min-w-0 flex-1 truncate rounded-full px-3 py-2 text-xs">{siteUrl.replace(/^https?:\/\//, '')}</div>
              <button type="button" onClick={async () => { await navigator.clipboard.writeText(siteUrl); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }} className="border-border-default text-text-primary hover:bg-surface-subtle flex h-9 flex-none items-center rounded-full border px-3 text-xs font-semibold">
                {copied ? (locale === 'ar' ? 'تم النسخ' : 'Copied') : (locale === 'ar' ? 'نسخ الرابط' : 'Copy link')}
              </button>
            </div>
            <a href={siteUrl} target="_blank" rel="noreferrer" onClick={() => setSiteMenuOpen(false)} className="bg-brand flex h-10 w-full items-center justify-center rounded-full px-4 text-sm font-semibold text-white">
              {locale === 'ar' ? 'فتح الموقع' : 'Open website'}
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
