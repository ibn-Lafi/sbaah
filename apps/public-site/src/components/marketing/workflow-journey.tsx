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
          <h2 className="font-display mt-5 text-[2.45rem] font-extrabold leading-[1.12] tracking-tight text-text-primary sm:text-6xl">
            {ar?<><span>من أول عميل ...</span><br/><span className="text-brand">إلى إتمام العمل</span></>:<>From first lead ...<br/><span className="text-brand">to completed work</span></>}
          </h2>
          <p className="mt-5 text-xl font-medium text-text-secondary sm:text-2xl">{ar?'كل خطوة مرتبطة بالتي بعدها.':'Every step connected to the next.'}</p>
          <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-text-secondary sm:text-lg">{ar?'بدل ما تكون أعمالك موزعة بين أدوات مختلفة، سبعة تربط رحلة العمل كاملة في مكان واحد.':'Instead of scattered tools, Sbaah connects your entire workflow in one place.'}</p>
        </div>

        <div className="relative mx-auto mt-12 max-w-2xl px-1 sm:mt-16 sm:px-4">
          <svg className="pointer-events-none absolute inset-y-0 left-1/2 h-full w-14 -translate-x-1/2 overflow-visible sm:w-20" viewBox="0 0 80 720" preserveAspectRatio="none" aria-hidden="true">
            <path d="M40 8 C68 70 12 120 40 180 C68 240 12 300 40 360 C68 420 12 480 40 540 C68 600 12 650 40 712" fill="none" stroke="rgba(124,58,237,.30)" strokeWidth="1.2" strokeDasharray="5 7" strokeLinecap="round"/>
          </svg>
          {steps[locale].map(([title,body],i)=>{
            const left=i%2===0;
            return <div key={title} className={`relative mb-5 flex min-h-[98px] w-[46%] items-center sm:mb-7 sm:min-h-[126px] sm:w-[44%] ${left?'mr-auto ml-0':'ml-auto mr-0'}`}>
              <span className={`absolute top-1/2 z-30 h-2.5 w-2.5 -translate-y-1/2 rounded-full bg-brand shadow-[0_0_0_5px_rgba(237,233,254,.95),0_0_18px_rgba(124,58,237,.28)] sm:h-3 sm:w-3 ${left?'-left-[2.1rem] sm:-left-[3.55rem]':'-right-[2.1rem] sm:-right-[3.55rem]'}`}/>
              <article className="group relative w-full rounded-[22px] border border-white/90 bg-white/82 px-3.5 py-3.5 shadow-[0_16px_44px_rgba(52,32,92,.08)] backdrop-blur-2xl sm:rounded-[28px] sm:px-5 sm:py-5">
                <div className={`absolute top-1/2 z-20 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-[17px] border border-white bg-[linear-gradient(145deg,rgba(250,247,255,.98),rgba(237,228,255,.96))] text-brand shadow-[0_10px_26px_rgba(111,58,190,.16)] sm:h-[62px] sm:w-[62px] sm:rounded-[21px] ${left?'-left-6 sm:-left-8':'-right-6 sm:-right-8'}`}>
                  <svg viewBox="0 0 24 24" className="h-[22px] w-[22px] sm:h-8 sm:w-8" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={iconPaths[i]}/></svg>
                </div>
                <div className={left?'pl-6 text-right sm:pl-8':'pr-6 text-right sm:pr-8'}>
                  <span className="inline-flex rounded-full bg-purple-50 px-1.5 py-0.5 text-[9px] font-black leading-none text-brand sm:px-2 sm:py-1 sm:text-[11px]">{String(i+1).padStart(2,'0')}</span>
                  <h3 className="mt-1.5 text-[13px] font-black leading-[1.25] text-text-primary sm:mt-2 sm:text-xl">{title}</h3>
                  <p className="mt-1 text-[9.5px] leading-[1.6] text-text-secondary sm:mt-1.5 sm:text-sm sm:leading-6">{body}</p>
                </div>
              </article>
            </div>
          })}
        </div>

        <div className="relative mx-auto mt-10 min-h-[610px] max-w-5xl sm:min-h-[690px]">
          <div className="absolute left-1/2 top-16 h-[500px] w-[250px] -translate-x-1/2 rotate-[-5deg] rounded-[48px] bg-[#1c1c1e] p-[4px] shadow-[0_32px_90px_rgba(35,16,70,.35)] sm:h-[570px] sm:w-[285px] sm:rounded-[54px]">
            <span className="absolute -left-[3px] top-[92px] h-8 w-[3px] rounded-l bg-[#2c2c2e]"/>
            <span className="absolute -left-[3px] top-[136px] h-14 w-[3px] rounded-l bg-[#2c2c2e]"/>
            <span className="absolute -left-[3px] top-[200px] h-14 w-[3px] rounded-l bg-[#2c2c2e]"/>
            <span className="absolute -right-[3px] top-[145px] h-20 w-[3px] rounded-r bg-[#2c2c2e]"/>
            <div className="relative h-full overflow-hidden rounded-[44px] bg-black sm:rounded-[50px]">
              <img
                src="https://raw.githubusercontent.com/ibn-Lafi/sbaah/claude/real-estate-saas-platform-sp7ua9/IMG_2273.png"
                alt={ar?'لوحة قيادة سبعة على الجوال':'Sbaah mobile dashboard'}
                className="absolute inset-0 h-full w-full object-cover object-top"
                loading="lazy"
              />
            </div>
          </div>

          <div className="absolute left-0 top-36 rounded-2xl border border-white bg-white/95 p-4 shadow-xl sm:left-[8%]"><b className="text-sm">واتساب</b><p className="mt-1 text-xs text-text-secondary">استقبال العملاء</p></div>
          <div className="absolute right-0 top-20 rounded-2xl border border-white bg-white/95 p-4 shadow-xl sm:right-[7%]"><b className="text-sm text-brand">سبعة AI</b><p className="mt-1 text-xs text-text-secondary">مساعد ذكي ينجز معك</p></div>
          <div className="absolute right-0 top-64 rounded-2xl border border-white bg-white/95 p-4 shadow-xl sm:right-[3%]"><b className="text-sm">إدارة العقارات</b><p className="mt-1 text-xs text-text-secondary">والمشاريع</p></div>
          <div className="absolute left-0 top-[330px] rounded-2xl border border-white bg-white/95 p-4 shadow-xl sm:left-[4%]"><b className="text-sm">مواعيد ومعاينات</b><p className="mt-1 text-xs text-text-secondary">بكل سهولة</p></div>

          <div className="absolute inset-x-0 bottom-4 flex flex-col items-center">
            <p className="mt-4 text-sm text-white/90 drop-shadow">{ar?'كل أعمالك العقارية ... في مكان واحد':'All your real-estate work ... in one place'}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
