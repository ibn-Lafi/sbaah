import type { Locale } from '@/lib/i18n/locales';

const VILLA_IMAGE = 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=92';

const steps = {
  ar: [
    ['عميل محتمل','استقبل العملاء من موقعك وجميع القنوات.'],
    ['متابعة ذكية','سجل وتابع كل تواصل ولا تفوّت أي فرصة.'],
    ['عقار مناسب','اقترح أفضل العقارات بناءً على احتياج العميل.'],
    ['موعد ومعاينة','نظّم المواعيد والمعاينات بسهولة.'],
    ['عقد وإتمام','أدر العقود والإجراءات حتى الإتمام.'],
    ['متابعة مستمرة','حافظ على العلاقة بعد الإتمام وزِد فرصك المستقبلية.'],
  ],
  en: [
    ['Potential client','Capture leads from your website and every channel.'],
    ['Smart follow-up','Track every conversation and never miss an opportunity.'],
    ['Right property','Match clients with properties that fit their needs.'],
    ['Visit & viewing','Organize appointments and viewings with ease.'],
    ['Contract & close','Manage contracts and steps through completion.'],
    ['Ongoing follow-up','Keep the relationship going after the deal closes.'],
  ],
} as const;

const iconPaths = [
  'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM5 21a7 7 0 0 1 14 0M19 8v6M16 11h6',
  'M9 5h6M9 3h6v4H9zM6 5H5a2 2 0 0 0-2 2v13h18V7a2 2 0 0 0-2-2h-1M7 11h10M7 15h7',
  'M3 11.5 12 4l9 7.5M5.5 10v10h13V10M9 20v-6h6v6',
  'M6 3v3M18 3v3M4 8h16M5 5h14a2 2 0 0 1 2 2v13H3V7a2 2 0 0 1 2-2M8 12h3M8 16h6',
  'M7 3h10l3 3v15H4V3h3M8 13l2.5 2.5L16 10M14 3v4h4',
  'M5 20v-5M10 20V9M15 20V4M20 20v-8',
];

