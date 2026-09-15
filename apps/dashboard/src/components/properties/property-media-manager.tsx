'use client';

import { useRef, useState } from 'react';
import type { PropertyMedia } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { DeleteButton } from '@/components/ui/delete-button';
import { FormError } from '@/components/ui/form-error';
import { deletePropertyMedia, uploadPropertyMedia } from '@/lib/api/properties';
import { ApiRequestError } from '@/lib/api/client';
import { useLocale } from '@/lib/i18n/locale-context';

interface PropertyMediaManagerProps {
  propertyId: string;
  accessToken: string;
  media: PropertyMedia[];
  onChange: (media: PropertyMedia[]) => void;
}

/** Limits (15 images / 2 videos / 50MB per video) are enforced server-side (apps/api/src/lib/property/media-limits.ts) — this only surfaces the resulting error, doesn't duplicate the check. */
export function PropertyMediaManager({ propertyId, accessToken, media, onChange }: PropertyMediaManagerProps) {
  const { pages } = useLocale();
  const t = pages.properties.media;
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
      setError(err instanceof ApiRequestError ? err.message : t.uploadError);
    } finally {
      setUploading(false);
    }
  }

  async function handleDelete(mediaId: string) {
    try {
      await deletePropertyMedia(accessToken, propertyId, mediaId);
      onChange(media.filter((item) => item.id !== mediaId));
    } catch (err) {
      throw new Error(err instanceof ApiRequestError ? err.message : t.deleteError);
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
            <div className="absolute left-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
              <DeleteButton
                label={t.deleteLabel}
                confirmTitle={t.deleteConfirmTitle}
                confirmMessage={t.deleteConfirmMessage}
                onConfirm={() => handleDelete(item.id)}
                compact
              />
            </div>
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
        {uploading ? t.uploading : t.addButton}
      </Button>
    </div>
  );
}
