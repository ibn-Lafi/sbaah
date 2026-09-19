'use client';

import { useRef } from 'react';
import type { Locale } from '@/lib/i18n/locales';

const testimonials = {
  ar: [
    { company:'روّاد العقارية', person:'م. عبدالله الشهراني', logo:'/brands/ruwad-real-estate.svg', image:'/marketing/dashboard-preview.webp', quote:'منذ اعتمادنا على سبعة، أصبح عرض مشاريعنا وتنظيم العملاء في مكان واحد أسهل بكثير، ووفّر علينا وقتًا في المتابعة اليومية.' },
    { company:'سالم القحطاني', person:'سالم القحطاني', logo:'/testimonials/salem-alqahtani.svg', image:'/marketing/dashboard-preview.webp', quote:'سبعة غيّرت طريقة عملي؛ صار عندي موقع عقاري مرتب وإدارة للعملاء من نفس اللوحة، وهذا سهّل عليّ متابعة الفرص بشكل واضح.' },
    { company:'ديار نجد', person:'أ. فهد المطيري', image:'/marketing/dashboard-preview.webp', quote:'جمع الموقع العقاري وإدارة العملاء في منصة واحدة أعطانا تجربة أكثر تنظيمًا وسهّل على الفريق متابعة الاستفسارات.' },
    { company:'نواف العتيبي', person:'نواف العتيبي', image:'/marketing/dashboard-preview.webp', quote:'أكثر شيء فرق معي هو ترتيب العقارات وطلبات العملاء. بدل التشتت بين أكثر من أداة أصبحت المتابعة أوضح وأسرع.' },
    { company:'مساكن', person:'أ. لمياء السليمان', image:'/marketing/dashboard-preview.webp', quote:'وجدنا في سبعة مساحة عملية تجمع حضورنا الرقمي مع إدارة العقارات والعملاء، بواجهة واضحة تناسب عمل الفريق.' },
    { company:'عبدالعزيز المالكي', person:'عبدالعزيز المالكي', image:'/marketing/dashboard-preview.webp', quote:'ساعدتني سبعة في تقديم مشاريعي بصورة احترافية وتنظيم بيانات العملاء والطلبات بدون الحاجة لاستخدام أنظمة متعددة.' },
  ],
  en: [
    { company:'Ruwad Real Estate', person:'Abdullah Alshahrani', logo:'/brands/ruwad-real-estate.svg', image:'/marketing/dashboard-preview.webp', quote:'Sbaah brought our project showcase and client follow-up into one place, making daily operations much easier to organize.' },
    { company:'Salem Alqahtani', person:'Salem Alqahtani', logo:'/testimonials/salem-alqahtani.svg', image:'/marketing/dashboard-preview.webp', quote:'Sbaah changed how I work. My property website and client management now live in one clear workspace.' },
    { company:'Diyar Najd', person:'Fahad Almutairi', image:'/marketing/dashboard-preview.webp', quote:'Combining our real-estate website and client management gave the team a more organized way to handle inquiries.' },
    { company:'Nawaf Alotaibi', person:'Nawaf Alotaibi', image:'/marketing/dashboard-preview.webp', quote:'Organizing properties and client requests in one place made my follow-up clearer and faster.' },
    { company:'Masaken', person:'Lamia Alsulaiman', image:'/marketing/dashboard-preview.webp', quote:'Sbaah gives us a practical workspace that connects our digital presence with property and client management.' },
    { company:'Abdulaziz Almalki', person:'Abdulaziz Almalki', image:'/marketing/dashboard-preview.webp', quote:'Sbaah helped me present projects professionally and organize client requests without juggling several systems.' },
  ],
};

function Arrow({direction}:{direction:'left'|'right'}) {
  return <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="2.6" className="h-7 w-7" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={direction==='left'?'M27 16H6m8-8-8 8 8 8':'M5 16h21m-8-8 8 8-8 8'}/></svg>;
}

export function Testimonials({locale}:{locale:Locale}) {
  const ar=locale==='ar';
  const scroller=useRef<HTMLDivElement>(null);
  const move=(direction:-1|1)=>{
    const el=scroller.current;
    if(!el) return;
    const card=el.querySelector<HTMLElement>('[data-testimonial-card]');
    el.scrollBy({left:direction*(card?.offsetWidth ?? el.clientWidth),behavior:'smooth'});
  };

  return <section className="bg-surface-card px-0 py-14 sm:px-6 sm:py-24">
    <div className="mx-auto max-w-6xl px-[22px] sm:px-0">
      <div className="mx-auto max-w-3xl text-center">
        <span className="bg-brand/10 text-brand inline-flex rounded-full px-4 py-1.5 text-xs font-semibold">{ar?'آراء عملاء سبعة':'Sbaah customer stories'}</span>
        <h2 className="font-display mt-4 text-3xl font-semibold text-text-primary sm:text-4xl lg:text-5xl">{ar?'قصص نجاح من عملاء سبعة':'Stories from Sbaah customers'}</h2>
      </div>

      <div ref={scroller} className="-mx-[22px] mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto px-[22px] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-9">
        {testimonials[locale].map((x)=><article data-testimonial-card key={x.company} className="flex h-[540px] w-[calc(100vw-72px)] min-w-[calc(100vw-72px)] snap-center flex-col rounded-[20px] border border-border-subtle bg-surface-card px-[20px] pb-[24px] pt-[24px] sm:h-auto sm:w-full sm:min-w-full sm:rounded-[28px] sm:border-border-subtle sm:p-7 lg:min-w-[calc(50%-10px)]">
          <div className="h-[205px] w-full shrink-0 overflow-hidden rounded-[13px] bg-surface-muted sm:h-auto sm:aspect-[16/9] sm:rounded-[22px]">
            <img src={x.image} alt={ar?`عرض موقع ${x.company}`:`${x.company} website preview`} className="h-full w-full object-cover" />
          </div>

          <blockquote className="font-display mx-auto mt-6 max-w-3xl px-1 text-center text-[16px] font-medium leading-[1.65] text-text-primary sm:mt-8 sm:px-0 sm:text-2xl">
            “{x.quote}”
          </blockquote>

          <div className="mt-auto flex items-end justify-start gap-3 pb-0 pt-8 sm:items-end sm:justify-between sm:gap-4 sm:pt-9" dir={ar?'rtl':'ltr'}>
            <div className="min-w-0 flex-1 text-end sm:text-start">
              <p className="font-display text-[17px] font-semibold text-text-primary sm:text-xl">{x.person}</p>
              <p className="mt-1.5 text-[14px] text-text-secondary sm:mt-1.5 sm:text-sm">{x.company}</p>
            </div>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-surface-card sm:h-14 sm:w-14">
              {x.logo?<img src={x.logo} alt={x.company} className="h-full w-full object-contain"/>:<span className="text-brand text-lg font-bold">{x.company.slice(0,1)}</span>}
            </div>
          </div>
        </article>)}
      </div>

      <div className="mx-auto mt-10 flex w-fit items-center gap-[2px] rounded-[999px] bg-brand/10 p-[6px] sm:mt-8">
        <button type="button" onClick={()=>move(-1)} aria-label={ar?'السابق':'Previous testimonial'} className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-brand transition hover:bg-brand/5 sm:h-14 sm:w-14"><Arrow direction="left"/></button>
        <button type="button" onClick={()=>move(1)} aria-label={ar?'التالي':'Next testimonial'} className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-brand transition hover:bg-brand/5 sm:h-14 sm:w-14"><Arrow direction="right"/></button>
      </div>
    </div>
  </section>;
}
