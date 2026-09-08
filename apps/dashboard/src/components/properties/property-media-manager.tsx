'use client';

import { useRef, useState } from 'react';
import type { PropertyMedia } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { deletePropertyMedia, uploadPropertyMedia } from '@/lib/api/properties';
import { ApiRequestError } from '@/lib/api/client';

interface PropertyMediaManagerProps {
  propertyId: string;
  accessToken: string;
  media: PropertyMedia[];
  onChange: (media: PropertyMedia[]) => void;
}

/** Limits (15 images / 2 videos / 50MB per video) are enforced server-side (apps/api/src/lib/property/media-limits.ts) — this only surfaces the resulting error, doesn't duplicate the check. */
export function PropertyMediaManager({ propertyId, accessToken, media, onChange }: PropertyMediaManagerProps) {
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFileSelected(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const { media: newMedia } = await uploadPropertyMedia(accessToken, propertyId, file);
      onChange([...media, newMedia]);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر رفع الملف');
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(mediaId: string) {
    setError(null);
    try {
      await deletePropertyMedia(accessToken, propertyId, mediaId);
      onChange(media.filter((item) => item.id !== mediaId));
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر حذف الملف');
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-3 gap-3">
        {media.map((item) => (
          <div key={item.id} className="group relative overflow-hidden rounded-input border border-border-default">
            {item.media_type === 'image' ? (
              // eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, not a local/optimizable asset
              <img src={item.url} alt="" className="h-32 w-full object-cover" />
            ) : (
              <video src={item.url} className="h-32 w-full object-cover" muted />
            )}
            <button
              type="button"
              onClick={() => void handleDelete(item.id)}
              className="absolute left-1 top-1 rounded-full bg-danger px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100"
            >
              حذف
            </button>
          </div>
        ))}
      </div>

      <FormError message={error} />

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,video/*"
        className="hidden"
        onChange={(e) => void handleFileSelected(e)}
      />
      <Button
        type="button"
        variant="secondary"
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
        className="w-fit"
      >
        {uploading ? 'جارٍ الرفع...' : '+ إضافة صورة أو فيديو'}
      </Button>
    </div>
  );
}
