'use client';

import { useState, type FormEvent } from 'react';
import { inviteTeamMemberSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { useLocale } from '@/lib/i18n/locale-context';
import { inviteTeamMember, type TeamMember } from '@/lib/api/team';

interface TeamInviteFormProps {
  accessToken: string;
  onInvited: (member: TeamMember) => void;
}

export function TeamInviteForm({ accessToken, onInvited }: TeamInviteFormProps) {
  const { t, pages } = useLocale();
  const inviteForm = pages.team.inviteForm;
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('agent');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const result = inviteTeamMemberSchema.safeParse({
      full_name: fullName,
      phone,
      role,
      email: email.trim() || undefined,
    });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? inviteForm.invalidData);
      return;
    }

    setLoading(true);
    try {
      const { member } = await inviteTeamMember(accessToken, result.data);
      onInvited(member);
    } catch (err) {
      setError(err instanceof Error ? err.message : inviteForm.inviteFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input
        placeholder={inviteForm.fullNamePlaceholder}
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
      />
      <PhoneInput placeholder={inviteForm.phonePlaceholder} value={phone} onChange={setPhone} />
      <Input
        type="email"
        placeholder={inviteForm.emailPlaceholder}
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        dir="ltr"
      />
      <Select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'agent')}>
        <option value="agent">{t.roleLabels.agent}</option>
        <option value="admin">{t.roleLabels.admin}</option>
      </Select>
      <FormError message={error} />
      <Button type="submit" disabled={loading}>
        {loading ? inviteForm.sending : inviteForm.submitLabel}
      </Button>
    </form>
  );
}
