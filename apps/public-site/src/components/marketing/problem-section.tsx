import type { Locale } from '@/lib/i18n/locales';

const topCards = {
  ar: [
    { title:'المواعيد والمتابعات', body:'في تقويم لا يرتبط بباقي عملك.', kind:'calendar' },
    { title:'العقارات والمشاريع', body:'في ملفات وجداول متفرقة.', kind:'files' },
    { title:'العملاء والتواصل', body:'في واتساب ورسائل متعددة.', kind:'social' },
    { title:'الموقع الإلكتروني', body:'في نظام منفصل وبدون ربط مباشر بالعملاء.', kind:'website' },
  ],
  en: [
    { title:'Appointments & follow-up', body:'In a calendar disconnected from the rest of your work.', kind:'calendar' },
    { title:'Properties & projects', body:'Scattered across files and sheets.', kind:'files' },
    { title:'Clients & communication', body:'Across WhatsApp and multiple inboxes.', kind:'social' },
    { title:'Your website', body:'In a separate system, disconnected from clients.', kind:'website' },
  ],
} as const;

const bottomCards = {
  ar: [
    ['سبعة AI','مساعد ذكي ينجز معك المهام','ai'],
    ['إدارة العقارات والمشاريع','نظّم عقاراتك ومشاريعك ووحداتك بسهولة','property'],
    ['إدارة العملاء','تابع كل عميل وفرصة في مكان واحد','clients'],
    ['موقعك الإلكتروني','موقع عقاري بهويتك ونطاقك الخاص','screen'],
  ],
  en: [
    ['Sbaah AI','A smart assistant that gets work done with you','ai'],
    ['Properties & projects','Organize properties, projects and units with ease','property'],
    ['Client management','Track every client and opportunity in one place','clients'],
    ['Your website','A real-estate website with your brand and domain','screen'],
  ],
} as const;

function CalendarIcon(){
  return <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-brand sm:h-12 sm:w-12"><svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v4M17 3v4M3 10h18"/><circle cx="16.5" cy="16.5" r="3.5" fill="white"/><path d="M16.5 14.8v2l1.3.8"/></svg></div>
}
function WebsiteIcon(){
  return <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-100 text-brand sm:h-12 sm:w-12"><svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="4" width="18" height="16" rx="3"/><path d="M3 9h18M7 6.5h.01M10 6.5h.01"/></svg></div>
}
function FilesIcon(){
  return <div className="flex items-end justify-center gap-1">
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#107c41] text-[10px] font-black text-white sm:h-10 sm:w-10 sm:text-xs">X</span>
    <span className="flex h-9 w-8 items-center justify-center rounded-lg bg-[#0f9d58] text-white sm:h-11 sm:w-10"><svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 5h14v14H5zM5 10h14M10 5v14"/></svg></span>
    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#d9d5ff] text-[9px] font-bold text-[#6657d9] sm:h-9 sm:w-9">DOC</span>
  </div>
}
function SocialIcon(){
  return <div className="flex items-center justify-center gap-1 sm:gap-1.5">
    <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#25D366] text-white sm:h-10 sm:w-10"><svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="currentColor"><path d="M12 3a8.5 8.5 0 0 0-7.3 12.85L3.5 20.5l4.77-1.24A8.5 8.5 0 1 0 12 3Zm4.55 12.02c-.2.55-1.15 1.04-1.59 1.1-.42.06-.96.09-1.55-.1-.36-.12-.82-.27-1.41-.53-2.48-1.07-4.1-3.57-4.22-3.73-.12-.16-1-1.33-1-2.54s.63-1.8.86-2.05c.22-.24.48-.3.64-.3h.46c.15 0 .35-.06.55.42.2.49.68 1.67.74 1.79.06.12.1.26.02.42-.08.16-.12.26-.24.4-.12.14-.25.31-.36.42-.12.12-.24.25-.1.49.14.24.62 1.03 1.34 1.67.92.82 1.7 1.08 1.94 1.2.24.12.38.1.52-.06.14-.16.6-.7.76-.94.16-.24.32-.2.54-.12.22.08 1.4.66 1.64.78.24.12.4.18.46.28.06.1.06.58-.14 1.13Z"/></svg></span>
    <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#28a8e9] text-white sm:h-10 sm:w-10"><svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="currentColor"><path d="M4 5h16v11H8l-4 3V5Zm4 5h2v2H8v-2Zm3 0h2v2h-2v-2Zm3 0h2v2h-2v-2Z"/></svg></span>
    <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045] text-white sm:h-10 sm:w-10"><svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" stroke="currentColor" strokeWidth="2"><rect x="4" y="4" width="16" height="16" rx="5"/><circle cx="12" cy="12" r="3.5"/><circle cx="17.5" cy="6.5" r=".7" fill="currentColor"/></svg></span>
    <span className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-[#eaf1ff] text-[#5575a8] sm:h-10 sm:w-10"><svg viewBox="0 0 24 24" className="h-4 w-4 sm:h-5 sm:w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18v12H3zM3 7l9 7 9-7"/></svg></span>
  </div>
}
function FeatureIcon({kind}:{kind:string}){
  const paths:Record<string,string>={
    ai:'M12 3l1.3 3.4L17 7.8l-3.7 1.4L12 13l-1.3-3.8L7 7.8l3.7-1.4L12 3Zm6 10 .8 2.2L21 16l-2.2.8L18 19l-.8-2.2L15 16l2.2-.8L18 13Z',
    property:'M4 21h16M6 21V7l6-4 6 4v14M9 10h1M14 10h1M9 14h1M14 14h1',
    clients:'M16 20v-1.5a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4V20M9.5 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M21 20v-1.5a4 4 0 0 0-3-3.8',
    screen:'M3 4h18v13H3zM8 21h8M12 17v4'
  };
  return <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-100 text-brand sm:h-12 sm:w-12 sm:rounded-2xl"><svg viewBox="0 0 24 24" className="h-5 w-5 sm:h-7 sm:w-7" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d={paths[kind]}/></svg></span>
}

