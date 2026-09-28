'use client';

import { useRef, useState, type DragEvent } from 'react';

function MediaIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true" className="h-7 w-7 fill-none stroke-current" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3"/><circle cx="9" cy="10" r="2"/><path d="m5 18 5-5 3 3 2-2 4 4"/></svg>;
}

export function MediaDropzone({accept,multiple=false,disabled=false,hint,onFiles,className=''}:{accept:string;multiple?:boolean;disabled?:boolean;hint:string;onFiles:(files:FileList)=>void;className?:string}) {
  const inputRef=useRef<HTMLInputElement>(null);
  const [dragging,setDragging]=useState(false);
  function receive(files:FileList|null){if(!disabled&&files?.length)onFiles(files)}
  function drop(event:DragEvent<HTMLDivElement>){event.preventDefault();setDragging(false);receive(event.dataTransfer.files)}
  return <div
    onDragOver={event=>{event.preventDefault();if(!disabled)setDragging(true)}}
    onDragLeave={()=>setDragging(false)}
    onDrop={drop}
    className={`flex min-h-44 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed px-5 py-7 text-center transition sm:min-h-52 ${dragging?'border-brand bg-brand/5':'border-brand/70 bg-surface-card'} ${disabled?'cursor-wait opacity-60':'cursor-pointer hover:bg-brand/[0.03]'} ${className}`}
    onClick={()=>!disabled&&inputRef.current?.click()}
    role="button"
    tabIndex={disabled?-1:0}
    onKeyDown={event=>{if(!disabled&&(event.key==='Enter'||event.key===' ')){event.preventDefault();inputRef.current?.click()}}}
  >
    <MediaIcon/>
    <p className="mt-3 text-sm font-medium text-text-primary sm:text-base"><span className="text-brand underline underline-offset-4">استعرض</span> أو اسحب الملفات وأفلتها هنا</p>
    <p className="mt-2 text-xs text-text-secondary sm:text-sm">{hint}</p>
    {disabled&&<p className="mt-3 text-xs font-medium text-brand">جارٍ الرفع...</p>}
    <input ref={inputRef} className="hidden" type="file" accept={accept} multiple={multiple} disabled={disabled} onChange={event=>{receive(event.currentTarget.files);event.currentTarget.value=''}}/>
  </div>;
}
