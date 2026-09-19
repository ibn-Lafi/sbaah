import type { Locale } from '@/lib/i18n/locales';

type Kind = 'person' | 'company';

const testimonials = {
  ar: [
    { kind:'company' as Kind, category:'developer', name:'روّاد العقارية', person:'م. عبدالله الشهراني', role:'الرئيس التنفيذي', logo:'/brands/ruwad-real-estate.svg', quote:'منذ اعتمادنا على سبعة، أصبح عرض مشاريعنا وتنظيم العملاء في مكان واحد أسهل بكثير، ووفّر علينا وقتًا في المتابعة اليومية.' },
    { kind:'person' as Kind, category:'marketer', name:'سالم القحطاني', person:'', role:'مسوق عقاري مستقل', logo:'/testimonials/salem-alqahtani.svg', quote:'سبعة غيّرت طريقة عملي؛ صار عندي موقع عقاري مرتب وإدارة للعملاء من نفس اللوحة، وهذا سهّل عليّ متابعة الفرص بشكل واضح.' },
    { kind:'company' as Kind, category:'marketer', name:'ديار نجد', person:'أ. فهد المطيري', role:'مدير التسويق', quote:'جمع الموقع العقاري وإدارة العملاء في منصة واحدة أعطانا تجربة أكثر تنظيمًا وسهّل على الفريق متابعة الاستفسارات.' },
    { kind:'person' as Kind, category:'broker', name:'نواف العتيبي', person:'', role:'وسيط عقاري', quote:'أكثر شيء فرق معي هو ترتيب العقارات وطلبات العملاء. بدل التشتت بين أكثر من أداة أصبحت المتابعة أوضح وأسرع.' },
    { kind:'company' as Kind, category:'broker', name:'مساكن', person:'أ. لمياء السليمان', role:'المدير العام', quote:'وجدنا في سبعة مساحة عملية تجمع حضورنا الرقمي مع إدارة العقارات والعملاء، بواجهة واضحة تناسب عمل الفريق.' },
    { kind:'person' as Kind, category:'developer', name:'عبدالعزيز المالكي', person:'', role:'مطور عقاري مستقل', quote:'ساعدتني سبعة في تقديم مشاريعي بصورة احترافية وتنظيم بيانات العملاء والطلبات بدون الحاجة لاستخدام أنظمة متعددة.' },
  ],
  en: [
    { kind:'company' as Kind, category:'developer', name:'Ruwad Real Estate', person:'Abdullah Alshahrani', role:'CEO', logo:'/brands/ruwad-real-estate.svg', quote:'Sbaah brought our project showcase and client follow-up into one place, making daily operations much easier to organize.' },
    { kind:'person' as Kind, category:'marketer', name:'Salem Alqahtani', person:'', role:'Independent real-estate marketer', logo:'/testimonials/salem-alqahtani.svg', quote:'Sbaah changed how I work. My property website and client management now live in one clear workspace.' },
    { kind:'company' as Kind, category:'marketer', name:'Diyar Najd', person:'Fahad Almutairi', role:'Marketing Director', quote:'Combining our real-estate website and client management gave the team a more organized way to handle inquiries.' },
    { kind:'person' as Kind, category:'broker', name:'Nawaf Alotaibi', person:'', role:'Real-estate broker', quote:'Organizing properties and client requests in one place made my follow-up clearer and faster.' },
    { kind:'company' as Kind, category:'broker', name:'Masaken', person:'Lamia Alsulaiman', role:'General Manager', quote:'Sbaah gives us a practical workspace that connects our digital presence with property and client management.' },
    { kind:'person' as Kind, category:'developer', name:'Abdulaziz Almalki', person:'', role:'Independent developer', quote:'Sbaah helped me present projects professionally and organize client requests without juggling several systems.' },
  ],
};

