'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { FormError } from '@/components/ui/form-error';
import { LocationPicker, type LocationPickerValue } from '@/components/ui/location-picker';
import { createDistrict, listCities, listDistricts } from '@/lib/api/reference-data';
import { PROPERTY_STATUS_LABELS } from '@/lib/property/labels';

type FormState = {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  city_id: string;
  district_id: string;
  location: LocationPickerValue | null;
  status: string;
};

const EMPTY_STATE: FormState = {
  name_ar: '',
  name_en: '',
  description_ar: '',
  description_en: '',
  city_id: '',
  district_id: '',
  location: null,
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
    location: project.lat !== null && project.lng !== null ? { lat: project.lat, lng: project.lng } : null,
    status: project.status,
  };
}

interface ProjectFormProps {
  mode: 'create' | 'edit';
  initialValues?: Project;
  accessToken: string;
  onSubmit: (input: ProjectInput | ProjectUpdateInput) => Promise<void>;
  submitLabel: string;
}

export function ProjectForm({ mode, initialValues, accessToken, onSubmit, submitLabel }: ProjectFormProps) {
  const [form, setForm] = useState<FormState>(
    initialValues ? toFormState(initialValues) : EMPTY_STATE,
  );
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

  const mapFocusPoint = useMemo<LocationPickerValue | null>(() => {
    const district = districts.find((d) => d.id === form.district_id);
    if (district?.lat != null && district?.lng != null) return { lat: district.lat, lng: district.lng };
    const city = cities.find((c) => c.id === form.city_id);
    if (city?.lat != null && city?.lng != null) return { lat: city.lat, lng: city.lng };
    return null;
  }, [form.city_id, form.district_id, cities, districts]);

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
      lat: form.location?.lat ?? null,
      lng: form.location?.lng ?? null,
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
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          placeholder="اسم المشروع (عربي)"
          value={form.name_ar}
          onChange={(e) => set('name_ar', e.target.value)}
        />
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <SearchableSelect
          options={cities.map((city) => ({ value: city.id, label: city.name_ar }))}
          value={form.city_id}
          onChange={(value) => set('city_id', value)}
          placeholder="اختر المدينة"
        />
        <SearchableSelect
          options={districts.map((district) => ({ value: district.id, label: district.name_ar }))}
          value={form.district_id}
          onChange={(value) => set('district_id', value)}
          placeholder="الحي (اختياري)"
          disabled={!form.city_id}
          clearable
          onCreate={async (name) => {
            const district = await createDistrict(accessToken, {
              city_id: form.city_id,
              name_ar: name,
              lat: form.location?.lat ?? null,
              lng: form.location?.lng ?? null,
            });
            setDistricts((prev) => [...prev, district]);
            return { value: district.id, label: district.name_ar };
          }}
        />
      </div>

      <LocationPicker
        value={form.location}
        onChange={(location) => set('location', location)}
        focusPoint={mapFocusPoint}
      />

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
