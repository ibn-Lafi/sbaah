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
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-6 w-6" aria-hidden="true"><path strokeLinecap="round" strokeLinejoin="round" d={direction==='left'?'M15 18l-6-6 6-6':'M9 6l6 6-6 6'}/></svg>;
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

  return <section className="bg-surface-card px-4 py-14 sm:px-6 sm:py-24">
    <div className="mx-auto max-w-6xl">
      <div className="mx-auto max-w-3xl text-center">
        <span className="bg-brand/10 text-brand inline-flex rounded-full px-4 py-1.5 text-xs font-semibold">{ar?'آراء عملاء سبعة':'Sbaah customer stories'}</span>
        <h2 className="font-display mt-4 text-3xl font-semibold text-text-primary sm:text-4xl lg:text-5xl">{ar?'قصص نجاح من عملاء سبعة':'Stories from Sbaah customers'}</h2>
      </div>

      <div ref={scroller} className="mt-8 flex snap-x snap-mandatory gap-5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mt-9">
        {testimonials[locale].map((x)=><article data-testimonial-card key={x.company} className="flex w-full min-w-full snap-center flex-col rounded-[22px] border border-border-subtle bg-surface-card p-3 sm:rounded-[28px] sm:p-7 lg:min-w-[calc(50%-10px)]">
          <div className="aspect-[1.72/1] w-full overflow-hidden rounded-[16px] bg-surface-muted sm:aspect-[16/9] sm:rounded-[22px]">
            <img src={x.image} alt={ar?`عرض موقع ${x.company}`:`${x.company} website preview`} className="h-full w-full object-cover" />
          </div>

          <blockquote className="font-display mx-auto mt-6 max-w-3xl px-2 text-center text-[17px] font-medium leading-[1.75] text-text-primary sm:mt-8 sm:px-0 sm:text-2xl">
            “{x.quote}”
          </blockquote>

          <div className="mt-auto flex items-center justify-end gap-3 pt-8 sm:items-end sm:justify-between sm:gap-4 sm:pt-9" dir={ar?'rtl':'ltr'}>
            <div className="min-w-0 text-end sm:text-start">
              <p className="font-display text-[18px] font-semibold text-text-primary sm:text-xl">{x.person}</p>
              <p className="mt-1 text-[13px] text-text-secondary sm:mt-1.5 sm:text-sm">{x.company}</p>
            </div>
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-border-subtle bg-surface-card sm:h-14 sm:w-14">
              {x.logo?<img src={x.logo} alt={x.company} className="h-full w-full object-contain"/>:<span className="text-brand text-lg font-bold">{x.company.slice(0,1)}</span>}
            </div>
          </div>
        </article>)}
      </div>

      <div className="mx-auto mt-7 flex w-fit items-center rounded-full bg-surface-muted p-[6px] sm:mt-8">
        <button type="button" onClick={()=>move(-1)} aria-label={ar?'السابق':'Previous testimonial'} className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-text-primary transition hover:text-brand sm:h-14 sm:w-14"><Arrow direction="left"/></button>
        <button type="button" onClick={()=>move(1)} aria-label={ar?'التالي':'Next testimonial'} className="flex h-12 w-12 items-center justify-center rounded-full bg-surface-card text-text-primary transition hover:text-brand sm:h-14 sm:w-14"><Arrow direction="right"/></button>
      </div>
    </div>
  </section>;
}
