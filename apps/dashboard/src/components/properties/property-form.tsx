'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  propertyInputSchema,
  propertyUpdateSchema,
  LISTING_TYPES,
  PROPERTY_AVAILABILITY,
  PROPERTY_STATUSES,
  PROPERTY_TYPES,
  type Building,
  type City,
  type District,
  type Project,
  type PropertyInput,
  type PropertyUpdateInput,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FormError } from '@/components/ui/form-error';
import { listCities, listDistricts } from '@/lib/api/reference-data';
import { listBuildings, listProjects } from '@/lib/api/hierarchy';
import {
  LISTING_TYPE_LABELS,
  PROPERTY_AVAILABILITY_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
} from '@/lib/property/labels';
import type { PropertyWithMedia } from '@/lib/api/properties';

type FormState = {
  title_ar: string;
  title_en: string;
  description_ar: string;
  description_en: string;
  property_type: string;
  listing_type: string;
  price: string;
  area_sqm: string;
  bedrooms: string;
  bathrooms: string;
  city_id: string;
  district_id: string;
  project_id: string;
  building_id: string;
  status: string;
  availability: string;
};

const EMPTY_STATE: FormState = {
  title_ar: '',
  title_en: '',
  description_ar: '',
  description_en: '',
  property_type: 'apartment',
  listing_type: 'sale',
  price: '',
  area_sqm: '',
  bedrooms: '',
  bathrooms: '',
  city_id: '',
  district_id: '',
  project_id: '',
  building_id: '',
  status: 'draft',
  availability: 'available',
};

function toFormState(property: PropertyWithMedia): FormState {
  return {
    title_ar: property.title_ar,
    title_en: property.title_en ?? '',
    description_ar: property.description_ar,
    description_en: property.description_en ?? '',
    property_type: property.property_type,
    listing_type: property.listing_type,
    price: String(property.price),
    area_sqm: String(property.area_sqm),
    bedrooms: property.bedrooms === null ? '' : String(property.bedrooms),
    bathrooms: property.bathrooms === null ? '' : String(property.bathrooms),
    city_id: property.city_id,
    district_id: property.district_id ?? '',
    project_id: property.project_id ?? '',
    building_id: property.building_id ?? '',
    status: property.status,
    availability: property.availability,
  };
}

interface PropertyFormProps {
  mode: 'create' | 'edit';
  initialValues?: PropertyWithMedia;
  accessToken: string;
  onSubmit: (input: PropertyInput | PropertyUpdateInput) => Promise<void>;
  submitLabel: string;
}

