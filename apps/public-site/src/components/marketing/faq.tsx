'use client';

import { useEffect, useState } from 'react';
import type { PlatformSettings } from '@sbaah/shared';
import type { Locale } from '@/lib/i18n/locales';
import { MARKETING_CONTENT } from '@/lib/marketing/content';
import { Reveal } from './reveal';
import { ChevronDownIcon } from './icons';
import { apiGet } from '@/lib/api/client';

export function Faq({ locale }: { locale: Locale }) {
  const t = MARKETING_CONTENT[locale].faq;
  const [settings,setSettings]=useState<PlatformSettings|null>(null);
  useEffect(()=>{void apiGet<PlatformSettings>('/public/platform-settings').then(setSettings).catch(()=>undefined);},[]);
  const title=(locale==='ar'?settings?.faq_title_ar:settings?.faq_title_en)?.trim() || t.title;
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section id="faq" className="bg-surface-card px-6 py-16 sm:py-24">
      <Reveal className="mx-auto max-w-2xl text-center">
        <h2 className="font-display text-2xl font-semibold text-text-primary sm:text-4xl">{title}</h2>
      </Reveal>

      <Reveal delayMs={150} className="mx-auto mt-10 flex max-w-2xl flex-col gap-3">
        {t.items.map((item, index) => {
          const open = openIndex === index;
          return (
            <div key={item.question} className="rounded-card overflow-hidden border border-border-subtle bg-surface-card">
              <button
                type="button"
                onClick={() => setOpenIndex(open ? null : index)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-3 px-5 py-4 text-start text-sm font-semibold text-text-primary sm:text-base"
              >
                {item.question}
                <ChevronDownIcon
                  className={`h-4 w-4 flex-none text-text-secondary transition-transform ${open ? 'rotate-180' : ''}`}
                />
              </button>
              {open && <p className="px-5 pb-4 text-sm leading-relaxed text-text-secondary">{item.answer}</p>}
            </div>
          );
        })}
      </Reveal>
    </section>
  );
}
