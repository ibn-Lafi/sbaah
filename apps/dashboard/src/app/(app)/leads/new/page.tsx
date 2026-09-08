'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { manualLeadInputSchema, type Property } from '@sbaah/shared';
import { AppShell } from '@/components/layout/app-shell';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { useCurrentUser } from '@/lib/auth/current-user-context';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { createLead } from '@/lib/api/leads';
import { listProperties } from '@/lib/api/properties';
import { listTeam, type TeamMember } from '@/lib/api/team';
import { ApiRequestError } from '@/lib/api/client';

/** RLS (leads_owner_admin_manage) has no insert policy for Agent — matches POST /v1/leads' explicit 403 for that role. Same reasoning is why the agent-assignment select below fetches GET /v1/team unconditionally: only Owner/Admin ever render this page. */
export default function NewLeadPage() {
  const router = useRouter();
  const { me, accessToken } = useCurrentUser();
  const [properties, setProperties] = useState<Property[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [propertyId, setPropertyId] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listProperties(accessToken).then((result) => setProperties(result.properties));
    void listTeam(accessToken).then((result) => setTeam(result.members));
  }, [accessToken]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const candidate = {
      full_name: fullName,
      phone,
      email: email || null,
      property_id: propertyId || null,
      assigned_agent_id: assignedAgentId || null,
    };

    const result = manualLeadInputSchema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'يرجى مراجعة بيانات العميل المحتمل');
      return;
    }

    setLoading(true);
    try {
      const { lead } = await createLead(accessToken, result.data);
      router.push(`/leads/${lead.id}`);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إضافة العميل المحتمل');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell
      title="إضافة عميل محتمل"
      orgName={me.tenant.name_ar}
      accountType={me.tenant.account_type}
      roleLabel={ROLE_LABELS[me.user.role]}
    >
      <Card className="max-w-[720px] p-8">
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Input placeholder="الاسم" value={fullName} onChange={(e) => setFullName(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <Input type="tel" placeholder="+966501234567" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            <Input
              type="email"
              placeholder="البريد الإلكتروني (اختياري)"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          </div>
          <Select value={propertyId} onChange={(e) => setPropertyId(e.target.value)}>
            <option value="">بلا عقار محدد (اختياري)</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.title_ar}
              </option>
            ))}
          </Select>
          <Select value={assignedAgentId} onChange={(e) => setAssignedAgentId(e.target.value)}>
            <option value="">بلا مسؤول (اختياري)</option>
            {team.map((member) => (
              <option key={member.id} value={member.id}>
                {member.full_name}
              </option>
            ))}
          </Select>

          <FormError message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'جارٍ الإضافة...' : 'إضافة العميل المحتمل'}
          </Button>
        </form>
      </Card>
    </AppShell>
  );
}
