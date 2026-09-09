import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';
import { ServiceWorkerRegister } from '@/components/pwa/service-worker-register';

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

/** Dashboard is Arabic-first RTL, per PRODUCT_SPEC section 4. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexSansArabic.variable}>
      <body>
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
