import { notFound } from 'next/navigation';
import { getTenantCustomPage } from '@/lib/tenant/get-tenant-site';

/** الصفحات — صفحة حرة كتبها المالك/المسؤول (مثل سياسة الخصوصية)، مربوطة من تذييل الموقع. */
export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await getTenantCustomPage(slug);
  if (!page) notFound();

  return (
    <div className="mx-auto max-w-[720px] px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold text-black/90">{page.title}</h1>
      <div className="whitespace-pre-wrap text-base leading-relaxed text-black/70">{page.content}</div>
    </div>
  );
}
