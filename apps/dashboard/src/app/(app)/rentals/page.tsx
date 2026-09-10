'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** "الإيجارات" دُمجت في صفحة "العقارات" الموحّدة كتبويب داخلي (مطابقةً لتصميم المؤسس) — هذا المسار يبقى فقط لأي رابط قديم يشير إليه مباشرة. */
export default function RentalsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/properties?kind=rentals');
  }, [router]);
  return null;
}
