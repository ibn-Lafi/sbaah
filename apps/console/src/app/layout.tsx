import type { Metadata } from 'next';
import './globals.css';

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
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
