'use client';

import { Switch } from '@/components/ui/switch';
import { useLocale } from '@/lib/i18n/locale-context';
import { useTheme } from '@/lib/theme/theme-context';

function MoonIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5"><path d="M20 15.2A8.5 8.5 0 0 1 8.8 4a8.5 8.5 0 1 0 11.2 11.2Z"/></svg>}
function LanguageIcon(){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className="h-5 w-5"><path d="M4 5h7M7.5 3v2c0 4-2 7-5 9M5 10c1.5 2 3 3.3 5 4"/><path d="m13 20 4-10 4 10M14.5 16h5"/></svg>}

export function LanguageThemeSwitchCard(){
 const {locale,setLocale}=useLocale();const {theme,toggleTheme}=useTheme();const ar=locale==='ar';
 return <div className="overflow-hidden rounded-[18px] border border-border-subtle bg-surface-card md:hidden">
  <div className="flex min-h-[64px] items-center justify-between gap-4 px-4">
   <div className="flex items-center gap-3 text-text-primary"><span className="text-text-tertiary"><MoonIcon/></span><span className="text-sm font-medium">{ar?'الوضع الداكن':'Dark mode'}</span></div>
   <Switch checked={theme==='dark'} onChange={toggleTheme}/>
  </div>
  <div className="h-px bg-border-subtle"/>
  <div className="flex min-h-[78px] items-center justify-between gap-4 px-4">
   <div className="flex items-center gap-3 text-text-primary"><span className="text-text-tertiary"><LanguageIcon/></span><span className="text-sm font-medium">{ar?'اللغة':'Language'}</span></div>
   <div className="flex rounded-[13px] bg-surface-subtle p-1">
    <button type="button" onClick={()=>setLocale('ar')} className={`h-9 min-w-[76px] rounded-[10px] px-3 text-sm transition-colors ${locale==='ar'?'bg-surface-card font-semibold text-text-primary shadow-sm':'text-text-secondary'}`}>العربية</button>
    <button type="button" onClick={()=>setLocale('en')} className={`h-9 min-w-[76px] rounded-[10px] px-3 text-sm transition-colors ${locale==='en'?'bg-surface-card font-semibold text-text-primary shadow-sm':'text-text-secondary'}`}>English</button>
   </div>
  </div>
 </div>
}
