'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  projectInputSchema,
  projectUpdateSchema,
  PROPERTY_STATUSES,
  type City,
  type District,
  type Project,
  type ProjectInput,
  type ProjectUpdateInput,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormError } from '@/components/ui/form-error';
import { listCities, listDistricts } from '@/lib/api/reference-data';
import { PROPERTY_STATUS_LABELS } from '@/lib/property/labels';

type FormState = {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  city_id: string;
  district_id: string;
  status: string;
};

const EMPTY_STATE: FormState = {
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  city_id: '',
  district_id: '',
  status: 'draft',
};

function toFormState(project: Project): FormState {
  return {
    name_ar: project.name_ar,
    name_en: project.name_en ?? '',
    description_ar: project.description_ar ?? '',
    description_en: project.description_en ?? '',
    city_id: project.city_id,
    district_id: project.district_id ?? '',
    status: project.status,
  };
}

interface ProjectFormProps {
  mode: 'create' | 'edit';
  initialValues?: Project;
  onSubmit: (input: ProjectInput | ProjectUpdateInput) => Promise<void>;
  submitLabel: string;
}

export function ProjectForm({ mode, initialValues, onSubmit, submitLabel }: ProjectFormProps) {
  const [form, setForm] = useState<FormState>(initialValues ? toFormState(initialValues) : EMPTY_STATE);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listCities().then(setCities);
  }, []);

  useEffect(() => {
    if (!form.city_id) {
      setDistricts([]);
      return;
    }
    void listDistricts(form.city_id).then(setDistricts);
  }, [form.city_id]);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const candidate = {
      name_ar: form.name_ar,
      name_en: form.name_en || null,
      description_ar: form.description_ar || null,
      description_en: form.description_en || null,
      city_id: form.city_id,
      district_id: form.district_id || null,
      ...(mode === 'edit' ? { status: form.status } : {}),
    };

    const schema = mode === 'create' ? projectInputSchema : projectUpdateSchema;
    const result = schema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'يرجى مراجعة بيانات المشروع');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر حفظ المشروع');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="اسم المشروع (عربي)" value={form.name_ar} onChange={(e) => set('name_ar', e.target.value)} />
        <Input
          placeholder="اسم المشروع (إنجليزي، اختياري)"
          value={form.name_en}
          onChange={(e) => set('name_en', e.target.value)}
        />
      </div>

      <Textarea
        placeholder="وصف المشروع (عربي، اختياري)"
        value={form.description_ar}
        onChange={(e) => set('description_ar', e.target.value)}
      />
      <Textarea
        placeholder="وصف المشروع (إنجليزي، اختياري)"
        value={form.description_en}
        onChange={(e) => set('description_en', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select value={form.city_id} onChange={(e) => set('city_id', e.target.value)}>
          <option value="">اختر المدينة</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name_ar}
            </option>
          ))}
        </Select>
        <Select value={form.district_id} onChange={(e) => set('district_id', e.target.value)} disabled={!form.city_id}>
          <option value="">الحي (اختياري)</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name_ar}
            </option>
          ))}
        </Select>
      </div>

      {mode === 'edit' && (
        <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
          {PROPERTY_STATUSES.map((status) => (
            <option key={status} value={status}>
              {PROPERTY_STATUS_LABELS[status]}
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
