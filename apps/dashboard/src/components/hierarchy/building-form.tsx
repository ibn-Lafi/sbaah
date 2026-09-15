'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import {
  buildingInputSchema,
  buildingUpdateSchema,
  type Building,
  type BuildingInput,
  type BuildingUpdateInput,
  type City,
  type District,
  type Project,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { FormError } from '@/components/ui/form-error';
import { LocationPicker, type LocationPickerValue } from '@/components/ui/location-picker';
import { createDistrict, listCities, listDistricts } from '@/lib/api/reference-data';
import { listProjects } from '@/lib/api/hierarchy';

type FormState = {
  project_id: string;
  name_ar: string;
  name_en: string;
  city_id: string;
  district_id: string;
  location: LocationPickerValue | null;
  floors_count: string;
};

const EMPTY_STATE: FormState = {
  project_id: '',
  name_ar: '',
  name_en: '',
  city_id: '',
  district_id: '',
  location: null,
  floors_count: '',
};

function toFormState(building: Building): FormState {
  return {
    project_id: building.project_id ?? '',
    name_ar: building.name_ar,
    name_en: building.name_en ?? '',
    city_id: building.city_id,
    district_id: building.district_id ?? '',
    location: building.lat !== null && building.lng !== null ? { lat: building.lat, lng: building.lng } : null,
    floors_count: building.floors_count === null ? '' : String(building.floors_count),
  };
}

interface BuildingFormProps {
  mode: 'create' | 'edit';
  initialValues?: Building;
  accessToken: string;
  /** Preselects and locks the project when arriving from a project's own page — still changeable, just defaulted. */
  defaultProjectId?: string;
  onSubmit: (input: BuildingInput | BuildingUpdateInput) => Promise<void>;
  submitLabel: string;
}

export function BuildingForm({
  mode,
  initialValues,
  accessToken,
  defaultProjectId,
  onSubmit,
  submitLabel,
}: BuildingFormProps) {
  const [form, setForm] = useState<FormState>(
    initialValues
      ? toFormState(initialValues)
      : { ...EMPTY_STATE, project_id: defaultProjectId ?? '' },
  );
  const [projects, setProjects] = useState<Project[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listProjects(accessToken).then((result) => setProjects(result.projects));
    void listCities().then(setCities);
  }, [accessToken]);

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
      project_id: form.project_id || null,
      name_ar: form.name_ar,
      name_en: form.name_en || null,
      city_id: form.city_id,
      district_id: form.district_id || null,
      lat: form.location?.lat ?? null,
      lng: form.location?.lng ?? null,
      floors_count: form.floors_count === '' ? null : Number(form.floors_count),
    };

    const schema = mode === 'create' ? buildingInputSchema : buildingUpdateSchema;
    const result = schema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'يرجى مراجعة بيانات العمارة');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر حفظ العمارة');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Select value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
        <option value="">بلا مشروع (عمارة مستقلة)</option>
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.name_ar}
          </option>
        ))}
      </Select>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          placeholder="اسم العمارة (عربي)"
          value={form.name_ar}
          onChange={(e) => set('name_ar', e.target.value)}
        />
        <Input
          placeholder="اسم العمارة (إنجليزي، اختياري)"
          value={form.name_en}
          onChange={(e) => set('name_en', e.target.value)}
        />
      </div>

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
            const district = await createDistrict(accessToken, { city_id: form.city_id, name_ar: name });
            setDistricts((prev) => [...prev, district]);
            return { value: district.id, label: district.name_ar };
          }}
        />
      </div>

      <Input
        type="number"
        placeholder="عدد الطوابق (اختياري)"
        value={form.floors_count}
        onChange={(e) => set('floors_count', e.target.value)}
      />

      <LocationPicker
        value={form.location}
        onChange={(location) => set('location', location)}
        focusPoint={mapFocusPoint}
      />

      <FormError message={error} />
      <Button type="submit" disabled={loading}>
        {loading ? 'جارٍ الحفظ...' : submitLabel}
      </Button>
    </form>
  );
}
