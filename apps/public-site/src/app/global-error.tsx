'use client';

import './globals.css';
import { RuntimeErrorState } from '@/components/system/error-state';

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body><RuntimeErrorState reset={reset} /></body>
    </html>
  );
}