function Mark({kind,name,logo}:{kind:Kind;name:string;logo?:string}) {
  const initials=name.split(' ').slice(0,2).map(x=>x[0]).join('');
  return <div className={`${logo?'bg-transparent':'bg-brand/10'} text-brand flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-2xl text-lg font-bold`}>{logo?<img src={logo} alt={name} className="block h-full w-full object-contain"/>:kind==='company'?<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" className="h-7 w-7"><path d="M4 21h16M6 21V7l6-4 6 4v14M9 10h2m2 0h2M9 14h2m2 0h2M10 21v-4h4v4"/></svg>:initials}</div>
}

export function Testimonials({locale}:{locale:Locale}) {
  const ar=locale==='ar';
  return <section className="relative overflow-hidden bg-gradient-to-b from-surface-card via-brand/[.035] to-surface-card px-5 py-16 sm:px-6 sm:py-24">
    <div className="relative z-10 mx-auto max-w-6xl">
      <div className="mx-auto max-w-3xl text-center">
        <span className="bg-brand/10 text-brand inline-flex rounded-full px-4 py-1.5 text-xs font-semibold">{ar?'آراء عملاء سبعة':'Sbaah customer stories'}</span>
        <h2 className="font-display mt-4 text-3xl font-semibold text-text-primary sm:text-4xl lg:text-5xl">{ar?'قصص نجاح من عملاء سبعة':'Stories from Sbaah customers'}</h2>
        <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-text-secondary sm:text-base">{ar?'تجارب من أفراد وشركات يعملون في التسويق والوساطة والتطوير العقاري.':'Experiences from individuals and companies across real-estate marketing, brokerage and development.'}</p>
      </div>
      <div className="-mx-5 mt-8 flex snap-x snap-mandatory gap-4 overflow-x-auto px-5 pb-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-4 sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {testimonials[locale].map((x)=><article key={x.name} className="flex min-h-[390px] w-[78vw] min-w-[78vw] max-w-[310px] snap-start flex-col rounded-[28px] border border-border-subtle bg-surface-muted/70 p-5 shadow-sm sm:min-h-[285px] sm:w-auto sm:min-w-0 sm:max-w-none sm:rounded-3xl sm:bg-surface-card/95 sm:p-6">
          <div className="flex items-center gap-3"><Mark kind={x.kind} name={x.name} logo={'logo' in x ? x.logo : undefined}/><div className="min-w-0"><h3 className="font-display text-base font-semibold leading-5 text-text-primary sm:text-lg">{x.name}</h3><p className="mt-1 text-xs font-medium text-brand">{x.role}</p></div><span className="text-brand/20 ms-auto hidden self-start text-5xl leading-none sm:block">”</span></div>
          <p className="mt-6 flex-1 text-base leading-8 text-text-primary sm:mt-5 sm:text-sm sm:leading-7">{x.quote}</p>
          <div className="mt-4 border-t border-border-subtle pt-3 sm:mt-5 sm:pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3"><span className="text-[10px] tracking-[1px] text-amber-500 sm:text-[15px] sm:tracking-[2px]" aria-label={ar?'5 من 5':'5 out of 5'}>★★★★★</span><span className="bg-brand/10 text-brand rounded-full px-3 py-1 text-[11px] font-medium">{x.kind==='company'?(ar?'شركة عقارية':'Real-estate company'):(ar?'فرد':'Individual')}</span></div>
            {x.person&&<p className="mt-3 text-xs font-semibold text-text-primary">{x.person}</p>}
          </div>
        </article>)}
      </div>
      <div className="mx-auto mt-10 flex max-w-xl items-center gap-4 text-center"><span className="h-px flex-1 bg-border-subtle"/><p className="text-sm font-semibold text-text-primary">{ar?'عملاء سبعة، شركاء في النجاح العقاري':'Sbaah customers, partners in real-estate success'}</p><span className="h-px flex-1 bg-border-subtle"/></div>
    </div>
  </section>;
}
