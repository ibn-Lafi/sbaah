import type { ReactNode } from 'react';

export function LavenderSection({children,className=''}:{children:ReactNode;className?:string}) {
  return <section className={`px-5 py-16 sm:px-6 sm:py-24 ${className}`}><div className="mx-auto w-full max-w-7xl">{children}</div></section>;
}

export function LavenderHeading({eyebrow,title,action}:{eyebrow?:string;title:string;action?:ReactNode}) {
  return <div className="mb-10 flex items-end justify-between gap-6 border-b border-black/10 pb-5 sm:mb-14">
    <div>{eyebrow&&<p className="mb-3 text-xs font-semibold uppercase tracking-[.22em] text-tenant-primary">{eyebrow}</p>}<h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-black sm:text-4xl lg:text-5xl">{title}</h2></div>{action}
  </div>;
}
