'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Script from 'next/script';
import { publicLeadInputSchema } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { submitInquiry } from '@/lib/api/public-leads';
import { ApiRequestError } from '@/lib/api/client';

const LABELS = {
  ar: {
    title: 'استفسار عن هذا العقار',
    name: 'الاسم',
    email: 'البريد الإلكتروني (اختياري)',
    submit: 'إرسال الاستفسار',
    sending: 'جارٍ الإرسال...',
    success: 'تم إرسال استفسارك، سنتواصل معك قريبًا',
    genericError: 'تعذّر إرسال الاستفسار، حاول مرة أخرى',
  },
  en: {
    title: 'Inquire about this property',
    name: 'Name',
    email: 'Email (optional)',
    submit: 'Send inquiry',
    sending: 'Sending...',
    success: "Your inquiry was sent — we'll be in touch soon",
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
  propertyId: string;
}

export function InquiryForm({ locale, tenantId, propertyId }: InquiryFormProps) {
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
      property_id: propertyId,
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
    return <p className="rounded-lg bg-tenant-primary/10 p-4 text-sm text-tenant-primary">{t.success}</p>;
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-black/10 p-5">
      <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onLoad={renderWidget} />
      <h3 className="font-semibold">{t.title}</h3>
      <input
        placeholder={t.name}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="rounded-lg border border-black/15 p-2 text-sm"
      />
      <div dir="ltr" className="flex items-center rounded-lg border border-black/15 p-2 text-sm">
        <span className="flex items-center gap-1 border-r border-black/15 pr-2 text-black/60">
          <span aria-hidden="true">🇸🇦</span>
          <span>+966</span>
        </span>
        <input
          type="tel"
          inputMode="numeric"
          placeholder="5xxxxxxxx"
          value={phone.startsWith('+966') ? phone.slice(4) : phone}
          onChange={(e) => {
            const digits = e.target.value.replace(/\D/g, '').slice(0, 9);
            setPhone(digits ? `+966${digits}` : '');
          }}
          className="flex-1 bg-transparent pl-2 outline-none"
        />
      </div>
      <input
        type="email"
        placeholder={t.email}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        dir="ltr"
        className="rounded-lg border border-black/15 p-2 text-sm"
      />
      <div ref={widgetRef} />
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="h-11 rounded-lg bg-tenant-primary text-sm font-semibold text-white disabled:opacity-50"
      >
        {loading ? t.sending : t.submit}
      </button>
    </form>
  );
}
