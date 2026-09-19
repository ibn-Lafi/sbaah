'use client';
import {Sidebar} from './sidebar';
import {Topbar} from './topbar';
import {MobileNav} from './mobile-nav';
export function ConsoleShell({title,children}:{title:string;children:React.ReactNode}){
 return <div className="flex h-dvh overflow-hidden"><Sidebar/><div className="flex min-h-0 min-w-0 flex-1 flex-col"><Topbar title={title}/><div className="bg-surface-page relative z-10 -mt-5 flex min-h-0 flex-1 flex-col rounded-t-[28px] md:mt-0 md:rounded-none md:bg-transparent"><main className="flex-1 overflow-auto overscroll-contain p-3.5 pb-24 md:p-7 md:pb-7">{children}</main></div></div><MobileNav/></div>
}