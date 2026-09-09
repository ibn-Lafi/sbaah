'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { consoleLoginSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { login } from '@/lib/api/console-auth';
import { ApiRequestError } from '@/lib/api/client';
import { adoptSession } from '@/lib/auth/session';

/** Single-factor login (task 37/42, revised — no TOTP) — email + password, a success mints a real session directly. */
export default function ConsoleLoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const check = consoleLoginSchema.safeParse({ email, password });
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? 'بيانات غير صحيحة');
      return;
    }

    setLoading(true);
    try {
      const session = await login(check.data);
      await adoptSession(session.access_token, session.refresh_token);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-1 text-xl font-bold text-brand">سبعة — إدارة المنصة</h1>

        <form onSubmit={handleSubmit} className="mt-6 flex flex-col gap-4">
          <Input type="email" placeholder="admin@sbaah.com" value={email} onChange={(e) => setEmail(e.target.value)} dir="ltr" />
          <Input type="password" placeholder="كلمة المرور" value={password} onChange={(e) => setPassword(e.target.value)} />
          <FormError message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'جارٍ الدخول...' : 'تسجيل الدخول'}
          </Button>
        </form>
      </Card>
    </div>
  );
}
