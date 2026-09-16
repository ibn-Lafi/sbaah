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
      'أضِف كلا السجلين لدى مزوّد الدومين — CNAME للربط وTXT لإثبات الملكية، كلاهما مطلوب قبل تفعيل الشهادة.',
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
      'Add both records with your domain provider — CNAME to connect and TXT to prove ownership. Both are required before the certificate is activated.',
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
