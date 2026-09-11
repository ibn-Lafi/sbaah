'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import Script from 'next/script';
import type { BrokerMarketerApplicantType, City } from '@sbaah/shared';
import { publicBrokerMarketerApplicationInputSchema } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { pickLocalized } from '@/lib/i18n/localized-field';
import { submitBrokerMarketerApplication } from '@/lib/api/public-leads';
import { ApiRequestError } from '@/lib/api/client';

const LABELS = {
  ar: {
    title: 'انضم كوسيط أو مسوّق',
    fullName: 'الاسم الكامل',
    city: 'المدينة',
    citySelect: 'اختر المدينة',
    falLicense: 'رقم رخصة فال',
    applicantType: 'أرغب بالتقديم كـ',
    broker: 'وسيط',
    marketer: 'مسوّق',
    submit: 'إرسال الطلب',
    sending: 'جارٍ الإرسال...',
    success: 'تم إرسال طلبك، سنتواصل معك قريبًا',
    genericError: 'تعذّر إرسال الطلب، حاول مرة أخرى',
  },
  en: {
    title: 'Apply as a broker or marketer',
    fullName: 'Full name',
    city: 'City',
    citySelect: 'Select city',
    falLicense: 'Fal license number',
    applicantType: 'I want to apply as',
    broker: 'Broker',
    marketer: 'Marketer',
    submit: 'Send application',
    sending: 'Sending...',
    success: "Your application was sent — we'll be in touch soon",
    genericError: 'Could not send your application, please try again',
  },
};

function requireSiteKey(): string {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!key) {
    throw new Error('Missing required environment variable: NEXT_PUBLIC_TURNSTILE_SITE_KEY');
  }
  return key;
}

interface BrokerMarketerFormProps {
  locale: Locale;
  tenantId: string;
  /** Set only when rendered on a property's detail page — omitted (site-wide) on the home page. */
  propertyId?: string;
  cities: City[];
}

/** "الوسطاء والمسوقين" section (migration 0032) — same structure/conventions as InquiryForm, just with this form's own fixed fields instead of name/phone/email. */
export function BrokerMarketerForm({ locale, tenantId, propertyId, cities }: BrokerMarketerFormProps) {
  const t = LABELS[locale];
  const widgetRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState('');
  const [fullName, setFullName] = useState('');
  const [cityId, setCityId] = useState('');
  const [falLicenseNumber, setFalLicenseNumber] = useState('');
  const [applicantType, setApplicantType] = useState<BrokerMarketerApplicantType>('broker');
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

    const result = publicBrokerMarketerApplicationInputSchema.safeParse({
      tenant_id: tenantId,
      property_id: propertyId ?? null,
      full_name: fullName,
      city_id: cityId,
      fal_license_number: falLicenseNumber,
      applicant_type: applicantType,
      captcha_token: captchaToken,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.genericError);
      return;
    }

    setLoading(true);
    try {
      await submitBrokerMarketerApplication(result.data);
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
      <div className="mx-auto max-w-xl px-6 py-8">
        <p className="rounded-lg bg-tenant-primary/10 p-4 text-sm text-tenant-primary">{t.success}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl px-6 py-8">
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 rounded-xl border border-black/10 p-5">
        <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onLoad={renderWidget} />
        <h3 className="font-semibold">{t.title}</h3>

        <input
          placeholder={t.fullName}
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="rounded-lg border border-black/15 p-2 text-sm"
        />

        <select
          value={cityId}
          onChange={(e) => setCityId(e.target.value)}
          className="rounded-lg border border-black/15 p-2 text-sm"
        >
          <option value="">{t.citySelect}</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {pickLocalized(locale, city.name_ar, city.name_en)}
            </option>
          ))}
        </select>

        <input
          placeholder={t.falLicense}
          value={falLicenseNumber}
          onChange={(e) => setFalLicenseNumber(e.target.value)}
          dir="ltr"
          className="rounded-lg border border-black/15 p-2 text-sm"
        />

        <div className="flex flex-col gap-1.5">
          <span className="text-sm text-black/70">{t.applicantType}</span>
          <div className="flex gap-4">
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="applicant_type"
                checked={applicantType === 'broker'}
                onChange={() => setApplicantType('broker')}
              />
              {t.broker}
            </label>
            <label className="flex items-center gap-1.5 text-sm">
              <input
                type="radio"
                name="applicant_type"
                checked={applicantType === 'marketer'}
                onChange={() => setApplicantType('marketer')}
              />
              {t.marketer}
            </label>
          </div>
        </div>

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
    </div>
  );
}
