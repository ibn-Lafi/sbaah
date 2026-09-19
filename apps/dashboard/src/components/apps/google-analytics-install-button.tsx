'use client';

import { useState } from 'react';
import { ApiRequestError } from '@/lib/api/client';
import { saveGoogleAnalyticsMeasurementId } from '@/lib/api/google-analytics';

function PlusIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className={className}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function GoogleAnalyticsInstallButton({
  accessToken,
  locale,
  label,
}: {
  accessToken: string;
  locale: 'ar' | 'en';
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const [measurementId, setMeasurementId] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const ar = locale === 'ar';

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const normalized = measurementId.trim().toUpperCase();
    if (!/^G-[A-Z0-9]+$/.test(normalized)) {
      setError(ar ? 'أدخل معرّف قياس صحيحًا مثل G-XXXXXXXXXX' : 'Enter a valid Measurement ID such as G-XXXXXXXXXX');
      return;
    }
    setSaving(true);
    try {
      await saveGoogleAnalyticsMeasurementId(accessToken, normalized);
      setOpen(false);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : ar ? 'تعذر حفظ الإعداد' : 'Could not save the setting');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="border-border-default text-text-primary hover:bg-surface-card flex items-center gap-1.5 rounded-full border px-4 py-2 text-[13px] font-semibold"
      >
        <PlusIcon className="h-3.5 w-3.5" />
        {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/40 p-4 backdrop-blur-[2px]" onClick={() => setOpen(false)}>
          <div role="dialog" aria-modal="true" className="bg-surface-card w-full max-w-md rounded-[28px] p-5 shadow-2xl sm:p-6" onClick={(event) => event.stopPropagation()}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="mb-1 text-lg font-bold text-text-primary">Google Analytics</h2>
                <p className="text-sm text-text-secondary">
                  {ar ? 'أدخل معرّف القياس الخاص بموقعك في Google Analytics.' : 'Enter your website Measurement ID from Google Analytics.'}
                </p>
              </div>
              <button type="button" onClick={() => setOpen(false)} aria-label={ar ? 'إغلاق' : 'Close'} className="bg-surface-subtle text-text-secondary flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xl">×</button>
            </div>
            <form onSubmit={(event) => void save(event)} className="flex flex-col gap-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-text-primary">{ar ? 'معرّف القياس' : 'Measurement ID'}</label>
                <input
                  value={measurementId}
                  onChange={(event) => setMeasurementId(event.target.value)}
                  placeholder="G-XXXXXXXXXX"
                  dir="ltr"
                  autoComplete="off"
                  className="border-border-default bg-surface-card text-text-primary h-11 w-full rounded-full border px-4 text-sm outline-none focus:border-brand"
                />
              </div>
              {error && <p className="text-sm text-red-600">{error}</p>}
              <button type="submit" disabled={saving} className="bg-brand text-white h-11 rounded-full px-5 text-sm font-semibold disabled:opacity-60">
                {saving ? (ar ? 'جارٍ الحفظ...' : 'Saving...') : (ar ? 'حفظ وتثبيت' : 'Save & install')}
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
