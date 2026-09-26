'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { useLocale } from '@/lib/i18n/locale-context';
import { ApiRequestError } from '@/lib/api/client';

interface AssetUploaderProps {
  label: string;
  currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
  kind?: 'image' | 'video' | 'favicon';
  hint?: string;
}

const specs = {
  image: { accept: 'image/jpeg,image/png,image/webp', hint: '1200 × 900 px · JPG, PNG, WEBP' },
  video: { accept: 'video/mp4,video/webm', hint: '1920 × 1080 px · MP4, WEBM' },
  favicon: { accept: 'image/png,image/svg+xml,image/x-icon,image/vnd.microsoft.icon,.ico', hint: '512 × 512 px · PNG, SVG, ICO' },
} as const;

function UploadIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current" strokeWidth="1.8"><path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M5 14v4a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-4"/></svg>}
function TrashIcon(){return <svg aria-hidden="true" viewBox="0 0 24 24" className="h-4 w-4 fill-none stroke-current" strokeWidth="1.8"><path d="M4 7h16M9 7V4h6v3m3 0-1 13H7L6 7m4 4v5m4-5v5"/></svg>}

export function AssetUploader({ label, currentUrl, onUpload, onRemove, kind = 'image', hint }: AssetUploaderProps) {
  const { pages } = useLocale(); const t = pages.website;
  const isVideo = kind === 'video', isFavicon = kind === 'favicon';
  const [error,setError]=useState<string|null>(null),[loading,setLoading]=useState(false);
  const ref=useRef<HTMLInputElement>(null); const spec=specs[kind];
  async function selected(e:React.ChangeEvent<HTMLInputElement>){const file=e.target.files?.[0];e.target.value='';if(!file)return;setError(null);setLoading(true);try{await onUpload(file)}catch(err){setError(err instanceof ApiRequestError?err.message:t.assetUploader.errors[isVideo?'uploadVideo':'uploadImage'])}finally{setLoading(false)}}
  return <div className="flex min-w-0 flex-col gap-2">
    <div><p className="text-sm font-medium text-text-primary">{label}</p><p className="mt-1 text-xs text-text-tertiary">{hint??spec.hint}</p></div>
    <div className="rounded-xl border border-dashed border-border-default bg-surface-card p-3 sm:p-4">
      {currentUrl?<div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-center">
        {isVideo?<video src={currentUrl} muted className="aspect-video w-full rounded-lg border border-border-subtle object-cover sm:w-36"/>:<img src={currentUrl} alt={label} className={isFavicon?'h-20 w-20 rounded-lg border border-border-subtle object-contain':'aspect-[4/3] w-full rounded-lg border border-border-subtle object-cover sm:w-28'}/>}
        <div className="flex flex-wrap gap-2"><Button type="button" variant="secondary" disabled={loading} onClick={()=>ref.current?.click()}><UploadIcon/><span>{t.assetUploader.replace}</span></Button><Button type="button" variant="secondary" disabled={loading} onClick={()=>void onRemove()}><TrashIcon/><span>{t.assetUploader.remove}</span></Button></div>
      </div>:<button type="button" disabled={loading} onClick={()=>ref.current?.click()} className="flex min-h-24 w-full flex-col items-center justify-center gap-2 rounded-lg px-3 text-center text-sm text-text-secondary transition hover:bg-surface-subtle hover:text-brand"><UploadIcon/><span className="font-medium">{loading?t.assetUploader.uploading:t.assetUploader[isVideo?'uploadVideo':'uploadImage']}</span><span className="text-xs text-text-tertiary">{spec.hint}</span></button>}
      <input ref={ref} type="file" accept={spec.accept} className="hidden" onChange={e=>void selected(e)}/>
    </div><FormError message={error}/>
  </div>;
}
