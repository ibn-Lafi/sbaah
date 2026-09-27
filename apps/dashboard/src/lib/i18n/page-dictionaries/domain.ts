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
      'أضف جميع سجلات DNS الظاهرة أدناه كما هي. قد تظهر سجلات تحقق إضافية بعد أول اختبار للربط؛ أضفها أيضًا ثم أعد الاختبار.',
    apexHint:
      'يفضّل ربط نطاق فرعي مثل www.example.com. ربط النطاق الرئيسي example.com يتطلب من مزود DNS دعم CNAME Flattening/ALIAS؛ وإلا استخدم www.',
    dnsFieldName: 'الاسم (Name)',
    dnsFieldValue: 'القيمة (Value)',
    copyValue: 'نسخ',
    verifyConnection: 'اختبار الربط',
    notVerifiedYet:
      'لم يتم رصد الربط بعد — تأكد من إضافة السجلين أعلاه بالضبط لدى مزوّد الدومين، وقد يستغرق انتشارها حتى ساعات قليلة قبل إعادة المحاولة.',
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
      'Add every DNS record shown below exactly as provided. Additional certificate-validation records may appear after the first verification check; add them too, then verify again.',
    apexHint:
      'A subdomain such as www.example.com is recommended. Connecting the apex example.com requires DNS-provider support for CNAME flattening/ALIAS; otherwise use www.',
    dnsFieldName: 'Name',
    dnsFieldValue: 'Value',
    copyValue: 'Copy',
    verifyConnection: 'Verify Connection',
    notVerifiedYet:
      'Connection not detected yet — make sure both records above are added exactly as shown with your domain provider. Propagation can take up to a few hours before trying again.',
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
