export const domainAr = {
  pageTitle: 'الدومين',
  modeToggle: {
    custom: 'الدومين المخصص',
    subdomain: 'النطاق الفرعي',
  },
  customDomain: {
    title: 'الدومين المخصص',
    subtitle: 'اربط دومينك الخاص بموقعك بدل النطاق الفرعي',
    statusVerified: 'مُفعّل',
    statusPending: 'بانتظار ربط DNS',
    dnsInstructions:
      'أضف سجل CNAME الظاهر أدناه فقط. بعد انتشاره، ستتحقق سبعة من الربط وتصدر شهادة الأمان تلقائيًا.',
    apexHint:
      'يفضّل ربط نطاق فرعي مثل www.example.com. ربط النطاق الرئيسي example.com يتطلب من مزود DNS دعم CNAME Flattening/ALIAS؛ وإلا استخدم www.',
    dnsFieldName: 'الاسم (Name)',
    dnsFieldValue: 'القيمة (Value)',
    copyValue: 'نسخ',
    verifyConnection: 'اختبار الربط',
    notVerifiedYet:
      'لم يتم رصد سجل CNAME بعد. تأكد من إضافته كما هو؛ ستواصل سبعة الفحص تلقائيًا ويمكنك إعادة الاختبار يدويًا.',
    removeDomain: 'إلغاء ربط الدومين',
    domainNameLabel: 'اسم الدومين',
    connecting: 'جارٍ الربط...',
    connectDomain: 'ربط الدومين',
    invalidFormat: 'صيغة الدومين غير صحيحة',
    connectFailed: 'تعذّر ربط الدومين',
    verifyFailed: 'تعذّر التحقق من الربط',
  },
  subdomain: {
    title: 'النطاق الفرعي',
    subtitle: 'عنوان موقعك الأساسي على سبعة',
    usernameLabel: 'اسم المستخدم',
    saving: 'جارٍ الحفظ...',
    saveChanges: 'حفظ التغييرات',
    upsell: 'رقّي باقتك لربط دومين مخصص بدل النطاق الفرعي',
    invalidFormat: 'نطاق فرعي غير صحيح',
    updateFailed: 'تعذّر تحديث النطاق الفرعي',
  },
};

export const domainEn: typeof domainAr = {
  pageTitle: 'Domain',
  modeToggle: {
    custom: 'Custom Domain',
    subdomain: 'Subdomain',
  },
  customDomain: {
    title: 'Custom Domain',
    subtitle: 'Connect your own domain to your site instead of the subdomain',
    statusVerified: 'Active',
    statusPending: 'Awaiting DNS connection',
    dnsInstructions:
      'Add the single CNAME record shown below. Once it propagates, Sbaah verifies the connection and issues SSL automatically.',
    apexHint:
      'A subdomain such as www.example.com is recommended. Connecting the apex example.com requires DNS-provider support for CNAME flattening/ALIAS; otherwise use www.',
    dnsFieldName: 'Name',
    dnsFieldValue: 'Value',
    copyValue: 'Copy',
    verifyConnection: 'Verify Connection',
    notVerifiedYet:
      'The CNAME has not been detected yet. Add it exactly as shown; Sbaah keeps checking automatically and you can also retry manually.',
    removeDomain: 'Disconnect Domain',
    domainNameLabel: 'Domain Name',
    connecting: 'Connecting...',
    connectDomain: 'Connect Domain',
    invalidFormat: 'Invalid domain format',
    connectFailed: 'Failed to connect domain',
    verifyFailed: 'Failed to verify connection',
  },
  subdomain: {
    title: 'Subdomain',
    subtitle: 'Your main site address on Sbaah',
    usernameLabel: 'Username',
    saving: 'Saving...',
    saveChanges: 'Save Changes',
    upsell: 'Upgrade your plan to connect a custom domain instead of the subdomain',
    invalidFormat: 'Invalid subdomain',
    updateFailed: 'Failed to update subdomain',
  },
};
