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
  /** 'video' يبدّل معاينة `<img>` بمشغّل `<video>` وقيمة accept — يُستخدم لفيديو خلفية الهيرو. */
  kind?: 'image' | 'video' | 'favicon';
}

export function AssetUploader({ label, currentUrl, onUpload, onRemove, kind = 'image' }: AssetUploaderProps) {
  const { pages } = useLocale();
  const t = pages.website;
  const isVideo = kind === 'video';
  const isFavicon = kind === 'favicon';
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    setLoading(true);
    try {
      await onUpload(file);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.assetUploader.errors[isVideo ? 'uploadVideo' : 'uploadImage']);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-text-primary">{label}</p>
      {currentUrl ? (
        <div className="flex items-center gap-3">
          {isVideo ? (
            <video src={currentUrl} muted className={isFavicon ? "h-16 w-16 rounded-input border border-border-default object-contain" : "h-16 w-28 rounded-input border border-border-default object-cover"} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, not a local/optimizable asset
            <img src={currentUrl} alt={label} className={isFavicon ? "h-16 w-16 rounded-input border border-border-default object-contain" : "h-16 w-28 rounded-input border border-border-default object-cover"} />
          )}
          <Button type="button" variant="secondary" disabled={loading} onClick={() => fileInputRef.current?.click()}>
            {t.assetUploader.replace}
          </Button>
          <Button type="button" variant="danger" disabled={loading} onClick={() => void onRemove()}>
            {t.assetUploader.remove}
          </Button>
        </div>
      ) : (
        <Button type="button" variant="secondary" disabled={loading} onClick={() => fileInputRef.current?.click()} className="w-fit">
          {loading ? t.assetUploader.uploading : t.assetUploader[isVideo ? 'uploadVideo' : 'uploadImage']}
        </Button>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept={isVideo ? 'video/*' : isFavicon ? 'image/png,image/jpeg,image/webp,image/x-icon,image/vnd.microsoft.icon,.ico' : 'image/*'}
        className="hidden"
        onChange={(e) => void handleFileSelected(e)}
      />
      <FormError message={error} />
    </div>
  );
}
