'use client';
import {useEffect,useState,type MouseEvent} from 'react';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {BrandMark} from '@/components/ui/brand-mark';
import {AdminAvatar} from '@/components/ui/admin-avatar';
import {NAV_ITEMS,SETTINGS_ITEM,isNavGroup} from './nav-items';
import {AccountsIcon,ChevronIcon,CloseIcon,MenuIcon,SettingsIcon} from './nav-icons';

export function MobileNav(){
 const pathname=usePathname(),router=useRouter();const [open,setOpen]=useState(false),[groups,setGroups]=useState<Record<string,boolean>>({});
 useEffect(()=>setOpen(false),[pathname]);useEffect(()=>{if(!open)return;const old=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=old}},[open]);
 function go(e:MouseEvent,href:string){e.preventDefault();setOpen(false);setTimeout(()=>router.push(href),200)}
 const home=pathname==='/';const accounts=pathname==='/accounts'||pathname.startsWith('/accounts/');
 return <div className="md:hidden">
  <div className="fixed inset-x-3 z-40 flex items-center justify-between gap-2.5" style={{bottom:'calc(env(safe-area-inset-bottom) + 12px)'}}>
   <button type="button" onClick={()=>setOpen(true)} aria-label="المزيد" className="bg-brand flex h-[52px] w-[52px] flex-none items-center justify-center rounded-full text-white shadow-[0_8px_24px_rgba(104,69,138,.3)]"><MenuIcon className="h-5 w-5"/></button>
   <nav className="border-border-subtle bg-surface-card flex h-[56px] min-w-0 flex-1 items-stretch rounded-full border p-1 shadow-[0_8px_24px_rgba(31,29,34,.12)]">
    <Link href="/" className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 text-[9px] ${home?'bg-surface-subtle font-semibold text-text-primary':'text-text-tertiary'}`}><AccountsIcon className="h-[18px] w-[18px]"/><span>الرئيسية</span></Link>
    <Link href="/accounts" className={`flex flex-1 flex-col items-center justify-center gap-1 rounded-full px-2 text-[9px] ${accounts?'bg-surface-subtle font-semibold text-text-primary':'text-text-tertiary'}`}><AccountsIcon className="h-[18px] w-[18px]"/><span>الحسابات</span></Link>
   </nav>
   <Link href={SETTINGS_ITEM.href} className={`border-border-subtle bg-surface-card flex h-[52px] w-[52px] items-center justify-center rounded-full border shadow-[0_8px_24px_rgba(31,29,34,.12)] ${pathname==='/settings'?'text-brand':'text-text-primary'}`}><SettingsIcon className="h-5 w-5"/></Link>
  </div>
  <div onClick={()=>setOpen(false)} className={`fixed inset-0 z-50 bg-black/45 transition-opacity duration-300 ${open?'opacity-100':'pointer-events-none opacity-0'}`}/>
  <div role="dialog" aria-modal="true" aria-hidden={!open} className={`bg-surface-card rounded-card fixed inset-y-3 right-0 z-50 flex w-[82%] max-w-[340px] flex-col overflow-hidden shadow-[0_0_40px_rgba(31,29,34,.25)] transition-transform duration-300 ${open?'translate-x-0':'translate-x-full'}`}>
   <div className="border-border-subtle flex h-14 items-center justify-between border-b px-4"><BrandMark width={45} height={20}/><button type="button" onClick={()=>setOpen(false)} className="flex h-9 w-9 items-center justify-center rounded-full text-text-tertiary hover:bg-surface-subtle"><CloseIcon className="h-5 w-5"/></button></div>
   <div className="flex-1 overflow-auto overscroll-contain p-3"><div className="bg-surface-subtle flex items-center gap-2 rounded-[14px] px-3 py-3"><AdminAvatar/><div><div className="text-[13px] font-semibold text-text-primary">إدارة سبعة</div><div className="text-[11px] text-text-secondary">مالك المنصة</div></div></div>
    <nav className="mt-2 flex flex-col gap-px">{NAV_ITEMS.map(item=>{if(isNavGroup(item)){const active=item.children.some(x=>pathname===x.href||pathname.startsWith(x.href+'/'));const expanded=groups[item.group]??active;const I=item.icon;return <div key={item.group} className="mt-2"><button type="button" onClick={()=>setGroups(v=>({...v,[item.group]:!expanded}))} className={`flex h-11 w-full items-center gap-2 rounded-[10px] px-[10px] text-[15px] ${expanded?'font-semibold text-text-primary':'text-text-tertiary'}`}><I className="h-[17px] w-[17px]"/><span className="flex-1 text-start">{item.label}</span><ChevronIcon open={expanded} className="h-3.5 w-3.5"/></button>{expanded&&<div className="border-border-subtle me-[13px] flex flex-col border-e ps-[13px]">{item.children.map(x=>{const I2=x.icon,a=pathname===x.href||pathname.startsWith(x.href+'/');return <Link key={x.href} href={x.href} onClick={e=>go(e,x.href)} className={`flex h-11 items-center gap-2 rounded-[10px] px-[13px] text-[15px] ${a?'bg-brand-surface font-semibold text-brand':'text-text-tertiary'}`}><I2 className="h-[17px] w-[17px]"/>{x.label}</Link>})}</div>}</div>}const I=item.icon,a=item.href==='/'?pathname==='/':pathname===item.href;return <Link key={item.href} href={item.href} onClick={e=>go(e,item.href)} className={`flex h-11 items-center gap-2 rounded-[10px] px-[10px] text-[15px] ${a?'bg-brand-surface font-semibold text-brand':'text-text-tertiary'}`}><I className="h-[17px] w-[17px]"/>{item.label}</Link>})}</nav>
   </div>
  </div>
 </div>
}