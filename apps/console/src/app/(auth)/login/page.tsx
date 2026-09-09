'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { consoleLoginSchema, passwordSchema, saudiPhoneSchema, totpCodeSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormError } from '@/components/ui/form-error';
import { login, setupTotp, confirmTotp, verifyTotp } from '@/lib/api/console-auth';
import { ApiRequestError } from '@/lib/api/client';
import { adoptSession } from '@/lib/auth/session';

type Step = 'password' | 'verify' | 'setup';

/**
 * Mandatory 2FA (PRODUCT_SPEC section 7) — password alone never
 * produces a usable session (task 37/42). A first-ever login (2FA not
 * set up yet) walks through `setup` instead of `verify`; every
 * subsequent login goes through `verify`.
 */
export default function ConsoleLoginPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [challengeToken, setChallengeToken] = useState('');
  const [setupToken, setSetupToken] = useState('');
  const [secret, setSecret] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handlePasswordSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const phoneCheck = saudiPhoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      setError(phoneCheck.error.issues[0]?.message ?? 'رقم جوال غير صحيح');
      return;
    }
    const passwordCheck = passwordSchema.safeParse(password);
    if (!passwordCheck.success) {
      setError(passwordCheck.error.issues[0]?.message ?? 'كلمة مرور غير صحيحة');
      return;
    }

    setLoading(true);
    try {
      const result = await login(consoleLoginSchema.parse({ phone, password }));
      setChallengeToken(result.challenge_token);
      if (result.totp_enabled) {
        setStep('verify');
      } else {
        const setup = await setupTotp({ challenge_token: result.challenge_token });
        setSetupToken(setup.setup_token);
        setSecret(setup.secret);
        setStep('setup');
      }
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر تسجيل الدخول');
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifySubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const codeCheck = totpCodeSchema.safeParse(code);
    if (!codeCheck.success) {
      setError(codeCheck.error.issues[0]?.message ?? 'رمز غير صحيح');
      return;
    }

    setLoading(true);
    try {
      const session = await verifyTotp({ challenge_token: challengeToken, code });
      await adoptSession(session.access_token, session.refresh_token);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر التحقق');
    } finally {
      setLoading(false);
    }
  }

  async function handleSetupSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const codeCheck = totpCodeSchema.safeParse(code);
    if (!codeCheck.success) {
      setError(codeCheck.error.issues[0]?.message ?? 'رمز غير صحيح');
      return;
    }

    setLoading(true);
    try {
      const session = await confirmTotp({ setup_token: setupToken, code });
      await adoptSession(session.access_token, session.refresh_token);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر تفعيل المصادقة الثنائية');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <Card className="w-full max-w-md p-8">
        <h1 className="mb-1 text-xl font-bold text-brand">سبعة — إدارة المنصة</h1>

        {step === 'password' && (
          <form onSubmit={handlePasswordSubmit} className="mt-6 flex flex-col gap-4">
            <Input type="tel" placeholder="+966501234567" value={phone} onChange={(e) => setPhone(e.target.value)} dir="ltr" />
            <Input
              type="password"
              placeholder="كلمة المرور"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <FormError message={error} />
            <Button type="submit" disabled={loading}>
              {loading ? 'جارٍ الدخول...' : 'متابعة'}
            </Button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleVerifySubmit} className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-black/60">أدخل رمز التحقق من تطبيق المصادقة الثنائية</p>
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              dir="ltr"
              className="text-center text-lg tracking-[0.5em]"
            />
            <FormError message={error} />
            <Button type="submit" disabled={loading}>
              {loading ? 'جارٍ التحقق...' : 'تأكيد'}
            </Button>
          </form>
        )}

        {step === 'setup' && (
          <form onSubmit={handleSetupSubmit} className="mt-6 flex flex-col gap-4">
            <p className="text-sm text-black/60">
              أول تسجيل دخول — فعّل المصادقة الثنائية بإضافة هذا المفتاح يدويًا في تطبيق مصادقة (مثل Google
              Authenticator أو Authy)، ثم أدخل الرمز الظاهر لديك:
            </p>
            <div dir="ltr" className="select-all rounded-lg bg-black/5 p-3 text-center font-mono text-sm">
              {secret}
            </div>
            <Input
              inputMode="numeric"
              maxLength={6}
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              dir="ltr"
              className="text-center text-lg tracking-[0.5em]"
            />
            <FormError message={error} />
            <Button type="submit" disabled={loading}>
              {loading ? 'جارٍ التفعيل...' : 'تفعيل المصادقة الثنائية'}
            </Button>
          </form>
        )}
      </Card>
    </div>
  );
}
