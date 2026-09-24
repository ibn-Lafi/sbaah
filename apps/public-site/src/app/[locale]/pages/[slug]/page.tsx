import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getTenantCustomPage, getTenantSiteResult } from '@/lib/tenant/get-tenant-site';
import { resolveTheme } from '@/components/themes/registry';
import { getPublicOrigin } from '@/lib/routing/public-url';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await getTenantCustomPage(slug);
  if (!page) return { robots: { index: false, follow: false } };

  const origin = await getPublicOrigin();
  return {
    title: page.title,
    alternates: origin ? { canonical: `${origin}/pages/${slug}` } : undefined,
  };
}

/** الصفحات — صفحة حرة كتبها المالك/المسؤول (مثل سياسة الخصوصية)، مربوطة من تذييل الموقع. */
export default async function CustomPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const [page,siteResult] = await Promise.all([getTenantCustomPage(slug),getTenantSiteResult()]);
  if (!page) notFound();
  const isLavender=siteResult.status==='active'&&resolveTheme(siteResult.site.website.theme_key).key==='lavender';

  return isLavender ? (
    <main className="bg-[#f4f1ea] px-5 py-16 sm:px-6 sm:py-24"><article className="mx-auto max-w-5xl"><header className="mb-12 border-b border-black/20 pb-8"><p className="mb-3 text-xs uppercase tracking-[.18em] text-black/40">Sbaah</p><h1 className="text-4xl font-medium leading-tight sm:text-6xl">{page.title}</h1></header><div className="max-w-3xl whitespace-pre-wrap text-base leading-9 text-black/65">{page.content}</div></article></main>
  ) : (
    <div className="mx-auto max-w-[720px] px-6 py-12"><h1 className="mb-6 text-2xl font-bold text-black/90">{page.title}</h1><div className="whitespace-pre-wrap text-base leading-relaxed text-black/70">{page.content}</div></div>
  );
}
