'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/i18n/locales';

const audiences = {
  ar: [
    { title:'المسوق العقاري', eyebrow:'سوّق وتابع', headline:'من أول استفسار إلى الفرصة التالية.', body:'اجمع العملاء والعقارات والمتابعات في مساحة واحدة، واعرف أين وصلت كل فرصة بدون تشتت.', points:['استقبال وتنظيم العملاء','ربط العميل بالعقار المناسب','متابعة المواعيد والفرص'], icon:'M4 20h16M6 17V8l6-4 6 4v9M9 11h1M14 11h1M9 14h1M14 14h1' },
    { title:'الوسيط العقاري', eyebrow:'نظّم أعمالك', headline:'كل عميل وعقار ومتابعة أمامك.', body:'بدل التنقل بين المحادثات والملفات والتقويم، اجعل رحلة الوساطة مترابطة وواضحة من مكان واحد.', points:['إدارة العملاء والطلبات','تنظيم العقارات والمواعيد','حفظ العقود والارتباطات'], icon:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a6 6 0 0 1 12 0M17 8h5M19.5 5.5v5M16 16l2 2 4-4' },
    { title:'المطور العقاري', eyebrow:'أدر مشاريعك', headline:'مشاريعك ووحداتك وعملاؤك في منظومة واحدة.', body:'اعرض مشاريعك باحترافية، نظّم العقارات والوحدات، واستقبل الاهتمامات وتابعها من نفس اللوحة.', points:['إدارة المشاريع والوحدات','موقع يعرض مشاريعك بهويتك','متابعة العملاء والاهتمامات'], icon:'M3 21h18M5 21V9l7-6 7 6v12M9 12h2M14 12h2M9 16h2M14 16h2' },
  ],
  en: [
    { title:'Real-estate marketer', eyebrow:'Market & follow up', headline:'From the first inquiry to the next opportunity.', body:'Bring clients, properties and follow-ups into one workspace and see exactly where every opportunity stands.', points:['Capture and organize leads','Match clients to properties','Track appointments and opportunities'], icon:'M4 20h16M6 17V8l6-4 6 4v9M9 11h1M14 11h1M9 14h1M14 14h1' },
    { title:'Real-estate broker', eyebrow:'Organize your work', headline:'Every client, property and follow-up in view.', body:'Replace scattered chats, files and calendars with one connected brokerage workflow.', points:['Manage clients and requests','Organize properties and appointments','Keep contracts and links together'], icon:'M8 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM2 21a6 6 0 0 1 12 0M17 8h5M19.5 5.5v5M16 16l2 2 4-4' },
    { title:'Real-estate developer', eyebrow:'Manage projects', headline:'Projects, units and clients in one system.', body:'Showcase projects professionally, organize inventory and follow every expression of interest from the same dashboard.', points:['Manage projects and units','A branded project website','Track clients and interest'], icon:'M3 21h18M5 21V9l7-6 7 6v12M9 12h2M14 12h2M9 16h2M14 16h2' },
  ],
} as const;

export function AudienceSection({locale}:{locale:Locale}) {
  const ar=locale==='ar';
  const [active,setActive]=useState(0);
  const item=audiences[locale][active];
  return <section className="bg-surface-card px-4 py-16 sm:px-6 sm:py-24" dir={ar?'rtl':'ltr'}>
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto max-w-3xl text-center">
        <span className="text-brand text-xs font-bold sm:text-sm">{ar?'مصممة لطريقة عملك':'Built around the way you work'}</span>
        <h2 className="font-display mt-3 text-3xl font-black leading-tight text-text-primary sm:text-5xl">{ar?'سبعة تناسب دورك في السوق العقاري':'Sbaah fits your role in real estate'}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-secondary sm:text-lg">{ar?'سواء كنت مسوقًا أو وسيطًا أو مطورًا، استخدم نفس المنصة بالطريقة التي تناسب أعمالك.':'Whether you market, broker or develop, use the same platform around your workflow.'}</p>
      </div>

      <div className="mx-auto mt-8 grid max-w-2xl grid-cols-3 rounded-2xl bg-purple-50/80 p-1.5 sm:mt-10 sm:rounded-3xl sm:p-2">
        {audiences[locale].map((x,i)=><button key={x.title} type="button" onClick={()=>setActive(i)} className={`rounded-xl px-2 py-3 text-[11px] font-bold transition-all sm:rounded-2xl sm:px-5 sm:py-4 sm:text-base ${active===i?'bg-white text-brand shadow-[0_8px_24px_rgba(74,39,120,.10)]':'text-text-secondary'}`}>{x.title}</button>)}
      </div>

      <div className="relative mx-auto mt-6 max-w-5xl overflow-hidden rounded-[28px] border border-purple-100/80 bg-gradient-to-br from-white via-white to-purple-50/80 p-5 shadow-[0_24px_70px_rgba(55,30,100,.08)] sm:mt-8 sm:rounded-[36px] sm:p-10">
        <div className="pointer-events-none absolute -left-16 -top-20 h-56 w-56 rounded-full bg-purple-200/25 blur-3xl"/>
        <div className="relative grid items-center gap-7 md:grid-cols-[1.05fr_.95fr] md:gap-12">
          <div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand text-white shadow-[0_12px_30px_rgba(124,58,237,.22)] sm:h-16 sm:w-16 sm:rounded-[20px]">
              <svg viewBox="0 0 24 24" className="h-6 w-6 sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={item.icon}/></svg>
            </div>
            <p className="mt-5 text-xs font-bold text-brand sm:text-sm">{item.eyebrow}</p>
            <h3 className="font-display mt-2 text-2xl font-black leading-tight text-text-primary sm:text-4xl">{item.headline}</h3>
            <p className="mt-4 text-sm leading-7 text-text-secondary sm:text-base sm:leading-8">{item.body}</p>
          </div>
          <div className="rounded-[22px] border border-white bg-white/80 p-4 shadow-[0_14px_40px_rgba(60,35,105,.06)] backdrop-blur-xl sm:rounded-[28px] sm:p-6">
            {item.points.map((point,i)=><div key={point} className={`flex items-center gap-3 py-3 sm:gap-4 sm:py-4 ${i<item.points.length-1?'border-b border-border-subtle':''}`}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-purple-100 text-brand sm:h-10 sm:w-10"><svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2.2"><path d="m7 12 3 3 7-7"/></svg></span>
              <span className="text-[12px] font-bold text-text-primary sm:text-base">{point}</span>
            </div>)}
          </div>
        </div>
      </div>
    </div>
  </section>;
}