/** Shared by /properties/new and /properties/[id] — the only difference is whether status/availability show and what onSubmit does with the payload. */
export function PropertyForm({ mode, initialValues, accessToken, onSubmit, submitLabel }: PropertyFormProps) {
  const [form, setForm] = useState<FormState>(initialValues ? toFormState(initialValues) : EMPTY_STATE);
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listCities().then(setCities);
    void listProjects(accessToken).then((result) => setProjects(result.projects));
    void listBuildings(accessToken).then((result) => setBuildings(result.buildings));
  }, [accessToken]);

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
      title_ar: form.title_ar,
      title_en: form.title_en || null,
      description_ar: form.description_ar,
      description_en: form.description_en || null,
      property_type: form.property_type,
      listing_type: form.listing_type,
      price: Number(form.price),
      area_sqm: Number(form.area_sqm),
      bedrooms: form.bedrooms === '' ? null : Number(form.bedrooms),
      bathrooms: form.bathrooms === '' ? null : Number(form.bathrooms),
      city_id: form.city_id,
      district_id: form.district_id || null,
      project_id: form.project_id || null,
      building_id: form.building_id || null,
      ...(mode === 'edit' ? { status: form.status, availability: form.availability } : {}),
    };

    const schema = mode === 'create' ? propertyInputSchema : propertyUpdateSchema;
    const result = schema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'يرجى مراجعة بيانات العقار');
      return;
    }

    setLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّر حفظ العقار');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input placeholder="عنوان العقار (عربي)" value={form.title_ar} onChange={(e) => set('title_ar', e.target.value)} />
        <Input
          placeholder="عنوان العقار (إنجليزي، اختياري)"
          value={form.title_en}
          onChange={(e) => set('title_en', e.target.value)}
        />
      </div>

      <Textarea
        placeholder="وصف العقار (عربي)"
        value={form.description_ar}
        onChange={(e) => set('description_ar', e.target.value)}
      />
      <Textarea
        placeholder="وصف العقار (إنجليزي، اختياري)"
        value={form.description_en}
        onChange={(e) => set('description_en', e.target.value)}
      />

      <div className="grid grid-cols-2 gap-4">
        <Select value={form.property_type} onChange={(e) => set('property_type', e.target.value)}>
          {PROPERTY_TYPES.map((type) => (
            <option key={type} value={type}>
              {PROPERTY_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
        <Select value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)}>
          {LISTING_TYPES.map((type) => (
            <option key={type} value={type}>
              {LISTING_TYPE_LABELS[type]}
            </option>
          ))}
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          placeholder="السعر (ريال)"
          value={form.price}
          onChange={(e) => set('price', e.target.value)}
        />
        <Input
          type="number"
          placeholder="المساحة (م²)"
          value={form.area_sqm}
          onChange={(e) => set('area_sqm', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input
          type="number"
          placeholder="عدد الغرف (اختياري)"
          value={form.bedrooms}
          onChange={(e) => set('bedrooms', e.target.value)}
        />
        <Input
          type="number"
          placeholder="عدد دورات المياه (اختياري)"
          value={form.bathrooms}
          onChange={(e) => set('bathrooms', e.target.value)}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Select value={form.city_id} onChange={(e) => set('city_id', e.target.value)}>
          <option value="">اختر المدينة</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name_ar}
            </option>
          ))}
        </Select>
        <Select
          value={form.district_id}
          onChange={(e) => set('district_id', e.target.value)}
          disabled={!form.city_id}
        >
          <option value="">الحي (اختياري)</option>
          {districts.map((district) => (
            <option key={district.id} value={district.id}>
              {district.name_ar}
            </option>
          ))}
        </Select>
      </div>

      {/* PRODUCT_SPEC.md section 4.1 — optional hierarchy grouping; both independent nullable FKs (a unit can belong to a building without a project, or vice versa). */}
      <div className="grid grid-cols-2 gap-4">
        <Select value={form.project_id} onChange={(e) => set('project_id', e.target.value)}>
          <option value="">بلا مشروع (اختياري)</option>
          {projects.map((project) => (
            <option key={project.id} value={project.id}>
              {project.name_ar}
            </option>
          ))}
        </Select>
        <Select value={form.building_id} onChange={(e) => set('building_id', e.target.value)}>
          <option value="">بلا عمارة (اختياري)</option>
          {buildings.map((building) => (
            <option key={building.id} value={building.id}>
              {building.name_ar}
            </option>
          ))}
        </Select>
      </div>

      {mode === 'edit' && (
        <div className="grid grid-cols-2 gap-4">
          <Select value={form.status} onChange={(e) => set('status', e.target.value)}>
            {PROPERTY_STATUSES.map((status) => (
              <option key={status} value={status}>
                {PROPERTY_STATUS_LABELS[status]}
              </option>
            ))}
          </Select>
          <Select value={form.availability} onChange={(e) => set('availability', e.target.value)}>
            {PROPERTY_AVAILABILITY.map((availability) => (
              <option key={availability} value={availability}>
                {PROPERTY_AVAILABILITY_LABELS[availability]}
              </option>
            ))}
          </Select>
        </div>
      )}

      <FormError message={error} />
      <Button type="submit" disabled={loading}>
        {loading ? 'جارٍ الحفظ...' : submitLabel}
      </Button>
    </form>
  );
}
