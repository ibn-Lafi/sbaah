'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Script from 'next/script';
import { publicLeadInputSchema } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { submitInquiry } from '@/lib/api/public-leads';
import { ApiRequestError } from '@/lib/api/client';

const LABELS = {
  ar: {
    title: 'سجل اهتمامك',
    name: 'الاسم',
    phone: 'رقم الجوال',
    email: 'البريد الإلكتروني (اختياري)',
    submit: 'إرسال',
    sending: 'جارٍ الإرسال...',
    successTitle: 'تم تسجيل اهتمامك',
    success: 'شكرًا لك، استلمنا بياناتك وسيتواصل معك الفريق قريبًا.',
    genericError: 'تعذّر إرسال الاستفسار، حاول مرة أخرى',
  },
  en: {
    title: 'Register your interest',
    name: 'Name',
    phone: 'Phone number',
    email: 'Email (optional)',
    submit: 'Submit',
    sending: 'Sending...',
    successTitle: 'Interest registered successfully',
    success: "Thank you. We received your details and our team will contact you soon",
    genericError: 'Could not send your inquiry, please try again',
  },
};

function requireSiteKey(): string {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!key) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_TURNSTILE_SITE_KEY');
  }
  return key;
}

interface InquiryFormProps {
  locale: Locale;
  tenantId: string;
  listingId?: string;
  assetId?: string;
  projectId?: string;
  variant?: 'default' | 'lavender';
  eyebrow?: string;
  description?: string;
}

export function InquiryForm({ locale, tenantId, listingId, assetId, projectId, variant = 'default', eyebrow, description }: InquiryFormProps) {
  const t = LABELS[locale];
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  function renderWidget() {
    if (!window.turnstile || !widgetRef.current || widgetId.current) return;
    widgetId.current = window.turnstile.render(widgetRef.current, {
      sitekey: requireSiteKey(),
      callback: setCaptchaToken,
    });
  }

  useEffect(() => {
    renderWidget();
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const result = publicLeadInputSchema.safeParse({
      tenant_id: tenantId,
      project_id: projectId || undefined,
      listing_id: listingId || undefined,
      asset_id: listingId ? undefined : assetId || undefined,
      full_name: fullName,
      phone,
      email: email || null,
      captcha_token: captchaToken,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.genericError);
      return;
    }

    setLoading(true);
    try {
      await submitInquiry(result.data);
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.genericError);
      if (widgetId.current) window.turnstile?.reset(widgetId.current);
      setCaptchaToken('');
    } finally {
      setLoading(false);
    }
  }

  if (submitted) {
    return (
      <div className={variant === 'lavender' ? 'mx-auto flex min-h-[290px] w-full max-w-xl flex-col items-center justify-center rounded-2xl border border-black/10 bg-white p-6 text-center shadow-[0_10px_35px_rgba(23,23,19,.06)] sm:min-h-[330px] sm:p-8' : 'flex min-h-[260px] flex-col items-center justify-center rounded-xl border border-black/10 bg-white p-6 text-center'}>
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-tenant-primary/10 text-tenant-primary sm:h-16 sm:w-16" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" className="h-7 w-7 sm:h-8 sm:w-8">
            <path d="m7 12.5 3.2 3.2L17.5 8.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 className="mt-5 text-xl font-semibold text-black sm:text-2xl">{t.successTitle}</h3>
        <p className="mt-2 max-w-sm text-sm leading-7 text-black/55">{t.success}</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={variant === 'lavender' ? 'mx-auto flex w-full max-w-xl flex-col gap-3.5 rounded-2xl border border-black/10 bg-white p-5 shadow-[0_10px_35px_rgba(23,23,19,.06)] sm:gap-4 sm:p-7' : 'flex flex-col gap-3 rounded-xl border border-black/10 p-5'}>
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onLoad={renderWidget} />
      <div className="mb-1">
        {eyebrow && <p className="text-tenant-primary mb-1.5 text-[11px] font-semibold">{eyebrow}</p>}
        <h3 className={variant === 'lavender' ? 'text-xl font-semibold sm:text-2xl' : 'font-semibold'}>{t.title}</h3>
        {description && <p className="mt-2 text-xs leading-6 text-black/55 sm:text-sm">{description}</p>}
      </div>
      <label className="text-sm font-medium" htmlFor="inquiry-name">{t.name}</label>
      <input
        id="inquiry-name"
        name="name"
        autoComplete="name"
        required
        aria-required="true"
        placeholder={t.name}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="h-11 rounded-xl border border-black/15 px-3 text-sm outline-none transition focus:border-tenant-primary"
      />
      <label className="text-sm font-medium" htmlFor="inquiry-phone">{t.phone}</label>
      <div dir="ltr" className="flex h-11 items-center rounded-xl border border-black/15 px-3 text-sm transition focus-within:border-tenant-primary">
        <span className="flex items-center gap-1 border-r border-black/15 pr-2 text-black/60">
          <span aria-hidden="true">🇸🇦</span>
          <span>+966</span>
        </span>
        <input
          id="inquiry-phone"
          name="tel"
          type="tel"
          inputMode="numeric"
          autoComplete="tel"
          required
          aria-required="true"
          placeholder="5xxxxxxxx"
          value={phone.startsWith('+966') ? phone.slice(4) : phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
            setPhone(digits ? `+966${digits}` : '');
          }}
          className="flex-1 bg-transparent pl-2 outline-none"
        />
      </div>
      <label className="text-sm font-medium" htmlFor="inquiry-email">{t.email}</label>
      <input
        id="inquiry-email"
        name="email"
        type="email"
        autoComplete="email"
        placeholder={t.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        dir="ltr"
        className="h-11 rounded-xl border border-black/15 px-3 text-sm outline-none transition focus:border-tenant-primary"
      />
      <div ref={widgetRef} />
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className={variant === 'lavender' ? 'mt-1 h-11 rounded-xl bg-tenant-primary text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-50' : 'h-11 rounded-lg bg-tenant-primary text-sm font-semibold text-white disabled:opacity-50'}
      >
        {loading ? t.sending : t.submit}
      </button>
    </form>
  );
}
