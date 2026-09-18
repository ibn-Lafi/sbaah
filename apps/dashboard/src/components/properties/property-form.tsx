'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
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
  type UserRole,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { SearchableSelect } from '@/components/ui/searchable-select';
import { Textarea } from '@/components/ui/textarea';
import { FormError } from '@/components/ui/form-error';
import { LocationPicker, type LocationPickerValue } from '@/components/ui/location-picker';
import { createDistrict, listCities, listDistricts } from '@/lib/api/reference-data';
import { listBuildings, listProjects } from '@/lib/api/hierarchy';
import { getListingTypeLabels, getPropertyTypeLabels } from '@/lib/property/labels';
import type { PropertyWithMedia } from '@/lib/api/properties';
import { listTeam, type TeamMember } from '@/lib/api/team';
import { useLocale } from '@/lib/i18n/locale-context';
import { FormWizard, WizardActions } from '@/components/forms/form-wizard';

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
  location: LocationPickerValue | null;
  project_id: string;
  building_id: string;
  agent_id: string;
  status: string;
  availability: string;
  land_area: string;
  built_area: string;
  street_width: string;
  property_age: string;
  floor_number: string;
  floors_count: string;
  parking_count: string;
  elevators_count: string;
  reference_number: string;
  advertisement_license_number: string;
  advertisement_license_expires_at: string;
  advertiser_name: string;
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
  location: null,
  project_id: '',
  building_id: '',
  agent_id: '',
  status: 'draft',
  availability: 'available',
  land_area: '', built_area: '', street_width: '', property_age: '', floor_number: '', floors_count: '', parking_count: '', elevators_count: '', reference_number: '', advertisement_license_number: '', advertisement_license_expires_at: '', advertiser_name: '',
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
    location: property.lat !== null && property.lng !== null ? { lat: property.lat, lng: property.lng } : null,
    project_id: property.project_id ?? '',
    building_id: property.building_id ?? '',
    agent_id: property.agent_id ?? '',
    status: property.status,
    availability: property.availability,
    land_area: String(property.land_area ?? ''),
    built_area: String(property.built_area ?? ''),
    street_width: String(property.street_width ?? ''),
    property_age: String(property.property_age ?? ''),
    floor_number: String(property.floor_number ?? ''),
    floors_count: String(property.floors_count ?? ''),
    parking_count: String(property.parking_count ?? ''),
    elevators_count: String(property.elevators_count ?? ''),
    reference_number: property.reference_number ?? '',
    advertisement_license_number: property.advertisement_license_number ?? '',
    advertisement_license_expires_at: property.advertisement_license_expires_at
      ? property.advertisement_license_expires_at.slice(0, 16)
      : '',
    advertiser_name: property.advertiser_name ?? '',
  };
}

interface PropertyFormProps {
  mode: 'create' | 'edit';
  initialValues?: PropertyWithMedia;
  accessToken: string;
  /** GET /v1/team is Owner/Admin-only — an Agent viewing/editing their own assigned property never sees or fetches the assignment field. */
  role: UserRole;
  onSubmit: (input: PropertyInput | PropertyUpdateInput) => Promise<void>;
  submitLabel: string;
}

