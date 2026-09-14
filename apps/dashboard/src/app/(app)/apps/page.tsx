'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/app-shell';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';

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
interface AppEntry {
  slug: string;
  name: string;
  description: string;
  category: string;
  price: string;
  tile: 'light' | 'dark';
  connected: boolean;
}

const APPS: AppEntry[] = [
  {
    slug: 'whatsapp',
    name: 'واتساب بزنس',
    description: 'تواصل مع عملائك المحتملين مباشرة عبر واتساب من صفحات موقعك',
    category: 'التواصل والدردشة',
    price: 'مجاني',
    tile: 'light',
    connected: true,
  },
  {
    slug: 'googleanalytics',
    name: 'Google Analytics',
    description: 'خدمة تمكنك من جمع وتحليل البيانات وتحليل زوار متجرك بسهولة وسلاسة',
    category: 'التحليلات والتقارير',
    price: 'مجاني',
    tile: 'light',
    connected: false,
  },
  {
    slug: 'mailchimp',
    name: 'Mailchimp',
    description: 'أرسل حملات بريدية احترافية لعملائك المحتملين وتابع أداءها بسهولة',
    category: 'التسويق عبر البريد الإلكتروني',
    price: 'تجربة مجانية',
    tile: 'dark',
    connected: false,
  },
  {
    slug: 'zapier',
    name: 'Zapier',
    description: 'اربط منصتك بآلاف التطبيقات وأتمِت مهامك المتكررة دون كتابة كود',
    category: 'الأتمتة والربط',
    price: 'مجاني',
    tile: 'light',
    connected: false,
  },
  {
    slug: 'salla',
    name: 'سلة',
    description: 'زامن منتجاتك وطلباتك بين متجرك الإلكتروني ومنصة سلة بسهولة',
    category: 'التجارة الإلكترونية',
    price: 'مجاني',
    tile: 'dark',
    connected: false,
  },
  {
    slug: 'snapchat',
    name: 'Snapchat Ads',
    description: 'أنشئ حملات إعلانية على سناب شات واستهدف جمهورك المهتم بالعقارات',
    category: 'التسويق والإعلانات',
    price: 'مجاني',
    tile: 'dark',
    connected: false,
  },
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

function AppIcon({ app }: { app: AppEntry }) {
  return (
    <div
      className={`flex h-14 w-14 flex-none items-center justify-center rounded-[16px] p-3 ${
        app.tile === 'dark' ? 'bg-text-primary' : 'bg-surface-subtle'
      }`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- static local brand mark, not a Next/Image-managed remote asset */}
      <img src={`/app-icons/${app.slug}.svg`} alt={app.name} className="h-full w-full object-contain" />
    </div>
  );
}

function AppCard({ app }: { app: AppEntry }) {
  const [justClicked, setJustClicked] = useState(false);

  return (
    <div className="rounded-card bg-surface-subtle-2 flex flex-col gap-3.5 p-5">
      <AppIcon app={app} />
      <div className="text-text-primary text-[17px] font-bold">{app.name}</div>
      <p className="text-text-secondary text-sm leading-relaxed">{app.description}</p>
      <span className="border-border-default text-text-secondary w-fit rounded-full border px-3.5 py-1.5 text-xs">
        {app.category}
      </span>
      <div className="mt-1 flex items-center justify-between gap-2">
        {app.connected ? (
          <Link
            href="/settings"
            className="border-border-default text-text-primary hover:bg-surface-card flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold"
          >
            <PlusIcon className="h-3.5 w-3.5" />
            أضف التطبيق
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
            {justClicked ? 'قريبًا' : 'أضف التطبيق'}
          </button>
        )}
        <span className="bg-brand-surface text-brand rounded-[8px] px-2.5 py-1 text-xs font-semibold">
          {app.price}
        </span>
      </div>
    </div>
  );
}

export default function AppsPage() {
  const { me } = useCurrentUser();
  const [query, setQuery] = useState('');

  const visibleApps = useMemo(
    () =>
      query.trim()
        ? APPS.filter((app) => app.name.toLowerCase().includes(query.trim().toLowerCase()))
        : APPS,
    [query],
  );

  return (
    <AppShell
      title="سوق التطبيقات"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <div className="border-border-default mb-5 flex h-12 items-center gap-2 rounded-full border px-5">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="ابحث عن تطبيق..."
          className="text-text-primary placeholder:text-text-placeholder h-full flex-1 border-none bg-transparent text-sm outline-none"
        />
        <SearchIcon className="text-text-secondary h-[18px] w-[18px] flex-none" />
      </div>

      {visibleApps.length === 0 ? (
        <p className="text-text-secondary py-10 text-center">لا توجد تطبيقات مطابقة لبحثك</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {visibleApps.map((app) => (
            <AppCard key={app.slug} app={app} />
          ))}
        </div>
      )}
    </AppShell>
  );
}
