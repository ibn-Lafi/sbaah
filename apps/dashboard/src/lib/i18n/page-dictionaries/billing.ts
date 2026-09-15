export const billingAr = {
  pageTitle: 'الفوترة والاشتراك',
  unlimited: 'بلا حدود',
  checkout: {
    success: 'جارٍ تأكيد الدفعة — قد يستغرق تحديث الباقة أدناه بضع ثوانٍ.',
    cancelled: 'أُلغيت عملية الدفع — لم يتم أي تغيير على باقتك.',
    startFailed: 'تعذّر بدء الدفع',
  },
  paymentFailed: {
    message: 'فشلت آخر عملية دفع لاشتراكك — جدّد الدفع الآن لتجنّب تعليق حسابك.',
    renewButton: 'جدّد الدفع',
  },
  currentPlan: {
    label: 'الباقة الحالية',
    activeBadge: 'نشطة',
    propertiesUsage: 'العقارات المستخدمة',
    usersUsage: 'المستخدمون',
    nextRenewal: (date: string) => `التجديد القادم: ${date}`,
    changePlanButton: 'تغيير الباقة',
  },
  plans: {
    backButton: 'رجوع للفوترة',
    heading: 'اختر باقتك',
    subheading: 'يمكنك تغيير الباقة في أي وقت من صفحة الفوترة.',
    cycleToggle: {
      annual: 'سنوي',
      monthly: 'شهري',
    },
  },
  planCard: {
    cycleLabel: (cycle: 'monthly' | 'annual'): string => (cycle === 'annual' ? 'سنويًا' : 'شهريًا'),
    savingsLabel: (months: number) => {
      if (months === 1) return 'وفّر شهرًا';
      if (months === 2) return 'وفّر شهرين';
      return `وفّر ${months} أشهر`;
    },
    usersLabel: (maxUsers: number) => (maxUsers === 1 ? 'مستخدم واحد' : `${maxUsers} مستخدمين`),
    introMonthsLabel: (months: number) => {
      if (months === 1) return 'أول شهر';
      if (months === 2) return 'أول شهرين';
      return `أول ${months} أشهر`;
    },
    currentPlanBadge: 'باقتك الحالية',
    currency: 'ريال',
    propertiesCount: (n: string) => `${n} عقار`,
    introPriceNote: (cycleLabel: string, introMonthsLabel: string, price: string) =>
      `/ ${cycleLabel} لـ${introMonthsLabel}، ثم ${price} ريال / ${cycleLabel}`,
    regularPriceNote: (cycleLabel: string) => `/ ${cycleLabel}`,
    vatNote: 'شامل ضريبة القيمة المضافة 15%',
    propertiesLimitLabel: 'حد العقارات',
    usersLimitLabel: 'حد المستخدمين',
    customDomainLabel: 'دومين مخصص',
    allowedLabel: 'مسموح',
    subdomainLabel: 'دومين فرعي',
    selectButton: 'اختيار هذه الباقة',
  },
};

export const billingEn: typeof billingAr = {
  pageTitle: 'Billing & Subscription',
  unlimited: 'Unlimited',
  checkout: {
    success: 'Confirming your payment — the plan below may take a few seconds to update.',
    cancelled: 'Payment was cancelled — no changes were made to your plan.',
    startFailed: 'Failed to start checkout',
  },
  paymentFailed: {
    message: 'Your last payment failed — renew now to avoid your account being suspended.',
    renewButton: 'Renew Payment',
  },
  currentPlan: {
    label: 'Current Plan',
    activeBadge: 'Active',
    propertiesUsage: 'Properties used',
    usersUsage: 'Users',
    nextRenewal: (date: string) => `Next renewal: ${date}`,
    changePlanButton: 'Change Plan',
  },
  plans: {
    backButton: 'Back to Billing',
    heading: 'Choose your plan',
    subheading: 'You can change your plan anytime from the billing page.',
    cycleToggle: {
      annual: 'Yearly',
      monthly: 'Monthly',
    },
  },
  planCard: {
    cycleLabel: (cycle: 'monthly' | 'annual') => (cycle === 'annual' ? 'yearly' : 'monthly'),
    savingsLabel: (months: number) => {
      if (months === 1) return 'Save 1 month';
      return `Save ${months} months`;
    },
    usersLabel: (maxUsers: number) => (maxUsers === 1 ? '1 user' : `${maxUsers} users`),
    introMonthsLabel: (months: number) => {
      if (months === 1) return 'the first month';
      return `the first ${months} months`;
    },
    currentPlanBadge: 'Your Current Plan',
    currency: 'SAR',
    propertiesCount: (n: string) => `${n} properties`,
    introPriceNote: (cycleLabel: string, introMonthsLabel: string, price: string) =>
      `/ ${cycleLabel} for ${introMonthsLabel}, then ${price} SAR / ${cycleLabel}`,
    regularPriceNote: (cycleLabel: string) => `/ ${cycleLabel}`,
    vatNote: 'VAT (15%) included',
    propertiesLimitLabel: 'Properties limit',
    usersLimitLabel: 'Users limit',
    customDomainLabel: 'Custom domain',
    allowedLabel: 'Included',
    subdomainLabel: 'Subdomain',
    selectButton: 'Select This Plan',
  },
};
