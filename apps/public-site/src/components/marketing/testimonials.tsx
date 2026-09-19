'use client';

import { useState } from 'react';
import type { Locale } from '@/lib/i18n/locales';

type Kind = 'person' | 'company';
type Category = 'all' | 'marketer' | 'broker' | 'developer' | 'individual' | 'company';

const testimonials = {
  ar: [
    { kind:'company' as Kind, category:'developer', name:'روّاد العقارية', person:'م. عبدالله الشهراني', role:'الرئيس التنفيذي', quote:'منذ اعتمادنا على سبعة، أصبح عرض مشاريعنا وتنظيم العملاء في مكان واحد أسهل بكثير، ووفّر علينا وقتًا في المتابعة اليومية.' },
    { kind:'person' as Kind, category:'marketer', name:'سالم القحطاني', person:'', role:'مسوق عقاري مستقل', quote:'سبعة غيّرت طريقة عملي؛ صار عندي موقع عقاري مرتب وإدارة للعملاء من نفس اللوحة، وهذا سهّل عليّ متابعة الفرص بشكل واضح.' },
    { kind:'company' as Kind, category:'marketer', name:'ديار نجد', person:'أ. فهد المطيري', role:'مدير التسويق', quote:'جمع الموقع العقاري وإدارة العملاء في منصة واحدة أعطانا تجربة أكثر تنظيمًا وسهّل على الفريق متابعة الاستفسارات.' },
    { kind:'person' as Kind, category:'broker', name:'نواف العتيبي', person:'', role:'وسيط عقاري', quote:'أكثر شيء فرق معي هو ترتيب العقارات وطلبات العملاء. بدل التشتت بين أكثر من أداة أصبحت المتابعة أوضح وأسرع.' },
    { kind:'company' as Kind, category:'broker', name:'مساكن', person:'أ. لمياء السليمان', role:'المدير العام', quote:'وجدنا في سبعة مساحة عملية تجمع حضورنا الرقمي مع إدارة العقارات والعملاء، بواجهة واضحة تناسب عمل الفريق.' },
    { kind:'person' as Kind, category:'developer', name:'عبدالعزيز المالكي', person:'', role:'مطور عقاري مستقل', quote:'ساعدتني سبعة في تقديم مشاريعي بصورة احترافية وتنظيم بيانات العملاء والطلبات بدون الحاجة لاستخدام أنظمة متعددة.' },
  ],
  en: [
    { kind:'company' as Kind, category:'developer', name:'Ruwad Real Estate', person:'Abdullah Alshahrani', role:'CEO', quote:'Sbaah brought our project showcase and client follow-up into one place, making daily operations much easier to organize.' },
    { kind:'person' as Kind, category:'marketer', name:'Salem Alqahtani', person:'', role:'Independent real-estate marketer', quote:'Sbaah changed how I work. My property website and client management now live in one clear workspace.' },
    { kind:'company' as Kind, category:'marketer', name:'Diyar Najd', person:'Fahad Almutairi', role:'Marketing Director', quote:'Combining our real-estate website and client management gave the team a more organized way to handle inquiries.' },
    { kind:'person' as Kind, category:'broker', name:'Nawaf Alotaibi', person:'', role:'Real-estate broker', quote:'Organizing properties and client requests in one place made my follow-up clearer and faster.' },
    { kind:'company' as Kind, category:'broker', name:'Masaken', person:'Lamia Alsulaiman', role:'General Manager', quote:'Sbaah gives us a practical workspace that connects our digital presence with property and client management.' },
    { kind:'person' as Kind, category:'developer', name:'Abdulaziz Almalki', person:'', role:'Independent developer', quote:'Sbaah helped me present projects professionally and organize client requests without juggling several systems.' },
  ],
};

