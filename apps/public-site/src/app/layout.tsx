import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'سبعة',
};

/**
 * Public-site is bilingual (PRODUCT_SPEC section 4). The real `lang`/`dir`
 * per tenant/visitor locale is set once host-based tenant resolution and
 * i18n routing land (task 26/35) — this is a placeholder default.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