/** Shared by the "+ إضافة عقار" create modal and /properties/[id] — the only difference is whether status/availability show and what onSubmit does with the payload. */
export function PropertyForm({
  mode,
  initialValues,
  accessToken,
  role,
  onSubmit,
  submitLabel,
}: PropertyFormProps) {
  const { locale, pages } = useLocale();
  const t = pages.properties;
  const propertyTypeLabels = getPropertyTypeLabels(locale);
  const listingTypeLabels = getListingTypeLabels(locale);
  const [form, setForm] = useState<FormState>(
    initialValues ? toFormState(initialValues) : EMPTY_STATE,
  );
  const [cities, setCities] = useState<City[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [buildings, setBuildings] = useState<Building[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(0);
  const steps = locale === 'ar' ? ['المعلومات الأساسية', 'الموقع والربط', 'المواصفات', 'الترخيص والحالة', 'المراجعة'] : ['Basic Information', 'Location & Linking', 'Specifications', 'Licensing & Status', 'Review'];
  const canAssignAgent = role !== 'agent';

  useEffect(() => {
    void listCities().then(setCities);
    void listProjects(accessToken).then((result) => setProjects(result.projects));
    void listBuildings(accessToken).then((result) => setBuildings(result.buildings));
    if (canAssignAgent) {
      void listTeam(accessToken).then((result) => setTeam(result.members));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      lat: form.location?.lat ?? null,
      lng: form.location?.lng ?? null,
      project_id: form.project_id || null,
      building_id: form.building_id || null,
      land_area: form.land_area ? Number(form.land_area) : null, built_area: form.built_area ? Number(form.built_area) : null, street_width: form.street_width ? Number(form.street_width) : null, property_age: form.property_age ? Number(form.property_age) : null, floor_number: form.floor_number ? Number(form.floor_number) : null, floors_count: form.floors_count ? Number(form.floors_count) : null, parking_count: form.parking_count ? Number(form.parking_count) : null, elevators_count: form.elevators_count ? Number(form.elevators_count) : null, reference_number: form.reference_number || null, advertisement_license_number: form.advertisement_license_number || null, advertisement_license_expires_at: form.advertisement_license_expires_at ? new Date(form.advertisement_license_expires_at).toISOString() : null, advertiser_name: form.advertiser_name || null,
      ...(canAssignAgent ? { agent_id: form.agent_id || null } : {}),
      ...(mode === 'edit' ? { status: form.status, availability: form.availability } : {}),
    };

    const schema = mode === 'create' ? propertyInputSchema : propertyUpdateSchema;
    const result = schema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.form.validationError);
      return;
    }

    setLoading(true);
    try {
      await onSubmit(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.form.saveError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <FormWizard steps={steps} current={step} onStepChange={setStep} />

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Input placeholder={t.form.fields.titleAr} value={form.title_ar} onChange={(e) => set('title_ar', e.target.value)} />
            <Input placeholder={t.form.fields.titleEn} value={form.title_en} onChange={(e) => set('title_en', e.target.value)} />
          </div>
          <Textarea placeholder={t.form.fields.descriptionAr} value={form.description_ar} onChange={(e) => set('description_ar', e.target.value)} />
          <Textarea placeholder={t.form.fields.descriptionEn} value={form.description_en} onChange={(e) => set('description_en', e.target.value)} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select value={form.property_type} onChange={(e) => set('property_type', e.target.value)}>{PROPERTY_TYPES.map((type) => <option key={type} value={type}>{propertyTypeLabels[type]}</option>)}</Select>
            <Select value={form.listing_type} onChange={(e) => set('listing_type', e.target.value)}>{LISTING_TYPES.map((type) => <option key={type} value={type}>{listingTypeLabels[type]}</option>)}</Select>
            <Input type="number" min="0" placeholder={t.form.fields.price} value={form.price} onChange={(e) => set('price', e.target.value)} />
            <Input type="number" min="0" placeholder={t.form.fields.area} value={form.area_sqm} onChange={(e) => set('area_sqm', e.target.value)} />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <SearchableSelect options={cities.map((city) => ({ value: city.id, label: city.name_ar }))} value={form.city_id} onChange={(value) => set('city_id', value)} placeholder={t.form.fields.citySelect} />
            <SearchableSelect options={districts.map((district) => ({ value: district.id, label: district.name_ar }))} value={form.district_id} onChange={(value) => set('district_id', value)} placeholder={t.form.fields.districtSelect} disabled={!form.city_id} clearable onCreate={async (name) => { const district = await createDistrict(accessToken, { city_id: form.city_id, name_ar: name }); setDistricts((prev) => [...prev, district]); return { value: district.id, label: district.name_ar }; }} />
          </div>
          <LocationPicker value={form.location} onChange={(location) => set('location', location)} focusPoint={mapFocusPoint} />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Select value={form.project_id} onChange={(e) => set('project_id', e.target.value)}><option value="">{t.form.fields.noProject}</option>{projects.map((project) => <option key={project.id} value={project.id}>{project.name_ar}</option>)}</Select>
            <Select value={form.building_id} onChange={(e) => set('building_id', e.target.value)}><option value="">{t.form.fields.noBuilding}</option>{buildings.map((building) => <option key={building.id} value={building.id}>{building.name_ar}</option>)}</Select>
          </div>
          {canAssignAgent && <Select value={form.agent_id} onChange={(e) => set('agent_id', e.target.value)}><option value="">{t.form.fields.noAgent}</option>{team.map((member) => <option key={member.id} value={member.id}>{member.full_name}</option>)}</Select>}
        </div>
      )}

      {step === 2 && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <Input type="number" min="0" placeholder={t.form.fields.bedrooms} value={form.bedrooms} onChange={(e) => set('bedrooms', e.target.value)} />
          <Input type="number" min="0" placeholder={t.form.fields.bathrooms} value={form.bathrooms} onChange={(e) => set('bathrooms', e.target.value)} />
          {([['land_area','مساحة الأرض'],['built_area','المساحة المبنية'],['street_width','عرض الشارع'],['property_age','عمر العقار'],['floor_number','رقم الدور'],['floors_count','عدد الأدوار'],['parking_count','مواقف السيارات'],['elevators_count','المصاعد']] as const).map(([key,label]) => <Input key={key} type="number" min="0" placeholder={label} value={form[key]} onChange={(e) => set(key, e.target.value)} />)}
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-5">
          <div className="flex flex-col gap-3">
            <h3 className="text-sm font-semibold text-text-primary">{locale === 'ar' ? 'بيانات الإعلان والترخيص' : 'Advertisement & Licensing'}</h3>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input placeholder={locale === 'ar' ? 'الرقم المرجعي' : 'Reference number'} value={form.reference_number} onChange={(e) => set('reference_number', e.target.value)} />
              <Input placeholder={locale === 'ar' ? 'رقم ترخيص الإعلان' : 'Advertisement license number'} value={form.advertisement_license_number} onChange={(e) => set('advertisement_license_number', e.target.value)} />
              <div className="flex flex-col gap-1">
                <label className="text-xs text-text-secondary">{locale === 'ar' ? 'تاريخ انتهاء ترخيص الإعلان' : 'Advertisement license expiry'}</label>
                <Input type="datetime-local" value={form.advertisement_license_expires_at} onChange={(e) => set('advertisement_license_expires_at', e.target.value)} />
              </div>
              <Input placeholder={locale === 'ar' ? 'اسم المعلن' : 'Advertiser name'} value={form.advertiser_name} onChange={(e) => set('advertiser_name', e.target.value)} />
            </div>
          </div>
          {mode === 'edit' && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-text-primary">{locale === 'ar' ? 'حالة العقار' : 'Property Status'}</h3>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Select value={form.status} onChange={(e) => set('status', e.target.value)}>{PROPERTY_STATUSES.map((status) => <option key={status} value={status}>{t.statusLabels[status]}</option>)}</Select>
                <Select value={form.availability} onChange={(e) => set('availability', e.target.value)}>{PROPERTY_AVAILABILITY.map((availability) => <option key={availability} value={availability}>{t.availabilityLabels[availability]}</option>)}</Select>
              </div>
            </div>
          )}
        </div>
      )}

      {step === 4 && (
        <div className="rounded-xl border border-border-default p-5">
          <h3 className="mb-4 font-semibold">مراجعة بيانات العقار</h3>
          <dl className="grid gap-4 text-sm sm:grid-cols-2 lg:grid-cols-3">
            <div><dt className="text-text-secondary">العقار</dt><dd className="mt-1 font-medium">{form.title_ar || '—'}</dd></div>
            <div><dt className="text-text-secondary">النوع</dt><dd className="mt-1 font-medium">{propertyTypeLabels[form.property_type as keyof typeof propertyTypeLabels] || form.property_type}</dd></div>
            <div><dt className="text-text-secondary">السعر</dt><dd className="mt-1 font-medium">{form.price || '—'}</dd></div>
            <div><dt className="text-text-secondary">المساحة</dt><dd className="mt-1 font-medium">{form.area_sqm ? `${form.area_sqm} م²` : '—'}</dd></div>
            <div><dt className="text-text-secondary">المدينة</dt><dd className="mt-1 font-medium">{cities.find((x) => x.id === form.city_id)?.name_ar || '—'}</dd></div>
            <div><dt className="text-text-secondary">الحي</dt><dd className="mt-1 font-medium">{districts.find((x) => x.id === form.district_id)?.name_ar || '—'}</dd></div>
            <div><dt className="text-text-secondary">المشروع</dt><dd className="mt-1 font-medium">{projects.find((x) => x.id === form.project_id)?.name_ar || 'بدون مشروع'}</dd></div>
            <div><dt className="text-text-secondary">العمارة</dt><dd className="mt-1 font-medium">{buildings.find((x) => x.id === form.building_id)?.name_ar || 'بدون عمارة'}</dd></div>
            <div><dt className="text-text-secondary">ترخيص الإعلان</dt><dd className="mt-1 font-medium">{form.advertisement_license_number || 'غير مضاف'}</dd></div>
          </dl>
        </div>
      )}

      <FormError message={error} />
      <WizardActions step={step} total={steps.length} loading={loading} submitLabel={submitLabel} onBack={() => setStep((s) => Math.max(0, s - 1))} onNext={() => setStep((s) => Math.min(steps.length - 1, s + 1))} />
    </form>
  );
}
