export const brokerMarketerAr = {
  pageTitle: 'الوسطاء والمسوقين',
  tabs: {
    broker: 'وسيط',
    marketer: 'مسوّق',
  },
  addButton: '+ إضافة',
  createModalTitle: 'إضافة وسيط أو مسوّق',
  table: {
    name: 'الاسم',
    city: 'المدينة',
    falLicense: 'رخصة فال',
    property: 'العقار',
    date: 'التاريخ',
    generalApplication: 'طلب عام',
  },
  emptyState: {
    noneYet: (type: 'broker' | 'marketer') =>
      `لا يوجد ${type === 'broker' ? 'وسطاء' : 'مسوّقون'} بعد`,
    hintPrefix: 'فعّل قسم "نموذج الوسطاء والمسوقين" من',
    hintLink: 'محرر الموقع',
    hintSuffix: 'ليتمكن المهتمون من التقديم.',
  },
  form: {
    fullNamePlaceholder: 'الاسم الكامل',
    cityPlaceholder: 'اختر المدينة',
    falLicensePlaceholder: 'رقم رخصة فال',
    applicantTypeBroker: 'وسيط',
    applicantTypeMarketer: 'مسوّق',
    noPropertyOption: 'بلا عقار محدد (اختياري)',
    submitting: 'جارٍ الإضافة...',
    submit: 'إضافة الطلب',
    invalidInput: 'يرجى مراجعة البيانات المدخلة',
    submitFailed: 'تعذّر إضافة الطلب',
  },
};

export const brokerMarketerEn: typeof brokerMarketerAr = {
  pageTitle: 'Brokers & Marketers',
  tabs: {
    broker: 'Broker',
    marketer: 'Marketer',
  },
  addButton: '+ Add',
  createModalTitle: 'Add Broker or Marketer',
  table: {
    name: 'Name',
    city: 'City',
    falLicense: 'FAL License',
    property: 'Property',
    date: 'Date',
    generalApplication: 'General Application',
  },
  emptyState: {
    noneYet: (type: 'broker' | 'marketer') =>
      `No ${type === 'broker' ? 'brokers' : 'marketers'} yet`,
    hintPrefix: 'Enable the "Broker & Marketer Form" section from the',
    hintLink: 'Website Editor',
    hintSuffix: 'so interested people can apply.',
  },
  form: {
    fullNamePlaceholder: 'Full Name',
    cityPlaceholder: 'Select City',
    falLicensePlaceholder: 'FAL License Number',
    applicantTypeBroker: 'Broker',
    applicantTypeMarketer: 'Marketer',
    noPropertyOption: 'No specific property (optional)',
    submitting: 'Adding...',
    submit: 'Add Application',
    invalidInput: 'Please review the entered data',
    submitFailed: 'Failed to add application',
  },
};
