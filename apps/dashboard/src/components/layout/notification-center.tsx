'use client';

import { useEffect, useMemo, useState } from 'react';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { useLocale } from '@/lib/i18n/locale-context';
import { getNotifications, markNotificationRead, type DashboardNotification, type NotificationCategory } from '@/lib/api/notifications';

type Filter='all'|NotificationCategory;

function Bell({className}:{className?:string}){return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" className={className}><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></svg>}

export function NotificationCenter({mobileGrouped=false,desktopGrouped=false}:{mobileGrouped?:boolean;desktopGrouped?:boolean}){
 const {accessToken}=useCurrentUser();const {locale}=useLocale();const ar=locale==='ar';
 const [open,setOpen]=useState(false);const [filter,setFilter]=useState<Filter>('all');const [notices,setNotices]=useState<DashboardNotification[]>([]);const [unread,setUnread]=useState(0);const [loading,setLoading]=useState(true);
 async function refresh(){try{const r=await getNotifications(accessToken);setNotices(r.notifications);setUnread(r.unread)}finally{setLoading(false)}}
 useEffect(()=>{void refresh()},[accessToken]);
 useEffect(()=>{if(open)void refresh()},[open]);
 const shown=useMemo(()=>filter==='all'?notices:notices.filter(n=>n.category===filter),[filter,notices]);
 const tabs:Array<[Filter,string]>=[['all',ar?'الكل':'All'],['customers',ar?'العملاء':'Customers'],['real_estate',ar?'العقارات':'Real estate'],['calendar',ar?'المواعيد':'Calendar'],['rent',ar?'الإيجار':'Rent'],['system',ar?'النظام':'System']];
 async function openNotice(n:DashboardNotification){if(!n.read_at){setNotices(x=>x.map(v=>v.id===n.id?{...v,read_at:new Date().toISOString()}:v));setUnread(x=>Math.max(0,x-1));try{await markNotificationRead(accessToken,n.id)}catch{void refresh()}}setOpen(false);if(n.href)window.location.href=n.href}
 return <div className="relative flex-none">
  <button type="button" onClick={()=>setOpen(v=>!v)} aria-label={ar?'التنبيهات':'Notifications'} className={`relative flex h-9 w-9 items-center justify-center text-white md:h-[42px] md:w-[42px] md:rounded-full md:bg-surface-subtle md:text-text-primary ${mobileGrouped||desktopGrouped?'bg-transparent': 'rounded-full bg-white/15'} ${desktopGrouped?'md:rounded-[10px] md:!bg-transparent md:!text-white hover:md:!bg-white/10':''}`}><Bell className="h-[18px] w-[18px] md:h-[19px] md:w-[19px]"/>{unread>0&&<span className="absolute end-0.5 top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-danger px-1 text-[9px] font-bold leading-none text-white">{unread>9?'9+':unread}</span>}</button>
  {open&&<><button type="button" aria-label={ar?'إغلاق التنبيهات':'Close notifications'} onClick={()=>setOpen(false)} className="fixed inset-0 z-[115] bg-black/30 md:bg-transparent"/>
  <section className="bg-surface-card border-border-subtle fixed inset-x-3 top-[72px] z-[120] flex max-h-[min(68dvh,560px)] flex-col overflow-hidden rounded-[22px] border shadow-[0_16px_44px_rgba(31,29,34,.22)] md:absolute md:inset-x-auto md:end-0 md:top-[50px] md:w-[380px] md:max-h-[520px] md:rounded-[18px]">
   <div className="flex items-center justify-between px-4 pt-4 pb-3 md:px-5"><h2 className="text-[17px] font-bold text-text-primary md:text-[18px]">{ar?'التنبيهات':'Notifications'}</h2><button type="button" onClick={()=>setOpen(false)} className="flex h-8 w-8 items-center justify-center rounded-full text-xl text-text-tertiary hover:bg-surface-subtle">×</button></div>
   <div className="mx-3 flex gap-1 overflow-x-auto rounded-[13px] bg-surface-subtle p-1 md:mx-4">{tabs.map(([key,label])=><button key={key} type="button" onClick={()=>setFilter(key)} className={`h-8 flex-none rounded-[10px] px-3 text-xs font-medium transition-colors ${filter===key?'bg-surface-card text-text-primary shadow-sm':'text-text-secondary'}`}>{label}</button>)}</div>
   <div className="min-h-[230px] flex-1 overflow-auto px-3 py-3 md:min-h-[260px] md:px-4">
    {loading?<div className="flex min-h-[210px] items-center justify-center"><span className="h-6 w-6 animate-spin rounded-full border-2 border-brand/20 border-t-brand"/></div>:shown.length===0?<div className="flex min-h-[210px] flex-col items-center justify-center px-5 text-center"><div className="bg-brand-surface text-brand flex h-14 w-14 items-center justify-center rounded-full"><Bell className="h-6 w-6"/></div><p className="mt-4 text-sm font-semibold text-text-primary">{ar?'لا توجد تنبيهات حاليًا':'No notifications right now'}</p><p className="mt-1 max-w-[250px] text-xs leading-5 text-text-secondary">{ar?'ستظهر هنا التنبيهات التي تحتاج انتباهك.':'Notifications that need your attention will appear here.'}</p></div>:<div className="flex flex-col gap-2">{shown.map(n=><button key={n.id} type="button" onClick={()=>void openNotice(n)} className={`hover:bg-surface-subtle flex w-full gap-3 rounded-[14px] border border-border-subtle p-3 text-start transition-colors ${n.read_at?'opacity-65':''}`}><span className={`mt-1 h-2.5 w-2.5 flex-none rounded-full ${n.level==='high'?'bg-danger':n.level==='important'?'bg-warning':n.level==='new'?'bg-brand':'bg-text-tertiary'}`}/><div className="min-w-0"><p className="text-sm font-semibold text-text-primary">{n.title}</p><p className="mt-1 text-xs leading-5 text-text-secondary">{n.body}</p></div></button>)}</div>}
   </div>
  </section></>}
 </div>
}
