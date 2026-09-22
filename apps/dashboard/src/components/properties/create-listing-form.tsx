'use client';

import { useState } from 'react';
import type { ListingInput } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { createListing } from '@/lib/api/real-estate';

export function CreateListingForm({
  accessToken,
  assetId,
  assetName,
  onCreated,
}: {
  accessToken: string;
  assetId: string;
  assetName: string;
  onCreated: (id: string) => void;
}) {
  const [type, setType] = useState<'sale' | 'rent'>('sale');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true);
    setError('');
    try {
      const input = {
        listing_number: f.get('listing_number'),
        listing_type: type,
        asset_ids: [assetId],
        title_ar: f.get('title_ar'),
        description_ar: f.get('description_ar') || null,
        asking_price: Number(f.get('asking_price')),
        pricing_period: type === 'rent' ? f.get('pricing_period') : null,
        advertisement_license_number: f.get('advertisement_license_number') || null,
        advertisement_license_expires_at: f.get('advertisement_license_expires_at') || null,
        advertiser_name: f.get('advertiser_name') || null,
      } as ListingInput;
      const r = await createListing(accessToken, input);
      onCreated(r.listing.id);
    } catch (x) {
      setError(x instanceof Error ? x.message : 'تعذر إنشاء العرض');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="rounded-xl bg-surface-subtle-3 p-4">
        <p className="text-xs text-text-secondary">العقار</p>
        <p className="mt-1 font-semibold">{assetName}</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-medium">نوع العرض</p>
        <div className="grid grid-cols-2 gap-2">
          <Button type="button" variant={type === 'sale' ? 'primary' : 'secondary'} onClick={() => setType('sale')}>للبيع</Button>
          <Button type="button" variant={type === 'rent' ? 'primary' : 'secondary'} onClick={() => setType('rent')}>للإيجار</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Input name="listing_number" placeholder="رقم العرض" required />
        <Input name="title_ar" placeholder={type === 'sale' ? 'عنوان عرض البيع' : 'عنوان عرض الإيجار'} required />
        <Input name="asking_price" type="number" min="0" step="0.01" placeholder={type === 'sale' ? 'سعر البيع' : 'قيمة الإيجار'} required />
        {type === 'rent' && (
          <Select name="pricing_period" defaultValue="annual" required>
            <option value="monthly">شهري</option>
            <option value="quarterly">ربع سنوي</option>
            <option value="semi_annual">نصف سنوي</option>
            <option value="annual">سنوي</option>
          </Select>
        )}
        <Input name="advertisement_license_number" placeholder="رقم ترخيص الإعلان" />
        <Input name="advertisement_license_expires_at" type="date" />
        <Input name="advertiser_name" placeholder="اسم المعلن" />
      </div>

      <Input name="description_ar" placeholder="وصف العرض" />

      <p className="text-xs text-text-secondary">
        سيُحفظ العرض كمسودة أولًا. يمكنك مراجعته ثم نشره من صفحة العرض.
      </p>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <Button type="submit" disabled={busy} className="w-full sm:w-auto">
        {busy ? 'جارٍ إنشاء العرض...' : type === 'sale' ? 'إنشاء عرض بيع' : 'إنشاء عرض إيجار'}
      </Button>
    </form>
  );
}
