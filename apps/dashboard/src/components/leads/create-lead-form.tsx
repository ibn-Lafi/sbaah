'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { manualLeadInputSchema, type Asset, type Lead } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { createLead } from '@/lib/api/leads';
import { listAssets } from '@/lib/api/real-estate';
import { listTeam, type TeamMember } from '@/lib/api/team';
import { ApiRequestError } from '@/lib/api/client';
import { useLocale } from '@/lib/i18n/locale-context';

interface CreateLeadFormProps {
  accessToken: string;
  onCreated: (lead: Lead) => void;
}

/** RLS (leads_owner_admin_manage) has no insert policy for Agent — matches POST /v1/leads' explicit 403 for that role. Same reasoning is why the agent-assignment select below fetches GET /v1/team unconditionally: only Owner/Admin ever render this form. */
export function CreateLeadForm({ accessToken, onCreated }: CreateLeadFormProps) {
  const { pages } = useLocale();
  const t = pages.leads;
  const [assets, setAssets] = useState<Asset[]>([]);
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [assetId, setAssetId] = useState('');
  const [assignedAgentId, setAssignedAgentId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void listAssets(accessToken).then((result) => setAssets(result.assets));
    void listTeam(accessToken).then((result) => setTeam(result.members));
  }, [accessToken]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const candidate = {
      full_name: fullName,
      phone,
      email: email || null,
      asset_id: assetId || null,
      listing_id: null,
      assigned_agent_id: assignedAgentId || null,
    };

    const result = manualLeadInputSchema.safeParse(candidate);
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? t.createForm.validationError);
      return;
    }

    setLoading(true);
    try {
      const { lead } = await createLead(accessToken, result.data);
      onCreated(lead);
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.createForm.createError);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input placeholder={t.createForm.namePlaceholder} value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <PhoneInput placeholder={t.createForm.phonePlaceholder} value={phone} onChange={setPhone} />
        <Input
          type="email"
          placeholder={t.createForm.emailPlaceholder}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          dir="ltr"
        />
      </div>
      <Select value={assetId} onChange={(e) => setAssetId(e.target.value)}>
        <option value="">{t.createForm.noPropertySelected}</option>
        {assets.map((asset) => (
          <option key={asset.id} value={asset.id}>
            {asset.name_ar}
          </option>
        ))}
      </Select>
      <Select value={assignedAgentId} onChange={(e) => setAssignedAgentId(e.target.value)}>
        <option value="">{t.createForm.noAgentSelected}</option>
        {team.map((member) => (
          <option key={member.id} value={member.id}>
            {member.full_name}
          </option>
        ))}
      </Select>

      <FormError message={error} />
      <Button type="submit" disabled={loading}>
        {loading ? t.createForm.submitting : t.createForm.submit}
      </Button>
    </form>
  );
}
