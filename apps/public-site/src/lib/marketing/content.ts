import type { Locale } from '@/lib/i18n/locales';

/**
 * سبعة's own marketing copy — deliberately separate from
 * `lib/i18n/dictionary.ts`, which stays flat/minimal for tenant-site
 * chrome only (see that file's own comment). This page's content has no
 * relationship to any tenant.
 */
export const MARKETING_CONTENT = {
  ar: {
    brand: 'سبعة',
    nav: { features: 'المميزات', pricing: 'الأسعار', login: 'تسجيل الدخول', cta: 'أنشئ حسابك', languageSwitch: 'English' },
    hero: {
      eyebrow: 'منصة عقارية متكاملة للوسيط والمسوّق العقاري',
      title: 'موقعك العقاري وإدارة عملائك، في مكان واحد',
      subtitle:
        'أنشئ موقعًا عقاريًا احترافيًا بدقائق، استقبل استفسارات العملاء مباشرة عبر واتساب، وتابع كل عميل محتمل من مكان واحد — دون الحاجة لمبرمج أو أدوات متفرقة.',
      primaryCta: 'أنشئ موقعك الآن',
      secondaryCta: 'المميزات',
    },
    features: {
      title: 'كل ما يحتاجه عملك العقاري',
      items: [
        { title: 'موقع عقاري جاهز', body: 'قوالب احترافية بألوانك وخطك الخاص، بلا حاجة لمبرمج أو مصمم.' },
        { title: 'دومين مخصص', body: 'اربط موقعك بنطاقك الخاص، أو استخدم نطاقًا فرعيًا من سبعة مباشرة.' },
        { title: 'واتساب مباشر', body: 'زر تواصل فوري على كل عقار — يصل العميل المهتم إليك مباشرة.' },
        { title: 'إدارة عملاء (CRM)', body: 'كل استفسار يتحول تلقائيًا لعميل محتمل بحالة واضحة وملاحظاتك الخاصة.' },
        { title: 'فريق بأدوار محددة', body: 'مالك، مشرف، ووسيط — كل عضو في فريقك يرى ما يخصه فقط.' },
        { title: 'لوحة أداء', body: 'زيارات موقعك وعملاؤك المحتملون، في مكان واحد واضح.' },
      ],
    },
    pricing: {
      title: 'أسعار واضحة، بلا مفاجآت',
      subtitle: 'اشترك بالخطة المناسبة لك، وألغِ الاشتراك متى شئت. الأسعار شاملة ضريبة القيمة المضافة.',
      perMonth: 'ريال / شهريًا',
      cta: 'اشترك الآن',
      propertiesLimit: 'عدد العقارات',
      usersLimit: 'أعضاء الفريق',
      customDomainYes: 'دومين مخصص',
      customDomainNo: 'نطاق فرعي من سبعة',
    },
    footer: { rights: 'سبعة — جميع الحقوق محفوظة', login: 'تسجيل الدخول' },
  },
  en: {
    brand: 'SBAAH',
    nav: { features: 'Features', pricing: 'Pricing', login: 'Log in', cta: 'Create your account', languageSwitch: 'العربية' },
    hero: {
      eyebrow: 'An integrated platform for real estate brokers & marketers',
      title: 'Your real estate website and client management, in one place',
      subtitle:
        'Launch a professional real estate website in minutes, receive client inquiries straight to WhatsApp, and follow up on every lead from one place — no developer or scattered tools needed.',
      primaryCta: 'Create your site now',
      secondaryCta: 'Features',
    },
    features: {
      title: 'Everything your real estate business needs',
      items: [
        { title: 'Ready-made website', body: 'Professional templates in your own colors and font — no developer or designer needed.' },
        { title: 'Custom domain', body: 'Connect your own domain, or use a free SBAAH subdomain right away.' },
        { title: 'Direct WhatsApp', body: 'An instant contact button on every listing — interested clients reach you directly.' },
        { title: 'Client management (CRM)', body: 'Every inquiry becomes a lead automatically, with clear status and your own notes.' },
        { title: 'Role-based team', body: 'Owner, admin, and agent — each teammate sees only what applies to them.' },
        { title: 'Performance dashboard', body: 'Your site visits and leads, in one clear place.' },
      ],
    },
    pricing: {
      title: 'Clear pricing, no surprises',
      subtitle: 'Subscribe to the plan that fits you, cancel anytime. Prices include VAT.',
      perMonth: 'SAR / month',
      cta: 'Subscribe now',
      propertiesLimit: 'Properties',
      usersLimit: 'Team members',
      customDomainYes: 'Custom domain',
      customDomainNo: 'SBAAH subdomain only',
    },
    footer: { rights: 'SBAAH — All rights reserved', login: 'Log in' },
  },
} satisfies Record<Locale, unknown>;
