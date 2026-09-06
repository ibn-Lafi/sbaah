import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'سبعة — لوحة التحكم',
};

/** Dashboard is Arabic-first RTL, per PRODUCT_SPEC section 4. */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl">
      <body>{children}</body>
    </html>
  );
}
