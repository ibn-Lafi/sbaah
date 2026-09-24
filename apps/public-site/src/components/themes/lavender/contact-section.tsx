import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import type { ContactSectionProps } from '../types';

export function ContactSection({config,whatsappPhone}:ContactSectionProps){
 const title=config.title_ar||DEFAULT_SECTION_TITLE.contact.ar;
 return <section id="contact" className="bg-tenant-primary px-5 py-16 text-white sm:px-6 sm:py-24"><div className="mx-auto flex max-w-7xl flex-col items-start justify-between gap-8 sm:flex-row sm:items-end"><h2 className="max-w-3xl text-4xl font-medium leading-tight sm:text-6xl">{title}</h2>{whatsappPhone&&<p dir="ltr" className="border-b border-white/60 pb-2 text-xl">{whatsappPhone}</p>}</div></section>;
}
