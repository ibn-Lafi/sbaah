'use client';

import { useEffect,useState,type CSSProperties } from 'react';
import Link from 'next/link';
import { usePathname,useRouter } from 'next/navigation';
import { BrandIcon, BrandMark } from '@/components/ui/brand-mark';
import { AdminAvatar } from '@/components/ui/admin-avatar';
import { NAV_ITEMS,SETTINGS_ITEM,isNavGroup } from './nav-items';
import { ChevronIcon,SidebarToggleIcon } from './nav-icons';
import { useCurrentAdmin } from '@/lib/auth/current-admin-context';
import { signOut } from '@/lib/auth/session';

const COLLAPSED_STORAGE_KEY='sbaah-console-sidebar-collapsed';
const FLYOUT_GAP=8;
function Backdrop(){return <div className="absolute inset-0 -z-10 overflow-hidden" style={{background:'linear-gradient(165deg,var(--color-brand-hover),var(--color-brand) 55%,var(--color-brand-hover))'}}><div className="absolute -top-16 -start-16 h-48 w-48 rounded-full bg-white/10 blur-2xl"/><div className="absolute top-1/3 -end-20 h-56 w-56 rounded-full bg-white/[0.07] blur-3xl"/><div className="absolute bottom-24 -start-10 h-40 w-40 rounded-full bg-white/[0.08] blur-2xl"/></div>}
function flyoutStyle(rect:DOMRect,top:number):CSSProperties{return {position:'fixed',top,right:window.innerWidth-rect.left+FLYOUT_GAP}}

export function Sidebar(){
 const pathname=usePathname(),router=useRouter(); const {admin}=useCurrentAdmin();
 const [collapsed,setCollapsed]=useState(false),[accountOpen,setAccountOpen]=useState(false),[openGroups,setOpenGroups]=useState<Record<string,boolean>>({}),[hovered,setHovered]=useState<string|null>(null),[rect,setRect]=useState<DOMRect|null>(null);
 useEffect(()=>{try{setCollapsed(localStorage.getItem(COLLAPSED_STORAGE_KEY)==='1')}catch{setCollapsed(false)}},[]);
 function toggle(){setCollapsed(v=>{const n=!v;try{localStorage.setItem(COLLAPSED_STORAGE_KEY,n?'1':'0')}catch{setCollapsed(n)}return n})}
 function enter(key:string,e:React.MouseEvent<HTMLElement>){if(collapsed){setHovered(key);setRect(e.currentTarget.getBoundingClientRect())}}
 function logout(){void signOut().then(()=>router.replace('/login'))}
 return <aside className={`relative z-20 hidden flex-none flex-col p-[10px_10px_18px] transition-[width] duration-200 md:flex ${collapsed?'w-[72px]':'w-[216px]'}`}>
  <Backdrop/>
  <div className="flex items-center justify-between px-2 pb-[18px]">{collapsed?<BrandIcon size={28} tone="white"/>:<BrandMark width={52} height={23} invert/>}<button type="button" onClick={toggle} aria-label="طي أو توسيع القائمة" className="flex h-8 w-8 items-center justify-center rounded-[9px] text-white/70 hover:bg-white/10 hover:text-white"><SidebarToggleIcon collapsed={collapsed} className="h-[17px] w-[17px]"/></button></div>
  <nav className="flex flex-1 flex-col gap-px overflow-y-auto">{NAV_ITEMS.map(item=>{
   if(isNavGroup(item)){const active=item.children.some(x=>pathname===x.href||pathname.startsWith(x.href+'/'));const open=!collapsed&&(openGroups[item.group]??active);const I=item.icon;const fly=collapsed&&hovered===item.group&&rect;return <div key={item.group} className="relative" onMouseEnter={e=>enter(item.group,e)} onMouseLeave={()=>setHovered(null)}>
    <button type="button" onClick={()=>!collapsed&&setOpenGroups(v=>({...v,[item.group]:!open}))} className={`flex h-[38px] w-full items-center gap-2 rounded-[9px] px-[10px] text-[15px] ${collapsed?'justify-center':''} ${active?'font-semibold text-white':'text-white/70 hover:bg-white/10 hover:text-white'}`}><I className="h-4 w-4 flex-none"/>{!collapsed&&<><span className="min-w-0 flex-1 truncate text-start">{item.label}</span><ChevronIcon open={open} className="h-3.5 w-3.5"/></>}</button>
    {open&&<div className="flex flex-col gap-px">{item.children.map(x=>{const A=x.icon,a=pathname===x.href||pathname.startsWith(x.href+'/');return <Link key={x.href} href={x.href} className={`flex h-[38px] items-center gap-2 rounded-[9px] pe-[10px] ps-[26px] text-[15px] ${a?'bg-white/15 font-semibold text-white':'text-white/60 hover:bg-white/10 hover:text-white'}`}><A className="h-4 w-4"/><span className="truncate">{x.label}</span></Link>})}</div>}
    {fly&&<div style={flyoutStyle(rect,rect.top)} className="bg-surface-card z-30 min-w-[190px] rounded-[14px] p-1.5 shadow-[0_10px_30px_rgba(31,29,34,.18)]"><div className="px-3 py-1.5 text-xs text-text-secondary">{item.label}</div>{item.children.map(x=>{const A=x.icon,a=pathname===x.href||pathname.startsWith(x.href+'/');return <Link key={x.href} href={x.href} className={`flex items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-[13px] font-medium ${a?'bg-brand-surface text-brand':'text-text-primary hover:bg-surface-subtle'}`}><A className="h-4 w-4"/>{x.label}</Link>})}</div>}
   </div>}
   const I=item.icon,a=item.href==='/'?pathname==='/':pathname===item.href||pathname.startsWith(item.href+'/');return <div key={item.href} onMouseEnter={e=>enter(item.href,e)} onMouseLeave={()=>setHovered(null)}><Link href={item.href} className={`flex h-[38px] items-center gap-2 rounded-[9px] px-[10px] text-[15px] ${collapsed?'justify-center':''} ${a?'bg-white/15 font-semibold text-white':'text-white/70 hover:bg-white/10 hover:text-white'}`}><I className="h-4 w-4"/>{!collapsed&&<span className="truncate">{item.label}</span>}</Link></div>
  })}</nav>
  <div className="relative mt-auto border-t border-white/15 pt-[10px]"><button type="button" onClick={()=>setAccountOpen(v=>!v)} className={`flex w-full items-center gap-[9px] px-2 py-[2px] text-start ${collapsed?'justify-center':''}`}><AdminAvatar/>{!collapsed&&<div className="min-w-0 flex-1"><div className="truncate text-xs font-semibold text-white">{admin.full_name}</div><div className="text-[11px] text-white/60">مالك المنصة</div></div>}</button>{accountOpen&&<div className={`bg-surface-card absolute z-30 flex flex-col gap-0.5 rounded-[14px] p-1.5 shadow-[0_10px_30px_rgba(31,29,34,.18)] ${collapsed?'start-full bottom-0 ms-2 w-[200px]':'inset-x-2 bottom-full mb-2'}`}><Link href={SETTINGS_ITEM.href} className="rounded-[10px] px-[14px] py-[11px] text-[13px] font-medium text-text-primary hover:bg-surface-subtle">إعدادات المنصة</Link><button type="button" onClick={logout} className="rounded-[10px] px-[14px] py-[11px] text-start text-[13px] font-medium text-danger hover:bg-danger-surface">تسجيل الخروج</button></div>}</div>
 </aside>
}