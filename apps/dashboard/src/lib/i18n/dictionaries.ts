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
    brokerMarketer: string;
    website: {
      label: string;
      themeEditor: string;
      themeStore: string;
      pages: string;
      domain: string;
    };
    apps: string;
  };
  accountMenu: {
    settings: string;
    team: string;
    billing: string;
    signOut: string;
  };
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
}

export const dictionaries: Record<Locale, ChromeDictionary> = {
  ar: {
    nav: {
      dashboard: 'لوحة القيادة',
      leads: 'إدارة العملاء',
      propertiesGroup: {
        label: 'العقارات',
        units: 'الوحدات',
        buildings: 'العمارات',
        projects: 'المشاريع',
        rentals: 'الإيجارات',
      },
      brokerMarketer: 'الوسطاء والمسوقين',
      website: {
        label: 'الموقع الالكتروني',
        themeEditor: 'تخصيص الثيم',
        themeStore: 'متجر الثيمات',
        pages: 'الصفحات',
        domain: 'الدومين',
      },
      apps: 'التطبيقات',
    },
    accountMenu: {
      settings: 'حسابي',
      team: 'إدارة الموظفين',
      billing: 'الفوترة والاشتراك',
      signOut: 'تسجيل الخروج',
    },
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
      brokerMarketer: 'Brokers & Marketers',
      website: {
        label: 'Website',
        themeEditor: 'Theme Editor',
        themeStore: 'Theme Store',
        pages: 'Pages',
        domain: 'Domain',
      },
      apps: 'Apps',
    },
    accountMenu: {
      settings: 'My Account',
      team: 'Team Management',
      billing: 'Billing & Subscription',
      signOut: 'Sign Out',
    },
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
  },
};
