export const projectsAr = {
  list: {
    title: 'المشاريع',
    addButton: '+ إضافة مشروع',
    createModalTitle: 'إضافة مشروع',
    createSubmitLabel: 'إضافة المشروع',
    table: {
      name: 'اسم المشروع',
      status: 'الحالة',
    },
    emptyState:
      'لا توجد مشاريع بعد — تجميع اختياري لعقاراتك تحت مشروع واحد (مثل مشروع سكني متعدد العمارات)',
  },
  detail: {
    notFoundTitle: 'مشروع غير موجود',
    notFoundMessage: 'المشروع غير موجود.',
    defaultTitle: 'تعديل مشروع',
    editSubmitLabel: 'حفظ التعديلات',
    buildingsSectionTitle: 'العمارات التابعة لهذا المشروع',
    addBuildingButton: '+ إضافة عمارة',
    createBuildingModalTitle: 'إضافة عمارة',
    createBuildingSubmitLabel: 'إضافة العمارة',
    noBuildings: 'لا عمارات مرتبطة بعد.',
    deleteLabel: 'حذف',
    deleteConfirmTitle: 'حذف المشروع',
    deleteConfirmMessage:
      'سيتم حذف هذا المشروع نهائيًا، وستبقى العمارات المرتبطة به بلا مشروع محدد. لا يمكن التراجع عن هذا الإجراء.',
    deleteFallbackError: 'تعذّر حذف المشروع',
    loadError: 'تعذّر تحميل بيانات المشروع.',
    retry: 'إعادة المحاولة',
  },
  form: {
    fields: {
      nameAr: 'اسم المشروع (عربي)',
      nameEn: 'اسم المشروع (إنجليزي، اختياري)',
      descriptionAr: 'وصف المشروع (عربي، اختياري)',
      descriptionEn: 'وصف المشروع (إنجليزي، اختياري)',
      citySelect: 'اختر المدينة',
      districtSelect: 'الحي (اختياري)',
    },
    validationError: 'يرجى مراجعة بيانات المشروع',
    saveError: 'تعذّر حفظ المشروع',
    saving: 'جارٍ الحفظ...',
  },
};

export const projectsEn: typeof projectsAr = {
  list: {
    title: 'Projects',
    addButton: '+ Add project',
    createModalTitle: 'Add project',
    createSubmitLabel: 'Add project',
    table: {
      name: 'Project name',
      status: 'Status',
    },
    emptyState:
      'No projects yet — an optional way to group your properties under one project (like a multi-building residential development)',
  },
  detail: {
    notFoundTitle: 'Project not found',
    notFoundMessage: 'This project does not exist.',
    defaultTitle: 'Edit project',
    editSubmitLabel: 'Save changes',
    buildingsSectionTitle: 'Buildings under this project',
    addBuildingButton: '+ Add building',
    createBuildingModalTitle: 'Add building',
    createBuildingSubmitLabel: 'Add building',
    noBuildings: 'No buildings linked yet.',
    deleteLabel: 'Delete',
    deleteConfirmTitle: 'Delete project',
    deleteConfirmMessage:
      'This project will be permanently deleted, and its buildings will remain without an assigned project. This action cannot be undone.',
    deleteFallbackError: 'Failed to delete project',
    loadError: 'Failed to load this project.',
    retry: 'Retry',
  },
  form: {
    fields: {
      nameAr: 'Project name (Arabic)',
      nameEn: 'Project name (English, optional)',
      descriptionAr: 'Project description (Arabic, optional)',
      descriptionEn: 'Project description (English, optional)',
      citySelect: 'Choose a city',
      districtSelect: 'District (optional)',
    },
    validationError: 'Please review the project details',
    saveError: 'Failed to save project',
    saving: 'Saving...',
  },
};
