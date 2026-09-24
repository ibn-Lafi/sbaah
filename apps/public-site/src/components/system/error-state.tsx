'use client';

import { useEffect } from 'react';

type ErrorStateProps = {
  code: string;
  eyebrowAr: string;
  eyebrowEn: string;
  titleAr: string;
  titleEn: string;
  descriptionAr: string;
  descriptionEn: string;
  actionHref?: string;
  actionAr?: string;
  actionEn?: string;
  onRetry?: () => void;
};

export function ErrorState({
  code, eyebrowAr, eyebrowEn, titleAr, titleEn, descriptionAr, descriptionEn,
  actionHref='/', actionAr='العودة للرئيسية', actionEn='Back home', onRetry,
}: ErrorStateProps) {
  return (
    <main className="relative min-h-[100svh] overflow-hidden bg-[#f5f2f7] text-[#201c24]">
      <div className="pointer-events-none absolute inset-0 opacity-70" aria-hidden="true">
        <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#68458A]/10 blur-3xl" />
        <div className="absolute -bottom-32 -left-20 h-96 w-96 rounded-full bg-[#68458A]/8 blur-3xl" />
      </div>
      <div className="relative mx-auto flex min-h-[100svh] max-w-5xl flex-col items-center justify-center px-6 py-12 text-center">
        <div className="sbaah-error-scene mb-8 h-52 w-full max-w-md sm:h-64" aria-hidden="true">
          <svg viewBox="0 0 520 300" className="h-full w-full overflow-visible">
            <path className="sbaah-error-route" d="M38 222 C112 222 92 84 180 94 S246 244 326 210 S382 94 482 116" fill="none" stroke="#68458A" strokeWidth="5" strokeLinecap="round" />
            <g className="sbaah-error-building">
              <path d="M188 238V106l72-38 72 38v132" fill="#fff" stroke="#201c24" strokeWidth="4" strokeLinejoin="round"/>
              <path d="M238 238v-66h44v66M215 126h24v25h-24M282 126h24v25h-24" fill="#f0e8f5" stroke="#68458A" strokeWidth="3"/>
              <circle cx="274" cy="205" r="3.5" fill="#68458A"/>
            </g>
            <g className="sbaah-error-pin">
              <path d="M92 86c0-22 17-39 39-39s39 17 39 39c0 31-39 68-39 68S92 117 92 86Z" fill="#68458A"/>
              <circle cx="131" cy="86" r="13" fill="#f5f2f7"/>
            </g>
            <circle className="sbaah-error-dot" cx="38" cy="222" r="8" fill="#68458A"/>
            <path d="M62 250H458" stroke="#201c24" strokeOpacity=".13" strokeWidth="2"/>
          </svg>
        </div>

        <div className="mb-4 flex items-center gap-3 text-[11px] font-semibold tracking-[.28em] text-[#68458A]">
          <span className="h-px w-9 bg-[#68458A]/45" />
          <span>ERROR {code}</span>
          <span className="h-px w-9 bg-[#68458A]/45" />
        </div>
        <p className="mb-2 text-sm font-medium text-[#68458A]">{eyebrowAr} · {eyebrowEn}</p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">{titleAr}</h1>
        <p dir="ltr" className="mt-2 text-xl font-medium text-black/55 sm:text-2xl">{titleEn}</p>
        <p className="mt-5 max-w-xl text-sm leading-7 text-black/55 sm:text-base">{descriptionAr}</p>
        <p dir="ltr" className="mt-1 max-w-xl text-sm leading-6 text-black/40">{descriptionEn}</p>

        <div className="mt-8 flex w-full max-w-md flex-col justify-center gap-3 sm:flex-row">
          {onRetry ? <button onClick={onRetry} className="min-h-12 flex-1 bg-[#68458A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#563771] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#68458A]">{actionAr}<span className="mx-2 opacity-50">/</span>{actionEn}</button>
          : <a href={actionHref} className="min-h-12 flex-1 bg-[#68458A] px-6 py-3 text-sm font-semibold text-white transition hover:bg-[#563771] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#68458A]">{actionAr}<span className="mx-2 opacity-50">/</span>{actionEn}</a>}
          <button onClick={() => history.length > 1 ? history.back() : location.assign('/')} className="min-h-12 flex-1 border border-black/15 bg-white/65 px-6 py-3 text-sm font-semibold transition hover:bg-white">رجوع <span className="mx-2 opacity-40">/</span> Back</button>
        </div>
      </div>
    </main>
  );
}

export function RuntimeErrorState({ reset }: { reset: () => void }) {
  useEffect(() => {}, []);
  return <ErrorState code="500" eyebrowAr="تعذر إكمال المسار" eyebrowEn="Route interrupted" titleAr="حدث خطأ غير متوقع" titleEn="Something went wrong" descriptionAr="واجهنا مشكلة مؤقتة أثناء تحميل هذه الصفحة. يمكنك إعادة المحاولة، أو العودة ثم متابعة تصفح الموقع." descriptionEn="We hit a temporary problem while loading this page. Try again, or go back and continue browsing." actionAr="إعادة المحاولة" actionEn="Try again" onRetry={reset} />;
}
