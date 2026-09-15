export const dashboardHomeAr = {
  title: 'لوحة القيادة',
  weekdayShort: ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'],
  kpis: {
    publishedProperties: 'العقارات المنشورة',
    publishedThisMonth: (count: number) => `+${count} هذا الشهر`,
    views: 'المشاهدات (٣٠ يومًا)',
    viewsDelta: (pct: number) => `${pct >= 0 ? '+' : ''}${pct}% مقابل الأسبوع السابق`,
    viewsNotEnoughData: 'لا تتوفر بيانات كافية بعد',
    leads: 'العملاء المحتملون',
    leadsThisMonth: (count: number) => `+${count} هذا الشهر`,
    conversionRate: 'معدل التحويل',
    ofAllLeads: 'من إجمالي العملاء المحتملين',
  },
  viewsChart: {
    title: 'المشاهدات',
    range7Days: '٧ أيام',
    range30Days: '٣٠ يومًا',
    unavailable: 'إحصائيات المشاهدات غير متاحة لصلاحيتك.',
  },
  latestLeads: {
    title: 'آخر العملاء المحتملين',
    viewAll: 'عرض الكل',
    emptyState: 'لا يوجد عملاء محتملون بعد.',
  },
};

export const dashboardHomeEn: typeof dashboardHomeAr = {
  title: 'Dashboard',
  weekdayShort: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
  kpis: {
    publishedProperties: 'Published properties',
    publishedThisMonth: (count: number) => `+${count} this month`,
    views: 'Views (30 days)',
    viewsDelta: (pct: number) => `${pct >= 0 ? '+' : ''}${pct}% vs last week`,
    viewsNotEnoughData: 'Not enough data yet',
    leads: 'Leads',
    leadsThisMonth: (count: number) => `+${count} this month`,
    conversionRate: 'Conversion rate',
    ofAllLeads: 'of all leads',
  },
  viewsChart: {
    title: 'Views',
    range7Days: '7 days',
    range30Days: '30 days',
    unavailable: 'View statistics are not available for your role.',
  },
  latestLeads: {
    title: 'Latest leads',
    viewAll: 'View all',
    emptyState: 'No leads yet.',
  },
};
