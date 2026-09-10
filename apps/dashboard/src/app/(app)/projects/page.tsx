'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/** "المشاريع" دُمجت في صفحة "العقارات" الموحّدة كتبويب داخلي (مطابقةً لتصميم المؤسس) — هذا المسار يبقى فقط لأي رابط قديم يشير إليه مباشرة. */
export default function ProjectsRedirectPage() {
  const router = useRouter();
  useEffect(() => {
    router.replace('/properties?kind=projects');
  }, [router]);
  return null;
}
