export const MARKETING_CONTENT = {
  ar: {
    brand: 'سبعة',
    nav: {
      features: 'المميزات', howItWorks: 'كيف تبدأ', pricing: 'الباقات', faq: 'الأسئلة الشائعة',
      login: 'تسجيل الدخول', cta: 'أنشئ حسابك', createSite: 'أنشئ موقعك', languageSwitch: 'English',
      menuOpen: 'فتح القائمة', menuClose: 'إغلاق القائمة', switchToDark: 'الوضع الداكن', switchToLight: 'الوضع الفاتح',
    },
    hero: {
      eyebrow: 'منصة عقارية سعودية',
      title: 'موقعك العقاري وعملاؤك، من مكان واحد',
      subtitle: 'أنشئ موقعك، اعرض عقاراتك، ونظّم عملاءك وطلباتك من لوحة تحكم واحدة.',
      primaryCta: 'أنشئ حسابك', secondaryCta: 'اكتشف سبعة',
      trustChips: ['موقع بهويتك', 'إدارة عملاء CRM', 'دعم بالعربية'],
    },
    howItWorks: {
      title: 'ابدأ في ثلاث خطوات',
      subtitle: 'من الحساب إلى موقع عقاري جاهز لإدارة أعمالك.',
      steps: [
        { number: '١', title: 'أنشئ حسابك', body: 'اختر الباقة المناسبة وابدأ إعداد حسابك.' },
        { number: '٢', title: 'جهّز موقعك', body: 'خصّص الهوية وأضف عقاراتك ومشاريعك.' },
        { number: '٣', title: 'تابع عملاءك', body: 'استقبل الاستفسارات ونظّم فرصك من لوحة واحدة.' },
      ],
    },
    productShowcase: {
      eyebrow: 'لوحة تحكم واحدة',
      title: 'شاهد عملك بوضوح',
      subtitle: 'العقارات والعملاء والطلبات والمؤشرات الأساسية أمامك في مكان واحد.',
      imageAlt: 'لوحة تحكم سبعة لإدارة العقارات والعملاء',
    },
    features: {
      title: 'أدواتك العقارية الأساسية',
      subtitle: 'كل ما تحتاجه لبناء حضورك الرقمي وتنظيم عملك اليومي.',
      items: [
        { title: 'موقع عقاري', body: 'موقع بهويتك لعرض العقارات والمشاريع.' },
        { title: 'دومين مخصص', body: 'استخدم نطاق سبعة أو اربط نطاقك الخاص.' },
        { title: 'واتساب مباشر', body: 'سهّل على المهتم التواصل من صفحة العقار.' },
        { title: 'إدارة العملاء CRM', body: 'رتّب العملاء والاهتمامات وحالات المتابعة.' },
        { title: 'إدارة الفريق', body: 'نظّم أعضاء فريقك وصلاحيات العمل.' },
        { title: 'تقارير واضحة', body: 'تابع أهم مؤشرات نشاطك من لوحة واحدة.' },
      ],
    },
    comparison: {
      title: 'عمل أقل تشتتًا', subtitle: 'أدواتك الأساسية مترابطة في مكان واحد.', columnBefore: 'قبل', columnAfter: 'مع سبعة',
      rows: [
        { label: 'الموقع', before: 'أداة منفصلة', after: 'ضمن حسابك' },
        { label: 'العملاء', before: 'ملفات ومحادثات', after: 'CRM منظم' },
        { label: 'المتابعة', before: 'متفرقة', after: 'مسار واضح' },
      ],
    },
    pricing: {
      title: 'اختر الباقة المناسبة',
      subtitle: 'بلاتينيوم أو ذهبي — اختر ما يناسب حجم عملك.',
      cycleToggle: { annual: 'سنوي', monthly: 'شهري' },
      cycleLabel: (cycle: 'monthly' | 'annual'): string => cycle === 'annual' ? 'سنويًا' : 'شهريًا',
      savingsLabel: (months: number) => months === 1 ? 'وفّر شهرًا' : months === 2 ? 'وفّر شهرين' : `وفّر ${months} أشهر`,
      currency: 'ريال', priceNote: (cycleLabel: string) => `/ ${cycleLabel}`, vatNote: 'شامل ضريبة القيمة المضافة',
      cta: 'ابدأ الآن', mostPopular: 'الأكثر اختيارًا', propertiesLimit: 'عدد العقارات', usersLimit: 'أعضاء الفريق',
      unlimited: 'بلا حدود', customDomainYes: 'دومين مخصص', customDomainNo: 'نطاق فرعي من سبعة',
    },
    faq: {
      title: 'قبل أن تبدأ',
      items: [
        { question: 'لمن صُممت سبعة؟', answer: 'للمطورين والمسوقين والوسطاء العقاريين، سواء كانوا أفرادًا أو منشآت.' },
        { question: 'هل أحتاج دومين خاص؟', answer: 'لا. يمكنك البدء بنطاق فرعي من سبعة وربط نطاقك الخاص لاحقًا.' },
        { question: 'كيف أتابع العملاء؟', answer: 'تجمع لوحة العملاء بياناتهم واهتماماتهم وحالة المتابعة في مكان واحد.' },
        { question: 'هل يمكن تغيير الباقة؟', answer: 'يمكن إدارة الباقة من حسابك وفق خيارات الاشتراك المتاحة.' },
        { question: 'هل لكل حساب بياناته الخاصة؟', answer: 'نعم. بيانات كل حساب معزولة عن الحسابات الأخرى داخل المنصة.' },
      ],
    },
    finalCta: {
      title: 'مكتبك العقاري الإلكتروني يبدأ من هنا',
      subtitle: 'أنشئ حضورك العقاري ونظّم عملاءك من مكان واحد.',
      primaryCta: 'أنشئ حسابك', secondaryCta: 'تسجيل الدخول',
    },
    footer: {
      tagline: 'منصة لإدارة حضورك وعملك العقاري من مكان واحد.', rights: '© سبعة. جميع الحقوق محفوظة.',
      columns: { product: { title: 'سبعة', features: 'المميزات', pricing: 'الباقات', faq: 'الأسئلة الشائعة' }, account: { title: 'الحساب', login: 'تسجيل الدخول', register: 'إنشاء حساب' } },
    },
  },
  en: {
    brand: 'Sbaah',
    nav: {
      features: 'Features', howItWorks: 'How it works', pricing: 'Plans', faq: 'FAQ', login: 'Log in', cta: 'Create account',
      createSite: 'Create your site', languageSwitch: 'العربية', menuOpen: 'Open menu', menuClose: 'Close menu', switchToDark: 'Dark mode', switchToLight: 'Light mode',
    },
    hero: {
      eyebrow: 'Saudi real-estate platform', title: 'Your real-estate website and clients, in one place',
      subtitle: 'Build your website, showcase properties, and organize clients and requests from one dashboard.',
      primaryCta: 'Create account', secondaryCta: 'Explore Sbaah', trustChips: ['Your branded website', 'Client CRM', 'Arabic support'],
    },
    howItWorks: {
      title: 'Start in three steps', subtitle: 'From account setup to a real-estate workspace ready for business.',
      steps: [
        { number: '1', title: 'Create your account', body: 'Choose the plan that fits and set up your account.' },
        { number: '2', title: 'Build your website', body: 'Customize your brand and add properties and projects.' },
        { number: '3', title: 'Follow your clients', body: 'Receive inquiries and organize opportunities in one dashboard.' },
      ],
    },
    productShowcase: {
      eyebrow: 'One dashboard', title: 'See your business clearly',
      subtitle: 'Properties, clients, requests and essential metrics together in one place.',
      imageAlt: 'Sbaah dashboard for managing properties and clients',
    },
    features: {
      title: 'Your essential real-estate tools', subtitle: 'Everything you need to build your digital presence and organize daily work.',
      items: [
        { title: 'Real-estate website', body: 'A branded website for your properties and projects.' },
        { title: 'Custom domain', body: 'Use a Sbaah subdomain or connect your own domain.' },
        { title: 'Direct WhatsApp', body: 'Let prospects contact you directly from a property page.' },
        { title: 'Client CRM', body: 'Organize clients, interests and follow-up stages.' },
        { title: 'Team management', body: 'Organize team members and work permissions.' },
        { title: 'Clear reporting', body: 'Track essential activity metrics in one dashboard.' },
      ],
    },
    comparison: {
      title: 'Less scattered work', subtitle: 'Your essential tools connected in one place.', columnBefore: 'Before', columnAfter: 'With Sbaah',
      rows: [
        { label: 'Website', before: 'Separate tool', after: 'Inside your account' },
        { label: 'Clients', before: 'Files and chats', after: 'Organized CRM' },
        { label: 'Follow-up', before: 'Scattered', after: 'Clear workflow' },
      ],
    },
    pricing: {
      title: 'Choose the right plan', subtitle: 'Platinum or Gold — choose what fits your business.',
      cycleToggle: { annual: 'Annual', monthly: 'Monthly' },
      cycleLabel: (cycle: 'monthly' | 'annual'): string => cycle === 'annual' ? 'year' : 'month',
      savingsLabel: (months: number) => `Save ${months} ${months === 1 ? 'month' : 'months'}`,
      currency: 'SAR', priceNote: (cycleLabel: string) => `/ ${cycleLabel}`, vatNote: 'VAT included', cta: 'Get started', mostPopular: 'Most popular',
      propertiesLimit: 'Properties', usersLimit: 'Team members', unlimited: 'Unlimited', customDomainYes: 'Custom domain', customDomainNo: 'Sbaah subdomain',
    },
    faq: {
      title: 'Before you start',
      items: [
        { question: 'Who is Sbaah for?', answer: 'Real-estate developers, marketers and brokers, whether individuals or organizations.' },
        { question: 'Do I need my own domain?', answer: 'No. Start with a Sbaah subdomain and connect your own domain later.' },
        { question: 'How do I follow clients?', answer: 'The client dashboard keeps their details, interests and follow-up stage in one place.' },
        { question: 'Can I change my plan?', answer: 'You can manage your plan from your account according to the available subscription options.' },
        { question: 'Is each account’s data separate?', answer: 'Yes. Each account’s data is isolated from other accounts on the platform.' },
      ],
    },
    finalCta: {
      title: 'Your digital real-estate office starts here', subtitle: 'Build your presence and organize your clients in one place.',
      primaryCta: 'Create account', secondaryCta: 'Log in',
    },
    footer: {
      tagline: 'Manage your real-estate presence and work in one place.', rights: '© Sbaah. All rights reserved.',
      columns: { product: { title: 'Sbaah', features: 'Features', pricing: 'Plans', faq: 'FAQ' }, account: { title: 'Account', login: 'Log in', register: 'Create account' } },
    },
  },
} as const;
