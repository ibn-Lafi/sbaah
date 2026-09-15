export const buildingsAr = {
  list: {
    title: 'العمارات',
    addButton: '+ إضافة عمارة',
    createModalTitle: 'إضافة عمارة',
    createSubmitLabel: 'إضافة العمارة',
    table: {
      name: 'اسم العمارة',
      floorsCount: 'عدد الطوابق',
    },
    emptyState: 'لا توجد عمارات بعد',
  },
  detail: {
    notFoundTitle: 'عمارة غير موجودة',
    notFoundMessage: 'العمارة غير موجودة.',
    defaultTitle: 'تعديل عمارة',
    editSubmitLabel: 'حفظ التعديلات',
    deleteLabel: 'حذف',
    deleteConfirmTitle: 'حذف العمارة',
    deleteConfirmMessage:
      'سيتم حذف هذه العمارة نهائيًا، وستبقى العقارات المرتبطة بها بلا عمارة محددة. لا يمكن التراجع عن هذا الإجراء.',
    deleteFallbackError: 'تعذّر حذف العمارة',
  },
  form: {
    fields: {
      noProject: 'بلا مشروع (عمارة مستقلة)',
      nameAr: 'اسم العمارة (عربي)',
      nameEn: 'اسم العمارة (إنجليزي، اختياري)',
      citySelect: 'اختر المدينة',
      districtSelect: 'الحي (اختياري)',
      floorsCount: 'عدد الطوابق (اختياري)',
    },
    validationError: 'يرجى مراجعة بيانات العمارة',
    saveError: 'تعذّر حفظ العمارة',
    saving: 'جارٍ الحفظ...',
  },
};

export const buildingsEn: typeof buildingsAr = {
  list: {
    title: 'Buildings',
    addButton: '+ Add building',
    createModalTitle: 'Add building',
    createSubmitLabel: 'Add building',
    table: {
      name: 'Building name',
      floorsCount: 'Floors',
    },
    emptyState: 'No buildings yet',
  },
  detail: {
    notFoundTitle: 'Building not found',
    notFoundMessage: 'This building does not exist.',
    defaultTitle: 'Edit building',
    editSubmitLabel: 'Save changes',
    deleteLabel: 'Delete',
    deleteConfirmTitle: 'Delete building',
    deleteConfirmMessage:
      'This building will be permanently deleted, and its properties will remain without an assigned building. This action cannot be undone.',
    deleteFallbackError: 'Failed to delete building',
  },
  form: {
    fields: {
      noProject: 'No project (standalone building)',
      nameAr: 'Building name (Arabic)',
      nameEn: 'Building name (English, optional)',
      citySelect: 'Choose a city',
      districtSelect: 'District (optional)',
      floorsCount: 'Number of floors (optional)',
    },
    validationError: 'Please review the building details',
    saveError: 'Failed to save building',
    saving: 'Saving...',
  },
};
