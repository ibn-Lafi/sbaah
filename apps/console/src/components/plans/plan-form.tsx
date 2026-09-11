'use client';

import { useState, type FormEvent } from 'react';
import type { BillingCycle, Plan, PlanInput } from '@sbaah/shared';
import { planInputSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';

interface PlanFormProps {
  initial?: Plan;
  submitLabel: string;
  onSubmit: (input: PlanInput) => Promise<void>;
}

/** Shared by plans/new and plans/[id] — same fields either way (create vs. update goes to a different endpoint at the call site). */
export function PlanForm({ initial, submitLabel, onSubmit }: PlanFormProps) {
  const [nameAr, setNameAr] = useState(initial?.name_ar ?? '');
  const [nameEn, setNameEn] = useState(initial?.name_en ?? '');
  const [billingCycle, setBillingCycle] = useState<BillingCycle>(initial?.billing_cycle ?? 'monthly');
  const [price, setPrice] = useState(initial ? String(initial.price) : '');
  const [introPrice, setIntroPrice] = useState(
    initial?.intro_price != null ? String(initial.intro_price) : '',
  );
  const [introMonths, setIntroMonths] = useState(
    initial?.intro_months != null ? String(initial.intro_months) : '',
  );
  const [streampayProductId, setStreampayProductId] = useState(initial?.streampay_product_id ?? '');
  const [descriptionAr, setDescriptionAr] = useState(initial?.description_ar ?? '');
  const [maxProperties, setMaxProperties] = useState(
    initial?.max_properties != null ? String(initial.max_properties) : '',
  );
  const [maxUsers, setMaxUsers] = useState(initial?.max_users != null ? String(initial.max_users) : '');
  const [customDomainAllowed, setCustomDomainAllowed] = useState(
    initial?.custom_domain_allowed ?? false,
  );
  const [isActive, setIsActive] = useState(initial?.is_active ?? true);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const parsed = planInputSchema.safeParse({
      name_ar: nameAr,
      name_en: nameEn,
      billing_cycle: billingCycle,
      price: Number(price),
      intro_price: introPrice === '' ? null : Number(introPrice),
      intro_months: introMonths === '' ? null : Number(introMonths),
      streampay_product_id: streampayProductId === '' ? null : streampayProductId,
      description_ar: descriptionAr === '' ? null : descriptionAr,
      max_properties: maxProperties === '' ? null : Number(maxProperties),
      max_users: maxUsers === '' ? null : Number(maxUsers),
      custom_domain_allowed: customDomainAllowed,
      is_active: isActive,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? 'بيانات غير صحيحة');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(parsed.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر الحفظ');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm">
          اسم الباقة (عربي)
          <Input value={nameAr} onChange={(e) => setNameAr(e.target.value)} />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          اسم الباقة (إنجليزي)
          <Input value={nameEn} onChange={(e) => setNameEn(e.target.value)} dir="ltr" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          دورة الفوترة
          <Select value={billingCycle} onChange={(e) => setBillingCycle(e.target.value as BillingCycle)}>
            <option value="monthly">شهري</option>
            <option value="annual">سنوي</option>
          </Select>
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          السعر (ريال، شامل الضريبة، لكل دورة فوترة أعلاه)
          <Input
            type="number"
            min="0"
            step="0.01"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            dir="ltr"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          السعر التعريفي الشهري (اختياري — للدورة الشهرية فقط)
          <Input
            type="number"
            min="0"
            step="0.01"
            value={introPrice}
            onChange={(e) => setIntroPrice(e.target.value)}
            dir="ltr"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          عدد أشهر السعر التعريفي
          <Input
            type="number"
            min="1"
            step="1"
            value={introMonths}
            onChange={(e) => setIntroMonths(e.target.value)}
            dir="ltr"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          معرّف المنتج في StreamPay (Product ID)
          <Input
            value={streampayProductId}
            onChange={(e) => setStreampayProductId(e.target.value)}
            dir="ltr"
            placeholder="أنشئ المنتج أولًا من لوحة StreamPay ثم الصق معرّفه هنا"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm sm:col-span-2">
          وصف تسويقي قصير (اختياري)
          <Input
            value={descriptionAr}
            onChange={(e) => setDescriptionAr(e.target.value)}
            placeholder="يظهر تحت اسم الباقة في بطاقات الأسعار"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          الحد الأقصى للعقارات (اتركه فارغًا لعدد بلا حدود)
          <Input
            type="number"
            min="1"
            step="1"
            value={maxProperties}
            onChange={(e) => setMaxProperties(e.target.value)}
            dir="ltr"
          />
        </label>
        <label className="flex flex-col gap-1.5 text-sm">
          الحد الأقصى لأعضاء الفريق (اتركه فارغًا لعدد بلا حدود)
          <Input
            type="number"
            min="1"
            step="1"
            value={maxUsers}
            onChange={(e) => setMaxUsers(e.target.value)}
            dir="ltr"
          />
        </label>
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={customDomainAllowed}
          onChange={(e) => setCustomDomainAllowed(e.target.checked)}
        />
        يسمح بربط نطاق مخصص
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        نشطة (تُعرض للعملاء الجدد)
      </label>

      <FormError message={error} />
      <Button type="submit" disabled={loading} className="w-fit">
        {loading ? 'جارٍ الحفظ...' : submitLabel}
      </Button>
    </form>
  );
}
