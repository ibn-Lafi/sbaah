'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  rentalInputSchema,
  rentalUpdateSchema,
  RENTAL_STATUSES,
  type Property,
  type Rental,
  type RentalInput,
  type RentalUpdateInput,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormError } from '@/components/ui/form-error';
import { listProperties } from '@/lib/api/properties';
import { LISTING_TYPE_LABELS } from '@/lib/property/labels';
import { RENTAL_STATUS_LABELS } from '@/lib/rental/labels';

type FormState = {
  property_id: string;
  tenant_name: string;
  tenant_phone: string;
  rent_amount: string;
  contract_start_date: string;
  contract_end_date: string;
  notes: string;
  status: string;
};

const EMPTY_STATE: FormState = {
  property_id: '',
  tenant_name: '',
  tenant_phone: '',
  rent_amount: '',
  contract_start_date: '',
  contract_end_date: '',
  notes: '',
  status: 'active',
};

function toFormState(rental: Rental): FormState {
  return {
    property_id: rental.property_id,
    tenant_name: rental.tenant_name,
    tenant_phone: rental.tenant_phone,
    rent_amount: String(rental.rent_amount),
    contract_start_date: rental.contract_start_date,
    contract_end_date: rental.contract_end_date,
    notes: rental.notes ?? '',
    status: rental.status,
  };
}

interface RentalFormProps {
  mode: 'create' | 'edit';
  initialValues?: Rental;
  accessToken: string;
  /** Preselects the property when arriving from that property's own page. */
  defaultPropertyId?: string;
  onSubmit: (input: RentalInput | RentalUpdateInput) => Promise<void>;
  submitLabel: string;
}

export function RentalForm({ mode, initialValues, accessToken, defaultPropertyId, onSubmit, submitLabel }: RentalFormProps) {
  const [form, setForm] = useState<FormState>(
    initialValues ? toFormState(initialValues) : { ...EMPTY_STATE, property_id: defaultPropertyId ?? '' },
  );
  const [properties, setProperties] = useState<Property[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listProperties(accessToken).then((result) => setProperties(result.properties));
  }, [accessToken]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const candidate =
      mode === 'create'
        ? {
            property_id: form.property_id,
            tenant_name: form.tenant_name,
            tenant_phone: form.tenant_phone,
            rent_amount: Number(form.rent_amount),
            contract_start_date: form.contract_start_date,
            contract_end_date: form.contract_end_date,
            notes: form.notes || null,
          }
        : {
            tenant_name: form.tenant_name,
            tenant_phone: form.tenant_phone,
            rent_amount: Number(form.rent_amount),
            contract_start_date: form.contract_start_date,
            contract_end_date: form.contract_end_date,
            notes: form.notes || null,
            status: form.status,
          };

    const schema = mode === 'create' ? rentalInputSchema : rentalUpdateSchema;
    const result = schema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'يرجى مراجعة بيانات الإيجار');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر حفظ الإيجار');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {mode === 'create' && (
        <Select value={form.property_id} onChange={(e) => set('property_id', e.target.value)}>
          <option value="">اختر العقار</option>
          {properties.map((property) => (
            <option key={property.id} value={property.id}>
              {property.title_ar} · {LISTING_TYPE_LABELS[property.listing_type]}
            </option>
          ))}
        </Select>
      )}

      <div className="grid grid-cols-2 gap-4">
        <Input
          placeholder="اسم المستأجر"
          value={form.tenant_name}
          onChange={(e) => set('tenant_name', e.target.value)}
        />
        <Input
          type="tel"
          placeholder="+966501234567"
          value={form.tenant_phone}
          onChange={(e) => set('tenant_phone', e.target.value)}
          dir="ltr"
        />
      </div>

      <Input
        type="number"
        placeholder="مبلغ الإيجار (ريال)"
        value={form.rent_amount}
        onChange={(e) => set('rent_amount', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-secondary">بداية العقد</label>
          <Input
            type="date"
            value={form.contract_start_date}
            onChange={(e) => set('contract_start_date', e.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs text-text-secondary">نهاية العقد</label>
          <Input type="date" value={form.contract_end_date} onChange={(e) => set('contract_end_date', e.target.value)} />
        </div>
      </div>

      <Textarea placeholder="ملاحظات (اختياري)" value={form.notes} onChange={(e) => set('notes', e.target.value)} />

      {mode === 'edit' && (
        <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
          {RENTAL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {RENTAL_STATUS_LABELS[status]}
            </option>
          ))}
        </Select>
      )}

      <FormError message={error} />
      <Button type="submit" disabled={loading}>
        {loading ? 'جارٍ الحفظ...' : submitLabel}
      </Button>
    </form>
  );
}