export function ProblemSection({locale}:{locale:Locale}){
  const ar=locale==='ar';
  return <section className="relative overflow-hidden bg-surface-card px-3 py-14 sm:px-6 sm:py-24" dir={ar?'rtl':'ltr'}>
    <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_28%,rgba(124,58,237,.08),transparent_28%),radial-gradient(circle_at_86%_75%,rgba(168,85,247,.07),transparent_26%)]"/>
    <div className="relative mx-auto max-w-6xl">
      <div className="text-center">
        <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-[11px] font-bold text-brand sm:px-4 sm:text-sm">{ar?'المشكلة':'The problem'}</span>
        <h2 className="font-display mx-auto mt-4 max-w-4xl text-[25px] font-black leading-[1.25] tracking-tight text-text-primary sm:text-5xl">
          {ar?<>هل أعمالك العقارية موزعة بين <span className="text-brand">أكثر من مكان؟</span></>:<>Is your real-estate work scattered across <span className="text-brand">too many places?</span></>}
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-[12px] leading-6 text-text-secondary sm:mt-5 sm:text-lg">{ar?'كثير من المسوقين والوسطاء والمطورين يستخدمون عدة أدوات وأنظمة منفصلة، مما يسبب التشتت ويضيع الوقت والفرص.':'Marketers, brokers and developers often rely on disconnected tools, creating scattered information and missed opportunities.'}</p>
      </div>

      <div className="mt-7 grid grid-cols-4 gap-1.5 sm:mt-12 sm:gap-5">
        {topCards[locale].map((item)=><article key={item.title} className="flex min-h-[150px] flex-col items-center rounded-[18px] border border-white/90 bg-white/90 px-1.5 py-4 text-center shadow-[0_14px_38px_rgba(60,35,105,.07)] backdrop-blur-xl sm:min-h-[230px] sm:rounded-[28px] sm:px-6 sm:py-7">
          <div className="flex h-12 items-center justify-center sm:h-16">{item.kind==='calendar'?<CalendarIcon/>:item.kind==='files'?<FilesIcon/>:item.kind==='social'?<SocialIcon/>:<WebsiteIcon/>}</div>
          <h3 className="mt-2 text-[9px] font-black leading-[1.35] text-text-primary sm:mt-4 sm:text-lg">{item.title}</h3>
          <p className="mt-1 text-[7px] leading-[1.55] text-text-secondary sm:mt-2 sm:text-sm sm:leading-6">{item.body}</p>
        </article>)}
      </div>

      <div className="mt-4 grid grid-cols-4 gap-1.5 px-1 text-center text-[7px] italic text-text-secondary sm:mt-6 sm:gap-5 sm:text-sm">
        <span>{ar?'فرص تضيع':'Missed opportunities'}</span><span>{ar?'بيانات غير منظمة':'Unorganized data'}</span><span>{ar?'معلومات متفرقة':'Scattered information'}</span><span>{ar?'استفسارات لا تتصل':'Disconnected inquiries'}</span>
      </div>

      <div className="relative mx-auto mt-7 max-w-xl sm:mt-10">
        <div className="absolute left-1/2 -top-7 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full bg-brand text-white shadow-lg sm:-top-9 sm:h-10 sm:w-10">↓</div>
        <div className="flex items-center justify-center gap-3 rounded-[22px] border border-purple-200/70 bg-gradient-to-l from-purple-100/95 via-white/95 to-purple-100/95 px-4 py-5 text-center shadow-[0_18px_50px_rgba(124,58,237,.12)] sm:gap-5 sm:rounded-[30px] sm:px-8 sm:py-7">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-brand shadow-sm sm:h-16 sm:w-16"><svg viewBox="0 0 24 24" className="h-7 w-7 sm:h-9 sm:w-9" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 7a3 3 0 0 1 3-3h11v11a3 3 0 0 1-3 3H5V7Z"/><path d="M5 10H3v11h11v-3"/></svg></span>
          <p className="text-[15px] font-black leading-6 text-text-primary sm:text-2xl sm:leading-9">{ar?<>سبعة تجمع كل هذه الرحلة<br/><span className="text-brand">في نظام واحد مترابط.</span></>:<>Sbaah brings the entire journey together<br/><span className="text-brand">in one connected system.</span></>}</p>
        </div>
      </div>

      <div className="mt-16 text-center sm:mt-24">
        <span className="inline-flex rounded-full bg-purple-100 px-3 py-1 text-[11px] font-bold text-brand sm:px-4 sm:text-sm">{ar?'الحل':'The solution'}</span>
        <h2 className="font-display mt-4 text-[25px] font-black leading-tight text-text-primary sm:text-5xl">{ar?<>كل أعمالك العقارية <span className="text-brand">في مكان واحد</span></>:<>Your real-estate business <span className="text-brand">in one place</span></>}</h2>
        <p className="mx-auto mt-3 max-w-2xl text-[11px] leading-5 text-text-secondary sm:mt-4 sm:text-lg">{ar?'موقعك، عملاؤك، عقاراتك، مشاريعك ومساعدك الذكي — كلها تُدار من سبعة.':'Your website, clients, properties, projects and AI assistant — all managed with Sbaah.'}</p>
      </div>

      <div className="mt-7 grid grid-cols-4 gap-1.5 sm:mt-10 sm:gap-5">
        {bottomCards[locale].map(([title,body,kind])=><article key={title} className="flex min-h-[126px] flex-col rounded-[18px] border border-border-subtle bg-white/92 p-2 text-start shadow-[0_12px_34px_rgba(60,35,105,.06)] sm:min-h-[190px] sm:rounded-[26px] sm:p-6">
          <FeatureIcon kind={kind}/>
          <h3 className="mt-2 text-[8px] font-black leading-[1.35] text-text-primary sm:mt-4 sm:text-lg">{title}</h3>
          <p className="mt-1 text-[6.5px] leading-[1.5] text-text-secondary sm:mt-2 sm:text-sm sm:leading-6">{body}</p>
        </article>)}
      </div>
    </div>
  </section>;
}