export function WorkflowJourney({locale}:{locale:Locale}) {
  const ar=locale==='ar';
  return (
    <section className="workflow-journey relative isolate overflow-hidden bg-surface-card py-16 sm:py-24" dir={ar?'rtl':'ltr'}>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 top-[22%] z-[1] overflow-hidden">
        <img src={VILLA_IMAGE} alt="" className="absolute inset-0 h-full w-full object-cover opacity-95" loading="lazy"/>
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-44 sm:h-56" style={{background:'linear-gradient(to bottom,var(--color-surface-card) 0%,rgba(251,250,255,.94) 22%,rgba(251,250,255,.68) 52%,transparent 100%)'}}/>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-52 sm:h-64" style={{background:'linear-gradient(to top,var(--color-surface-card) 0%,rgba(251,250,255,.96) 18%,rgba(251,250,255,.72) 50%,transparent 100%)'}}/>
        <div className="absolute inset-y-0 left-0 w-16 sm:w-28" style={{background:'linear-gradient(to right,var(--color-surface-card) 0%,rgba(251,250,255,.94) 30%,rgba(251,250,255,.5) 62%,transparent 100%)'}}/>
        <div className="absolute inset-y-0 right-0 w-16 sm:w-28" style={{background:'linear-gradient(to left,var(--color-surface-card) 0%,rgba(251,250,255,.94) 30%,rgba(251,250,255,.5) 62%,transparent 100%)'}}/>
      </div>
 
      <div className="relative z-10 mx-auto max-w-6xl px-5 sm:px-6">
        <div className="mx-auto max-w-3xl text-center">
          <span className="inline-flex rounded-full bg-purple-100/80 px-5 py-2 text-sm font-bold text-brand">{ar?'رحلة العمل مع سبعة':'The Sbaah workflow'}</span>
          <h2 className="font-display mt-5 text-[2.45rem] font-extrabold leading-[1.12] tracking-tight text-text-primary sm:text-6xl">
            {ar?<><span>من أول عميل ...</span><br/><span className="text-brand">إلى إتمام العمل</span></>:<>From first lead ...<br/><span className="text-brand">to completed work</span></>}
          </h2>
          <p className="mt-5 text-xl font-medium text-text-secondary sm:text-2xl">{ar?'كل خطوة مرتبطة بالتي بعدها.':'Every step connected to the next.'}</p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-text-secondary sm:text-lg">{ar?'بدل ما تكون أعمالك موزعة بين أدوات مختلفة، سبعة تربط رحلة العمل كاملة في مكان واحد.':'Instead of scattered tools, Sbaah connects your entire workflow in one place.'}</p>
        </div>

        <div className="relative mx-auto mt-10 max-w-2xl sm:mt-14">
          <div className="absolute bottom-8 left-1/2 top-8 w-px -translate-x-1/2 border-l-2 border-dashed border-purple-300"/>
          {steps[locale].map(([title,body],i)=>{
            const side=i%2===0?'md:mr-auto md:ml-0':'md:ml-auto md:mr-0';
            return <div key={title} className={`relative mb-3 flex min-h-[76px] w-[47%] items-center ${i%2===0?'mr-auto ml-0':'ml-auto mr-0'} md:mb-3 md:min-h-[104px] md:w-[46%] ${side}`}>
              <div className="w-full rounded-[16px] border border-white/80 bg-white/90 px-2.5 py-2 shadow-[0_10px_26px_rgba(80,48,150,.07)] backdrop-blur-xl sm:rounded-[22px] sm:px-5 sm:py-4">
                <span className="text-[9px] font-extrabold text-brand sm:text-xs">{String(i+1).padStart(2,'0')}</span>
                <h3 className="mt-0.5 text-[12px] font-extrabold leading-4 text-text-primary sm:mt-1 sm:text-lg">{title}</h3>
                <p className="mt-0.5 text-[9px] leading-[1.45] text-text-secondary sm:mt-1 sm:text-sm sm:leading-6">{body}</p>
              </div>
              <div className={`absolute top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-purple-100 text-brand shadow-lg sm:h-12 sm:w-12 md:h-14 md:w-14 ${i%2===0?'-left-[2.65rem] md:-left-[4.6rem]':'-right-[2.65rem] md:-right-[4.6rem]'}`}>
                <svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-6 sm:w-6 md:h-8 md:w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[i]}/></svg>
              </div>
            </div>
          })}
        </div>

        <div className="relative mx-auto mt-10 min-h-[610px] max-w-5xl sm:min-h-[690px]">
          <div className="absolute left-1/2 top-16 h-[500px] w-[285px] -translate-x-1/2 rotate-[-5deg] overflow-hidden rounded-[52px] border-[8px] border-[#111113] bg-white shadow-[0_32px_90px_rgba(35,16,70,.35)] sm:h-[570px] sm:w-[330px] sm:rounded-[58px]">
            <div className="relative rounded-t-[43px] bg-[#1d1729] px-5 pb-4 pt-8 text-white sm:rounded-t-[49px]">
              <div className="absolute left-1/2 top-2.5 h-[22px] w-[78px] -translate-x-1/2 rounded-full bg-black sm:h-[24px] sm:w-[88px]"/>
              <div className="absolute left-[calc(50%+25px)] top-[17px] h-1.5 w-1.5 rounded-full bg-[#23242b] sm:left-[calc(50%+28px)] sm:top-[18px]"/>
              <div className="flex items-center justify-between"><b>سبعة</b><span>•••</span></div>
            </div>
            <div className="p-4 text-right">
              <div className="grid grid-cols-2 gap-2"><div className="rounded-2xl bg-purple-50 p-3"><small>إجمالي العملاء</small><b className="mt-2 block text-2xl">162</b><span className="text-xs text-emerald-500">↑ 12%</span></div><div className="rounded-2xl bg-purple-50 p-3"><small>العقارات النشطة</small><b className="mt-2 block text-2xl">48</b><span className="text-xs text-emerald-500">↑ 8%</span></div></div>
              <div className="mt-4 grid grid-cols-4 gap-2 text-center text-[10px]"><span>العملاء</span><span>المواعيد</span><span>العقارات</span><span>العقود</span></div>
              <h4 className="mt-5 font-bold">العقارات المميزة</h4>
              <img src={VILLA_IMAGE} alt="" className="mt-3 h-40 w-full rounded-2xl object-cover"/>
            </div>
          </div>

          <div className="absolute left-0 top-36 rounded-2xl border border-white bg-white/95 p-4 shadow-xl sm:left-[8%]"><b className="text-sm">واتساب</b><p className="mt-1 text-xs text-text-secondary">استقبال العملاء</p></div>
          <div className="absolute right-0 top-20 rounded-2xl border border-white bg-white/95 p-4 shadow-xl sm:right-[7%]"><b className="text-sm text-brand">سبعة AI</b><p className="mt-1 text-xs text-text-secondary">مساعد ذكي ينجز معك</p></div>
          <div className="absolute right-0 top-64 rounded-2xl border border-white bg-white/95 p-4 shadow-xl sm:right-[3%]"><b className="text-sm">إدارة العقارات</b><p className="mt-1 text-xs text-text-secondary">والمشاريع</p></div>
          <div className="absolute left-0 top-[330px] rounded-2xl border border-white bg-white/95 p-4 shadow-xl sm:left-[4%]"><b className="text-sm">مواعيد ومعاينات</b><p className="mt-1 text-xs text-text-secondary">بكل سهولة</p></div>

          <div className="absolute inset-x-0 bottom-4 flex flex-col items-center">
            <a href={`/${locale}/register`} className="inline-flex h-16 min-w-[280px] items-center justify-center rounded-full bg-brand px-8 text-xl font-bold text-white shadow-[0_18px_45px_rgba(124,58,237,.35)] transition-transform hover:scale-[1.02]">{ar?'ابدأ رحلتك الآن':'Start your journey'}</a>
            <p className="mt-4 text-sm text-white/90 drop-shadow">{ar?'كل أعمالك العقارية ... في مكان واحد':'All your real-estate work ... in one place'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
