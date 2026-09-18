import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';
import { LocaleProvider } from '@/lib/i18n/locale-context';
import { LOCALE_STORAGE_KEY } from '@/lib/i18n/locale';
import { ThemeProvider } from '@/lib/theme/theme-context';
import { THEME_STORAGE_KEY } from '@/lib/theme/theme';
import { NavigationProgress } from '@/components/layout/navigation-progress';

/**
 * Self-hosted via next/font (no runtime request to Google, no
 * layout shift) rather than a CSS @import — see
 * docs/DASHBOARD_DESIGN_SYSTEM.md for why a plain @import doesn't work
 * here (Tailwind's own @import expands before it in the build output,
 * and browsers ignore an @import that isn't first).
 */
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
});

export const metadata: Metadata = {
  title: 'سبعة — لوحة التحكم',
  appleWebApp: { title: 'سبعة', statusBarStyle: 'default' },
};

export const viewport = { themeColor: '#68458A' };

/**
 * Runs before hydration (blocking, inline in <head>) so the very first
 * paint already reflects a returning visitor's saved language/theme
 * instead of always starting Arabic+light and flashing to their choice a
 * tick later. LocaleProvider/ThemeProvider read these same <html>
 * attributes back on mount instead of the hardcoded defaults below, so
 * client state stays in sync with what's already on screen.
 */
const themeAndLocaleInitScript = `(function(){try{var l=localStorage.getItem('${LOCALE_STORAGE_KEY}');if(l==='en'||l==='ar'){document.documentElement.lang=l;document.documentElement.dir=l==='ar'?'rtl':'ltr';}var t=localStorage.getItem('${THEME_STORAGE_KEY}');var d=t==='dark'||((!t||t==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.setAttribute('data-theme',d?'dark':'light');document.documentElement.style.colorScheme=d?'dark':'light';}catch(e){}})();`;

/** Dashboard defaults to Arabic-first RTL + light mode (PRODUCT_SPEC section 4); a returning visitor's saved language/theme is applied on top by the script above and by LocaleProvider/ThemeProvider. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexSansArabic.variable}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeAndLocaleInitScript }} />
      </head>
      <body>
        <LocaleProvider>
          <ThemeProvider>
            <NavigationProgress />
            {children}
            <ServiceWorkerRegister />
          </ThemeProvider>
        </LocaleProvider>
      </body>
    </html>
  );
}
