import { DEFAULT_SECTION_TITLE } from '@/lib/website/section-labels';
import type { TextSectionProps } from '../types';
import { LavenderSection } from './primitives';

export function TextSection({type,config}:TextSectionProps){
 const body=config.body_ar??''; if(!body)return null;
 const title=config.title_ar||DEFAULT_SECTION_TITLE[type].ar;
 return <LavenderSection className={type==='about'?'bg-white':'bg-[#171713] text-white'}><div className="grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:gap-20"><div><span className="text-xs font-semibold uppercase tracking-[.22em] text-tenant-primary">{type==='about'?'عنّا':'لماذا نحن'}</span><h2 className={`mt-4 text-4xl font-medium leading-tight tracking-tight sm:text-5xl ${type==='about'?'text-black':'text-white'}`}>{title}</h2></div><p className={`whitespace-pre-line text-lg leading-9 sm:text-xl ${type==='about'?'text-black/60':'text-white/65'}`}>{body}</p></div></LavenderSection>;
}