function Mark({kind,name}:{kind:Kind;name:string}) {
  const initials=name.split(' ').slice(0,2).map(x=>x[0]).join('');
  return <div className="bg-brand/10 text-brand flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-bold">{kind==='company'?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7"><path d="M4 21h16M6 21V7l6-4 6 4v14M9 10h2m2 0h2M9 14h2m2 0h2M10 21v-4h4v4"/></svg>:initials}</div>
}

export function Testimonials({locale}:{locale:Locale}) {
  const ar=locale==='ar';
  const [filter,setFilter]=useState<Category>('all');
  const filters: {key:Category; ar:string; en:string}[]=[
    {key:'all',ar:'الكل',en:'All'},{key:'marketer',ar:'المسوقين',en:'Marketers'},{key:'broker',ar:'الوسطاء',en:'Brokers'},
    {key:'developer',ar:'المطورين',en:'Developers'},{key:'individual',ar:'الأفراد',en:'Individuals'},{key:'company',ar:'الشركات',en:'Companies'}
  ];
  const visible=testimonials[locale].filter(x=>filter==='all'||(filter==='individual'?x.kind==='person':filter==='company'?x.kind==='company':x.category===filter));
  return <section className="relative overflow-hidden bg-gradient-to-b from-surface-card via-brand/[.035] to-surface-card px-5 py-16 sm:px-6 sm:py-24">
    <div className="relative z-10 mx-auto max-w-6xl">
      <div className="mx-auto max-w-3xl text-center">
        <span className="bg-brand/10 text-brand inline-flex rounded-full px-4 py-1.5 text-xs font-semibold">{ar?'آراء عملاء سبعة':'Sbaah customer stories'}</span>
        <h2 className="font-display mt-4 text-3xl font-semibold text-text-primary sm:text-4xl lg:text-5xl">{ar?'قصص نجاح من عملاء سبعة':'Stories from Sbaah customers'}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">{ar?'تجارب من أفراد وشركات يعملون في التسويق والوساطة والتطوير العقاري.':'Experiences from individuals and companies across real-estate marketing, brokerage and development.'}</p>
      </div>
      <div className="mt-7 flex flex-wrap justify-center gap-2">
        {filters.map(x=><button key={x.key} onClick={()=>setFilter(x.key)} className={`rounded-full px-5 py-2 text-xs font-medium transition sm:text-sm ${filter===x.key?'bg-text-primary text-surface-card':'bg-surface-muted text-text-secondary hover:text-text-primary'}`}>{ar?x.ar:x.en}</button>)}
      </div>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((x)=><article key={x.name} className="flex min-h-[285px] flex-col rounded-3xl border border-border-subtle bg-surface-card/95 p-6 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3"><Mark kind={x.kind} name={x.name}/><div className="min-w-0"><h3 className="font-display text-lg font-semibold text-text-primary">{x.name}</h3><p className="text-xs text-text-secondary">{x.role}</p></div><span className="text-brand/20 ms-auto self-start text-5xl leading-none">”</span></div>
          <p className="mt-5 flex-1 text-sm leading-7 text-text-secondary">{x.quote}</p>
          <div className="mt-5 border-t border-border-subtle pt-4">
            <div className="flex items-center justify-between gap-3"><span className="text-[15px] tracking-[2px] text-amber-500" aria-label={ar?'5 من 5':'5 out of 5'}>★★★★★</span><span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[11px] font-medium">{x.kind==='company'?(ar?'شركة عقارية':'Real-estate company'):(ar?'فرد':'Individual')}</span></div>
            {x.person&&<p className="mt-3 text-xs font-semibold text-text-primary">{x.person}</p>}
          </div>
        </article>)}
      </div>
      <div className="mx-auto mt-10 flex max-w-xl items-center gap-4 text-center"><span className="h-px flex-1 bg-border-subtle"/><p className="text-sm font-semibold text-text-primary">{ar?'عملاء سبعة، شركاء في النجاح العقاري':'Sbaah customers, partners in real-estate success'}</p><span className="h-px flex-1 bg-border-subtle"/></div>
    </div>
  </section>;
}
