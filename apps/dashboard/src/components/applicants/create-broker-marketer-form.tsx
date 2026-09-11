'use client';

import { useEffect, useState, type FormEvent } from 'react';
import {
  manualBrokerMarketerApplicationInputSchema,
  type BrokerMarketerApplicantType,
  type City,
  type Property,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { createBrokerMarketerApplication, type BrokerMarketerApplicationWithRelations } from '@/lib/api/broker-applications';
import { listCities } from '@/lib/api/reference-data';
import { listProperties } from '@/lib/api/properties';
import { ApiRequestError } from '@/lib/api/client';

interface CreateBrokerMarketerFormProps {
  accessToken: string;
  onCreated: (application: BrokerMarketerApplicationWithRelations) => void;
}

/** مطابق لبنية CreateLeadForm — طلب وسيط/مسوّق يدوي (بدلًا من النموذج العام بالموقع)، POST /v1/broker-applications (migration 0033). */
export function CreateBrokerMarketerForm({ accessToken, onCreated }: CreateBrokerMarketerFormProps) {
  const [cities, setCities] = useState<City[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [fullName, setFullName] = useState('');
  const [cityId, setCityId] = useState('');
  const [falLicenseNumber, setFalLicenseNumber] = useState('');
  const [applicantType, setApplicantType] = useState<BrokerMarketerApplicantType>('broker');
  const [propertyId, setPropertyId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listCities().then(setCities);
    void listProperties(accessToken).then((result) => setProperties(result.properties));
  }, [accessToken]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const candidate = {
      full_name: fullName,
      city_id: cityId,
      fal_license_number: falLicenseNumber,
      applicant_type: applicantType,
      property_id: propertyId || null,
    };

    const result = manualBrokerMarketerApplicationInputSchema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'يرجى مراجعة البيانات المدخلة');
      return;
    }

    setLoading(true);
    try {
      const { application } = await createBrokerMarketerApplication(accessToken, result.data);
      onCreated(application);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إضافة الطلب');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input placeholder="الاسم الكامل" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <div className="grid grid-cols-2 gap-4">
        <Select value={cityId} onChange={(e) => setCityId(e.target.value)}>
          <option value="">اختر المدينة</option>
          {cities.map((city) => (
            <option key={city.id} value={city.id}>
              {city.name_ar}
            </option>
          ))}
        </Select>
        <Input
          placeholder="رقم رخصة فال"
          value={falLicenseNumber}
          onChange={(e) => setFalLicenseNumber(e.target.value)}
          dir="ltr"
        />
      </div>
      <Select value={applicantType} onChange={(e) => setApplicantType(e.target.value as BrokerMarketerApplicantType)}>
        <option value="broker">وسيط</option>
        <option value="marketer">مسوّق</option>
      </Select>
      <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
        <option value="">بلا عقار محدد (اختياري)</option>
        {properties.map((property) => (
          <option key={property.id} value={property.id}>
            {property.title_ar}
          </option>
        ))}
      </Select>

      <FormError message={error} />
      <Button type="submit" disabled={loading}>
        {loading ? 'جارٍ الإضافة...' : 'إضافة الطلب'}
      </Button>
    </form>
  );
}
