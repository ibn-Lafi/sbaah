import type { Locale } from '@/lib/i18n/locales';

/**
 * سبعة's own marketing copy — deliberately separate from
 * `lib/i18n/dictionary.ts`, which stays flat/minimal for tenant-site
 * chrome only (see that file's own comment). This page's content has no
 * relationship to any tenant.
 *
 * لا أرقام/شهادات عملاء مُختلقة هنا (عدد مشتركين، اقتباسات منسوبة
 * لأشخاص حقيقيين، إلخ) — أي رقم من هذا النوع يحتاج بيانات فعلية من
 * المؤسس قبل نشره؛ كل ما هنا وصف حقيقي لميزات المنتج نفسه أو خطوات
 * استخدامه، لا ادّعاءات لا يمكن التحقق منها.
 */
export const MARKETING_CONTENT = {
  ar: {
    brand: 'سبعة',
    nav: {
      features: 'المميزات',
      howItWorks: 'كيف تبدأ',
      pricing: 'الأسعار',
      faq: 'الأسئلة الشائعة',
      login: 'تسجيل الدخول',
      cta: 'أنشئ حسابك',
      createSite: 'أنشئ موقعك',
      languageSwitch: 'English',
      menuOpen: 'فتح القائمة',
      menuClose: 'إغلاق القائمة',
      switchToDark: 'التبديل للوضع الداكن',
      switchToLight: 'التبديل للوضع الفاتح',
    },
    hero: {
      eyebrow: 'منصة عقارية سعودية متكاملة',
      title: 'موقعك العقاري وعملاؤك، من مكان واحد',
      subtitle:
        'أنشئ موقعًا عقاريًا احترافيًا بدقائق بلا مبرمج، استقبل استفسارات العملاء مباشرة عبر واتساب، وتابع كل عميل محتمل حتى إغلاق الصفقة — كل هذا من لوحة تحكم واحدة صُممت لعمل الوسيط والمسوّق العقاري في السعودية.',
      primaryCta: 'أنشئ موقعك الآن',
      secondaryCta: 'شاهد كيف يعمل',
      trustChips: ['بلا عقد التزام طويل', 'الأسعار شاملة الضريبة', 'دعم فني بالعربية', 'دومين مخصص متى أردت'],
    },
    howItWorks: {
      title: 'ثلاث خطوات، وموقعك جاهز لاستقبال أول عميل',
      subtitle: 'لا حاجة لمبرمج أو مصمم أو خبرة تقنية — سبعة يتولى الجزء التقني، وأنت تركّز على عملائك.',
      steps: [
        {
          number: '١',
          title: 'أنشئ حسابك واختر باقتك',
          body: 'سجّل برقم جوالك، اختر نوع حسابك (فرد، مؤسسة، أو شركة)، وابدأ فورًا — حتى بالتجربة المجانية إن كانت متاحة.',
        },
        {
          number: '٢',
          title: 'خصّص موقعك بهويتك',
          body: 'اختر ألوانك وشعارك وخطك، أضف عقاراتك، واربط دومينك الخاص إن أردت — كل شيء من محرر مرئي بسيط.',
        },
        {
          number: '٣',
          title: 'استقبل عملاءك وتابعهم',
          body: 'كل استفسار من موقعك يصل واتساب فورًا ويتحول تلقائيًا لعميل محتمل في لوحتك، بحالة واضحة تتابعها حتى الإغلاق.',
        },
      ],
    },
    productShowcase: {
      eyebrow: 'لوحة تحكم واحدة',
      title: 'كل أدوات عملك العقاري، في شاشة واحدة',
      subtitle:
        'موقعك، عقاراتك، عملاؤك المحتملون، وفريقك — كلها مترابطة تلقائيًا بلا نسخ بيانات يدوي بين أدوات متفرقة.',
      imageAlt: 'لقطة من لوحة تحكم سبعة تعرض مؤشرات الأداء، رسم زيارات الموقع، وقائمة أحدث العملاء المحتملين',
    },
    features: {
      title: 'كل ما يحتاجه عملك العقاري',
      subtitle: 'أدوات مبنية خصيصًا لطريقة عمل الوسيط والمسوّق العقاري في السوق السعودي — لا قالب عام مُعاد تدويره.',
      items: [
        {
          title: 'موقع عقاري جاهز',
          body: 'قوالب احترافية بألوانك وشعارك وخطك الخاص، تعرض عقاراتك تلقائيًا — بلا حاجة لمبرمج أو مصمم.',
        },
        { title: 'دومين مخصص', body: 'اربط موقعك بنطاقك الخاص متى أردت، أو استخدم نطاقًا فرعيًا من سبعة فورًا مجانًا.' },
        {
          title: 'واتساب مباشر',
          body: 'زر تواصل فوري على كل عقار — العميل المهتم يصلك مباشرة على واتساب دون وسيط أو تأخير.',
        },
        {
          title: 'إدارة عملاء (CRM) مبسّطة',
          body: 'كل استفسار يتحوّل تلقائيًا لعميل محتمل بحالة واضحة (جديد، تم التواصل، مؤهل، صفقة) وملاحظاتك الخاصة.',
        },
        {
          title: 'فريق بأدوار محددة',
          body: 'مالك، مشرف، ووسيط — كل عضو بفريقك يرى فقط ما يخصّه، بلا تعارض صلاحيات أو بيانات مكشوفة للجميع.',
        },
        {
          title: 'لوحة أداء واضحة',
          body: 'زيارات موقعك، عملاؤك المحتملون، وحالة كل عقار — في مكان واحد، بلا تقارير متفرقة يدويًا.',
        },
      ],
    },
    comparison: {
      title: 'الفرق بين الطريقة التقليدية وسبعة',
      subtitle: 'نفس عملك العقاري، لكن بلا الوقت الضائع والأدوات المتفرقة.',
      columnBefore: 'الطريقة التقليدية',
      columnAfter: 'مع سبعة',
      rows: [
        { label: 'إطلاق موقع عقاري احترافي', before: 'أسابيع، وتكلفة مبرمج/مصمم', after: 'دقائق، بلا خبرة تقنية' },
        { label: 'استقبال استفسارات العملاء', before: 'أرقام متفرقة ورسائل ضائعة', after: 'واتساب مباشر على كل عقار' },
        { label: 'متابعة العملاء المحتملين', before: 'ملاحظات يدوية أو جداول Excel', after: 'حالة كل عميل واضحة في مكان واحد' },
        { label: 'إدارة صلاحيات الفريق', before: 'حساب واحد مشترك للجميع', after: 'أدوار محددة لكل عضو' },
        { label: 'الدومين المخصص', before: 'إعداد تقني منفصل ومكلف', after: 'ربط مباشر من لوحة التحكم' },
        { label: 'الدعم الفني', before: 'بلا جهة واحدة مسؤولة', after: 'دعم بالعربية من فريق سبعة' },
      ],
    },
    pricing: {
      title: 'أسعار واضحة، بلا مفاجآت',
      subtitle: 'اشترك بالخطة المناسبة لحجم عملك، وألغِ الاشتراك متى شئت. كل الأسعار شاملة ضريبة القيمة المضافة.',
      cycleToggle: { annual: 'سنوي', monthly: 'شهري' },
      cycleLabel: (cycle: 'monthly' | 'annual'): string => (cycle === 'annual' ? 'سنويًا' : 'شهريًا'),
      savingsLabel: (months: number) => {
        if (months === 1) return 'وفّر شهرًا';
        if (months === 2) return 'وفّر شهرين';
        return `وفّر ${months} أشهر`;
      },
      currency: 'ريال',
      priceNote: (cycleLabel: string) => `/ ${cycleLabel}`,
      vatNote: 'شامل ضريبة القيمة المضافة',
      cta: 'اشترك الآن',
      mostPopular: 'الأكثر اختيارًا',
      propertiesLimit: 'عدد العقارات',
      usersLimit: 'أعضاء الفريق',
      unlimited: 'بلا حدود',
      customDomainYes: 'دومين مخصص',
      customDomainNo: 'نطاق فرعي من سبعة',
    },
    faq: {
      title: 'أسئلة شائعة',
      items: [
        {
          question: 'هل سبعة مناسب لي إن كنت وسيطًا فرديًا وليس مكتبًا عقاريًا؟',
          answer:
            'نعم — عند التسجيل تختار نوع حسابك (فرد، مؤسسة، أو شركة)، والمنصة تناسب الحالتين: وسيط فردي يدير عقاراته بنفسه، أو مكتب/شركة بفريق كامل بأدوار محددة.',
        },
        {
          question: 'هل أحتاج نطاقًا (دومين) خاصًا لأبدأ؟',
          answer: 'لا، يمكنك البدء فورًا بنطاق فرعي مجاني من سبعة، ثم ربط نطاقك الخاص لاحقًا من لوحة التحكم مباشرة متى أردت.',
        },
        {
          question: 'كيف تصلني استفسارات العملاء عن عقاراتي؟',
          answer:
            'كل عقار في موقعك يحمل زر تواصل مباشر عبر واتساب، وكل استفسار يتحوّل تلقائيًا لعميل محتمل في لوحة "العملاء المحتملون" بحالة تتابعها بنفسك.',
        },
        {
          question: 'هل يمكنني إلغاء اشتراكي في أي وقت؟',
          answer: 'نعم، لا يوجد التزام بعقد طويل — يمكنك إلغاء الاشتراك أو تغيير الباقة في أي وقت من إعدادات حسابك.',
        },
        {
          question: 'هل بياناتي وعقاراتي محمية؟',
          answer: 'بياناتك خاصة بحسابك فقط، ولا يطّلع عليها أي مستأجر آخر على المنصة — كل حساب معزول تمامًا عن غيره.',
        },
      ],
    },
    finalCta: {
      title: 'ابدأ موقعك العقاري اليوم',
      subtitle: 'انضم إلى سبعة وأنشئ حضورك العقاري الاحترافي بدقائق، بلا حاجة لمبرمج أو أدوات متفرقة.',
      primaryCta: 'أنشئ حسابك مجانًا',
      secondaryCta: 'تسجيل الدخول',
    },
    footer: {
      rights: 'سبعة — جميع الحقوق محفوظة',
      login: 'تسجيل الدخول',
      tagline: 'منصة عقارية سعودية متكاملة للوسيط والمسوّق العقاري.',
      columns: {
        product: { title: 'المنتج', features: 'المميزات', pricing: 'الأسعار', faq: 'الأسئلة الشائعة' },
        account: { title: 'الحساب', login: 'تسجيل الدخول', register: 'إنشاء حساب' },
      },
    },
  },
  en: {
    brand: 'SBAAH',
    nav: {
      features: 'Features',
      howItWorks: 'How it works',
      pricing: 'Pricing',
      faq: 'FAQ',
      login: 'Log in',
      cta: 'Create your account',
      createSite: 'Create your site',
      languageSwitch: 'العربية',
      menuOpen: 'Open menu',
      menuClose: 'Close menu',
      switchToDark: 'Switch to dark mode',
      switchToLight: 'Switch to light mode',
    },
    hero: {
      eyebrow: 'An integrated Saudi real estate platform',
      title: 'Your real estate website and clients, in one place',
      subtitle:
        'Launch a professional real estate website in minutes, no developer needed. Receive client inquiries straight to WhatsApp, and follow up on every lead until the deal closes — all from one dashboard built for how brokers and marketers actually work in Saudi Arabia.',
      primaryCta: 'Create your site now',
      secondaryCta: 'See how it works',
      trustChips: ['No long-term contract', 'VAT-inclusive pricing', 'Arabic-speaking support', 'Custom domain anytime'],
    },
    howItWorks: {
      title: 'Three steps to your first client',
      subtitle: "No developer, designer, or technical background needed — sbaah handles the technical side, you focus on clients.",
      steps: [
        {
          number: '1',
          title: 'Create your account, pick a plan',
          body: 'Sign up with your phone number, choose your account type (individual, institution, or company), and start right away — even with a free trial if available.',
        },
        {
          number: '2',
          title: 'Customize your site',
          body: 'Pick your colors, logo, and font, add your properties, and connect your own domain if you like — all from a simple visual editor.',
        },
        {
          number: '3',
          title: 'Receive and follow up on clients',
          body: 'Every inquiry from your site reaches WhatsApp instantly and automatically becomes a lead on your dashboard, with a clear status you track through to close.',
        },
      ],
    },
    productShowcase: {
      eyebrow: 'One dashboard',
      title: 'Every tool your real estate business needs, on one screen',
      subtitle: 'Your site, properties, leads, and team — all connected automatically, no manual copying between scattered tools.',
      imageAlt: "A screenshot of sbaah's dashboard showing performance metrics, a site-visits chart, and the latest leads list",
    },
    features: {
      title: 'Everything your real estate business needs',
      subtitle: 'Tools built specifically for how brokers and marketers work in the Saudi market — not a generic recycled template.',
      items: [
        { title: 'Ready-made website', body: 'Professional templates in your own colors, logo, and font, showcasing your listings automatically — no developer or designer needed.' },
        { title: 'Custom domain', body: 'Connect your own domain whenever you like, or use a free SBAAH subdomain right away.' },
        { title: 'Direct WhatsApp', body: 'An instant contact button on every listing — interested clients reach you directly on WhatsApp, no middleman or delay.' },
        { title: 'Simple client management (CRM)', body: 'Every inquiry becomes a lead automatically with a clear status (new, contacted, qualified, won) and your own notes.' },
        { title: 'Role-based team', body: 'Owner, admin, and agent — each teammate sees only what applies to them, no permission conflicts or exposed data.' },
        { title: 'Clear performance dashboard', body: 'Your site visits, leads, and listing status — in one place, no manual scattered reports.' },
      ],
    },
    comparison: {
      title: 'The traditional way vs. sbaah',
      subtitle: 'The same real estate business, minus the wasted time and scattered tools.',
      columnBefore: 'The traditional way',
      columnAfter: 'With sbaah',
      rows: [
        { label: 'Launching a professional website', before: 'Weeks, plus developer/designer cost', after: 'Minutes, no technical skill needed' },
        { label: 'Receiving client inquiries', before: 'Scattered numbers, lost messages', after: 'Direct WhatsApp on every listing' },
        { label: 'Following up on leads', before: 'Manual notes or spreadsheets', after: 'One clear status per lead' },
        { label: 'Managing team permissions', before: 'One shared account for everyone', after: 'Defined roles per member' },
        { label: 'Custom domain', before: 'Separate, costly technical setup', after: 'Connected right from the dashboard' },
        { label: 'Support', before: 'No single point of contact', after: 'Arabic-speaking support from the sbaah team' },
      ],
    },
    pricing: {
      title: 'Clear pricing, no surprises',
      subtitle: 'Subscribe to the plan that fits your business size, cancel anytime. All prices include VAT.',
      cycleToggle: { annual: 'Annual', monthly: 'Monthly' },
      cycleLabel: (cycle: 'monthly' | 'annual'): string => (cycle === 'annual' ? 'annually' : 'monthly'),
      savingsLabel: (months: number) => `Save ${months} ${months === 1 ? 'month' : 'months'}`,
      currency: 'SAR',
      priceNote: (cycleLabel: string) => `/ ${cycleLabel}`,
      vatNote: 'Includes VAT',
      cta: 'Subscribe now',
      mostPopular: 'Most popular',
      propertiesLimit: 'Properties',
      usersLimit: 'Team members',
      unlimited: 'Unlimited',
      customDomainYes: 'Custom domain',
      customDomainNo: 'SBAAH subdomain only',
    },
    faq: {
      title: 'Frequently asked questions',
      items: [
        {
          question: "Is sbaah right for me if I'm an individual broker, not an office?",
          answer:
            'Yes — at sign-up you choose your account type (individual, institution, or company), and the platform fits both: a solo broker managing their own listings, or an office/company with a full team and defined roles.',
        },
        {
          question: 'Do I need my own domain to get started?',
          answer: 'No, you can start right away with a free SBAAH subdomain, then connect your own domain later directly from the dashboard whenever you like.',
        },
        {
          question: 'How do client inquiries about my listings reach me?',
          answer:
            "Every listing on your site carries a direct WhatsApp contact button, and every inquiry automatically becomes a lead on your \"Leads\" dashboard with a status you track yourself.",
        },
        {
          question: 'Can I cancel my subscription anytime?',
          answer: 'Yes, there is no long-term contract — you can cancel or change your plan anytime from your account settings.',
        },
        {
          question: 'Is my data and listings protected?',
          answer: "Your data belongs to your account only, and no other tenant on the platform can access it — every account is fully isolated from the others.",
        },
      ],
    },
    finalCta: {
      title: 'Start your real estate website today',
      subtitle: 'Join sbaah and build your professional real estate presence in minutes — no developer or scattered tools needed.',
      primaryCta: 'Create your free account',
      secondaryCta: 'Log in',
    },
    footer: {
      rights: 'SBAAH — All rights reserved',
      login: 'Log in',
      tagline: 'An integrated Saudi real estate platform for brokers and marketers.',
      columns: {
        product: { title: 'Product', features: 'Features', pricing: 'Pricing', faq: 'FAQ' },
        account: { title: 'Account', login: 'Log in', register: 'Create account' },
      },
    },
  },
} satisfies Record<Locale, unknown>;
