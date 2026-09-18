import type { Locale } from './locale';

/** Only the persistent chrome (sidebar/topbar/mobile nav/app-shell banners) is translated so far — every other page stays Arabic-only until translated in a later pass. */
export interface ChromeDictionary {
  nav: {
    dashboard: string;
    leads: string;
    propertiesGroup: {
      label: string;
      units: string;
      buildings: string;
      projects: string;
      rentals: string;
    };
    website: {
      label: string;
      themeEditor: string;
      themeStore: string;
      pages: string;
      domain: string;
    };
    apps: string;
    support: string;
    toggleSidebar: string;
  };
  /** الإعدادات — نقطة دخول واحدة في الشريط الجانبي (سطح المكتب) والشريط السفلي (الجوال) على حد سواء، تقود لصفحة /settings المُبوَّبة (الحساب/الموظفين/الفوترة/بيانات الموقع). */
  settingsNavLabel: string;
  topbar: {
    searchPlaceholder: string;
    visitSite: string;
    myAccount: string;
  };
  mobileNav: {
    morePages: string;
    close: string;
  };
  appShell: {
    suspended: string;
    cancelled: string;
    trialExpired: string;
    subscribeNow: string;
    trialDaysRemaining: (days: number) => string;
  };
  toggles: {
    languageLabel: string;
    switchToArabic: string;
    switchToEnglish: string;
    themeLabel: string;
    switchToLight: string;
    switchToDark: string;
  };
  /** Shown in the sidebar/mobile-nav account switcher (PRODUCT_SPEC section 8) — same 3 values previously threaded in as an untranslated `roleLabel` prop from every page (`lib/auth/role-labels.ts`, still Arabic-only and still used for genuine page content like settings' "دورك" field and the team role picker). */
  roleLabels: {
    owner: string;
    admin: string;
    agent: string;
  };
}

export const dictionaries: Record<Locale, ChromeDictionary> = {
  ar: {
    nav: {
      dashboard: 'الرئيسية',
      leads: 'العملاء',
      propertiesGroup: {
        label: 'العقارات',
        units: 'الوحدات',
        buildings: 'العمارات',
        projects: 'المشاريع',
        rentals: 'الإيجارات',
      },
      website: {
        label: 'الموقع الالكتروني',
        themeEditor: 'تخصيص الثيم',
        themeStore: 'متجر الثيمات',
        pages: 'الصفحات',
        domain: 'الدومين',
      },
      apps: 'التطبيقات',
      support: 'مركز الدعم',
      toggleSidebar: 'طي/توسيع الشريط الجانبي',
    },
    settingsNavLabel: 'الإعدادات',
    topbar: {
      searchPlaceholder: 'بحث...',
      visitSite: 'زيارة الموقع',
      myAccount: 'حسابي',
    },
    mobileNav: {
      morePages: 'بقية الصفحات',
      close: 'إغلاق',
    },
    appShell: {
      suspended:
        'حسابك معلَّق حاليًا — البيانات معروضة للقراءة فقط، ولا يمكن إجراء أي تعديل حتى تجديد اشتراكك.',
      cancelled: 'تم إلغاء هذا الحساب — البيانات معروضة للقراءة فقط.',
      trialExpired: 'انتهت تجربتك المجانية — البيانات معروضة للقراءة فقط، اشترك بباقة لمواصلة استخدام حسابك.',
      subscribeNow: 'الاشتراك الآن',
      trialDaysRemaining: (days) => `باقي على انتهاء تجربتك المجانية ${days} ${days === 1 ? 'يوم' : 'أيام'}.`,
    },
    toggles: {
      languageLabel: 'اللغة',
      switchToArabic: 'التبديل إلى العربية',
      switchToEnglish: 'التبديل إلى الإنجليزية',
      themeLabel: 'المظهر',
      switchToLight: 'التبديل إلى الوضع الفاتح',
      switchToDark: 'التبديل إلى الوضع الداكن',
    },
    roleLabels: {
      owner: 'مالك الحساب',
      admin: 'صلاحية كاملة',
      agent: 'وسيط',
    },
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      leads: 'Leads',
      propertiesGroup: {
        label: 'Properties',
        units: 'Units',
        buildings: 'Buildings',
        projects: 'Projects',
        rentals: 'Rentals',
      },
      website: {
        label: 'Website',
        themeEditor: 'Theme Editor',
        themeStore: 'Theme Store',
        pages: 'Pages',
        domain: 'Domain',
      },
      apps: 'Apps',
      support: 'Support Center',
      toggleSidebar: 'Collapse/expand sidebar',
    },
    settingsNavLabel: 'Settings',
    topbar: {
      searchPlaceholder: 'Search...',
      visitSite: 'Visit Site',
      myAccount: 'My Account',
    },
    mobileNav: {
      morePages: 'More Pages',
      close: 'Close',
    },
    appShell: {
      suspended: 'Your account is currently suspended — data is read-only until you renew your subscription.',
      cancelled: 'This account has been cancelled — data is read-only.',
      trialExpired: 'Your free trial has ended — data is read-only, subscribe to a plan to keep using your account.',
      subscribeNow: 'Subscribe Now',
      trialDaysRemaining: (days) => `${days} ${days === 1 ? 'day' : 'days'} left in your free trial.`,
    },
    toggles: {
      languageLabel: 'Language',
      switchToArabic: 'Switch to Arabic',
      switchToEnglish: 'Switch to English',
      themeLabel: 'Theme',
      switchToLight: 'Switch to light mode',
      switchToDark: 'Switch to dark mode',
    },
    roleLabels: {
      owner: 'Account Owner',
      admin: 'Full Access',
      agent: 'Agent',
    },
  },
};
