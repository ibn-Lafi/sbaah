'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { PasswordInput } from '@/components/ui/password-input';
import { FormError } from '@/components/ui/form-error';
import { changeTemporaryPassword } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { getAccessToken } from '@/lib/auth/session';

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    if (newPassword.length < 8) return setError('كلمة المرور الجديدة يجب أن تكون 8 خانات على الأقل');
    if (newPassword !== confirm) return setError('تأكيد كلمة المرور غير مطابق');
    if (newPassword === currentPassword) return setError('كلمة المرور الجديدة يجب أن تختلف عن كلمة المرور المؤقتة');
    setLoading(true);
    try {
      const token = await getAccessToken();
      if (!token) return window.location.replace('/login');
      await changeTemporaryPassword(token, currentPassword, newPassword);
      window.location.replace('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذر تغيير كلمة المرور. حاول مرة أخرى.');
    } finally {
      setLoading(false);
    }
  }

  return <div className="mx-auto w-full max-w-md">
    <h1 className="mb-2 text-2xl font-bold text-text-primary">تغيير كلمة المرور</h1>
    <p className="mb-6 text-sm text-text-secondary">لأمان حسابك، غيّر كلمة المرور المؤقتة قبل الدخول إلى لوحة التحكم.</p>
    <form onSubmit={submit} className="flex flex-col gap-4">
      <PasswordInput placeholder="كلمة المرور المؤقتة" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
      <PasswordInput placeholder="كلمة المرور الجديدة" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
      <PasswordInput placeholder="تأكيد كلمة المرور الجديدة" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
      <FormError message={error} />
      <Button type="submit" loading={loading}>{loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}</Button>
    </form>
  </div>;
}
