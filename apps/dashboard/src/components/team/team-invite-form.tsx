'use client';

import { useState, type FormEvent } from 'react';
import { inviteTeamMemberSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { Select } from '@/components/ui/select';
import { FormError } from '@/components/ui/form-error';
import { ROLE_LABELS } from '@/lib/auth/role-labels';
import { inviteTeamMember, type TeamMember } from '@/lib/api/team';

interface TeamInviteFormProps {
  accessToken: string;
  onInvited: (member: TeamMember) => void;
}

export function TeamInviteForm({ accessToken, onInvited }: TeamInviteFormProps) {
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState<'admin' | 'agent'>('agent');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const result = inviteTeamMemberSchema.safeParse({ full_name: fullName, phone, role });
    if (!result.success) {
      setError(result.error.issues[0]?.message ?? 'يرجى مراجعة البيانات');
      return;
    }

    setLoading(true);
    try {
      const { member } = await inviteTeamMember(accessToken, result.data);
      onInvited(member);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'تعذّرت دعوة العضو');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Input placeholder="الاسم الثلاثي" value={fullName} onChange={(e) => setFullName(e.target.value)} />
      <PhoneInput placeholder="5xxxxxxxx" value={phone} onChange={setPhone} />
      <Select value={role} onChange={(e) => setRole(e.target.value as 'admin' | 'agent')}>
        <option value="agent">{ROLE_LABELS.agent}</option>
        <option value="admin">{ROLE_LABELS.admin}</option>
      </Select>
      <FormError message={error} />
      <Button type="submit" disabled={loading}>
        {loading ? 'جارٍ الإرسال...' : 'إرسال الدعوة'}
      </Button>
    </form>
  );
}
