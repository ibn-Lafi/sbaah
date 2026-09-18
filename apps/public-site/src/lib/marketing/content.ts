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
      subtitle: '',
      cycleToggle: { annual: 'سنوي', monthly: 'شهري' },
      cycleLabel: (cycle: 'monthly' | 'annual'): string => cycle === 'annual' ? 'سنويًا' : 'شهريًا',
      savingsLabel: (months: number) => months === 1 ? 'وفّر شهرًا' : months === 2 ? 'وفّر شهرين' : `وفّر ${months} أشهر`,
      currency: 'ريال', priceNote: (cycleLabel: string) => `/ ${cycleLabel}`, vatNote: 'شامل ضريبة القيمة المضافة',
      cta: 'ابدأ الآن', mostPopular: 'الأكثر اختيارًا', propertiesLimit: 'عدد العقارات', usersLimit: 'أعضاء الفريق',
      unlimited: 'بلا حدود', customDomainYes: 'دومين مخصص', customDomainNo: 'نطاق فرعي من سبعة',
    },
    faq: {
      title: 'كل ما تحتاج معرفته قبل أن تبدأ',
      items: [
        { question: 'لمن صُممت سبعة؟', answer: 'صُممت سبعة للمطورين والمسوقين والوسطاء العقاريين، سواء كنت تعمل كفرد أو مؤسسة أو شركة، لتجمع إدارة حضورك وأعمالك العقارية الرقمية في منصة واحدة.' },
        { question: 'ماذا توفر لي سبعة؟', answer: 'تجمع سبعة بين إنشاء موقع عقاري، وإدارة العقارات والمشاريع، ونظام CRM لإدارة العملاء، ونظام متابعة التأجير، إلى جانب الأدوات والتكاملات المتاحة ضمن باقتك.' },
        { question: 'كيف يساعدني نظام CRM في إدارة العملاء؟', answer: 'يساعدك CRM على تنظيم بيانات العملاء وطلباتهم واهتماماتهم، ومتابعة حالاتهم والتواصل معهم، لتكون رحلة العميل ومراحل المتابعة واضحة داخل لوحة التحكم.' },
        { question: 'كيف يعمل نظام متابعة التأجير؟', answer: 'يساعدك نظام متابعة التأجير على تنظيم العقارات المؤجرة وعقودها، ومتابعة مواعيد بداية ونهاية الإيجار والاستحقاقات المرتبطة بها من لوحة تحكم واحدة.' },
        { question: 'هل أحتاج إلى خبرة تقنية لإنشاء موقعي؟', answer: 'لا. يمكنك تجهيز موقعك العقاري وإضافة عقاراتك ومشاريعك وإدارة محتواه من لوحة التحكم دون الحاجة إلى البرمجة أو بناء موقع من الصفر.' },
        { question: 'هل يمكنني استخدام دومين خاص بي؟', answer: 'نعم. يمكنك ربط دومينك الخاص بموقعك، أو البدء بالنطاق الفرعي المتاح لك من سبعة بحسب إعدادات الخدمة.' },
        { question: 'هل يمكنني تخصيص موقعي العقاري؟', answer: 'نعم. يمكنك اختيار الثيم المناسب وتخصيص إعدادات الموقع ومحتواه وهويته بما يتناسب مع نشاطك العقاري.' },
        { question: 'هل يمكنني تغيير الباقة لاحقًا؟', answer: 'نعم. يمكنك الانتقال بين الباقات المتاحة بما يتناسب مع احتياج عملك، وتختلف المزايا والحدود حسب الباقة المختارة.' },
        { question: 'هل بيانات كل حساب مستقلة؟', answer: 'نعم. لكل حساب بياناته وإعداداته الخاصة، بما يشمل العملاء والعقارات والمشاريع وبيانات متابعة التأجير وإعدادات الموقع.' },
        { question: 'ماذا لو احتجت إلى مساعدة؟', answer: 'يمكنك الوصول إلى مركز الدعم ورفع تذكرة ومتابعة حالتها والردود عليها حتى تتم معالجة طلبك.' },
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
      title: 'Everything to know before you start',
      items: [
        { question: 'Who is Sbaah for?', answer: 'Sbaah is built for real-estate developers, marketers and brokers, whether you operate as an individual, institution or company, bringing your digital real-estate operations together in one platform.' },
        { question: 'What does Sbaah provide?', answer: 'Sbaah combines a real-estate website, property and project management, a client CRM, rental follow-up, and the tools and integrations available with your plan.' },
        { question: 'How does the CRM help me manage clients?', answer: 'The CRM organizes client details, requests and interests, and helps you track statuses and communication so each client journey and follow-up stage stays clear.' },
        { question: 'How does rental follow-up work?', answer: 'Rental follow-up helps you organize rented properties and their contracts, including lease start and end dates and related due dates, from one dashboard.' },
        { question: 'Do I need technical experience to build my website?', answer: 'No. You can prepare your real-estate website, add properties and projects, and manage its content from the dashboard without coding or building a site from scratch.' },
        { question: 'Can I use my own domain?', answer: 'Yes. You can connect your own domain or start with the Sbaah subdomain available to your account, depending on the service settings.' },
        { question: 'Can I customize my real-estate website?', answer: 'Yes. Choose a suitable theme and customize your site settings, content and identity to fit your real-estate business.' },
        { question: 'Can I change my plan later?', answer: 'Yes. You can move between available plans as your needs change. Features and limits vary by plan.' },
        { question: 'Is each account’s data separate?', answer: 'Yes. Each account has its own data and settings, including clients, properties, projects, rental follow-up data and website settings.' },
        { question: 'What if I need help?', answer: 'You can open a ticket through the Support Center and follow its status and replies until your request is handled.' },
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
