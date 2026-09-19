import { notFound } from 'next/navigation';
import { apiGet } from '@/lib/api/client';
import { isLocale } from '@/lib/i18n/locales';

type LegalSettings={terms_title_ar:string;terms_title_en:string;terms_content_ar:string;terms_content_en:string};
export default async function TermsPage({params}:{params:Promise<{locale:string}>}){
 const {locale}=await params;if(!isLocale(locale))notFound();
 const s=await apiGet<LegalSettings>('/public/platform-settings');
 const title=locale==='ar'?s.terms_title_ar:s.terms_title_en;
 const content=locale==='ar'?s.terms_content_ar:s.terms_content_en;
 return <article className="mx-auto min-h-[60vh] max-w-4xl px-5 py-16 sm:px-6 sm:py-24"><h1 className="font-display text-3xl font-semibold text-text-primary sm:text-5xl">{title}</h1><div className="mt-8 whitespace-pre-wrap text-base leading-8 text-text-secondary sm:text-lg">{content}</div></article>;
}
