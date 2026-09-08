'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { FormError } from '@/components/ui/form-error';
import { ApiRequestError } from '@/lib/api/client';

interface AssetUploaderProps {
  label: string;
  currentUrl: string | null;
  onUpload: (file: File) => Promise<void>;
  onRemove: () => Promise<void>;
}

export function AssetUploader({ label, currentUrl, onUpload, onRemove }: AssetUploaderProps) {
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
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر رفع الصورة');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium text-text-primary">{label}</p>
      {currentUrl ? (
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element -- Supabase Storage public URL, not a local/optimizable asset */}
          <img src={currentUrl} alt={label} className="h-16 w-28 rounded-input border border-border-default object-cover" />
          <Button type="button" variant="secondary" disabled={loading} onClick={() => fileInputRef.current?.click()}>
            استبدال
          </Button>
          <Button type="button" variant="danger" disabled={loading} onClick={() => void onRemove()}>
            إزالة
          </Button>
        </div>
      ) : (
        <Button type="button" variant="secondary" disabled={loading} onClick={() => fileInputRef.current?.click()} className="w-fit">
          {loading ? 'جارٍ الرفع...' : '+ رفع صورة'}
        </Button>
      )}
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => void handleFileSelected(e)} />
      <FormError message={error} />
    </div>
  );
}
