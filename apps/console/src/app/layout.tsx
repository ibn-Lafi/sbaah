import type { Metadata } from 'next';
import { IBM_Plex_Sans_Arabic } from 'next/font/google';
import './globals.css';

/** Self-hosted via next/font, same as dashboard — see that app's layout.tsx for why a plain CSS @import doesn't work here. */
const ibmPlexSansArabic = IBM_Plex_Sans_Arabic({
  subsets: ['arabic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-ibm-plex-arabic',
});

export const metadata: Metadata = {
  title: 'سبعة — إدارة المنصة',
  robots: { index: false, follow: false },
};

/**
 * Platform-owner only. Never indexed by search engines.
 * Access is authorized against platform_admins, never users.role
 * (PRODUCT_SPEC section 8 — see the naming-collision note there).
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className={ibmPlexSansArabic.variable}>
      <body>{children}</body>
    </html>
  );
}
