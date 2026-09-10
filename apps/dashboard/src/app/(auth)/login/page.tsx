'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { otpCodeSchema, passwordSchema, saudiPhoneSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import { FormError } from '@/components/ui/form-error';
import { sendOtp, verifyLoginOtp } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { adoptSession } from '@/lib/auth/session';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useResendCooldown } from '@/lib/auth/use-resend-cooldown';

type LoginMode = 'password' | 'otp';

/**
 * Two independent paths, per docs/OTP_FLOW.md sections 5b/5c: password
 * login never touches `api` (straight to Supabase Auth), OTP login goes
 * through `api`'s otp/send + otp/verify and adopts the session it mints.
 */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('password');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resend = useResendCooldown();

  async function handlePasswordLogin(event: FormEvent) {
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
      const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({
        phone,
        password,
      });
      if (signInError) {
        // "Invalid login credentials" (genuinely wrong phone/password) gets
        // the friendly Arabic message; anything else (e.g. Supabase's
        // phone auth provider not enabled on the project, a distinct error)
        // is shown as-is — collapsing every failure into "wrong password"
        // makes a real config problem indistinguishable from a typo.
        setError(
          signInError.message === 'Invalid login credentials'
            ? 'رقم الجوال أو كلمة المرور غير صحيحة'
            : `تعذّر تسجيل الدخول: ${signInError.message}`,
        );
        return;
      }
      router.push('/');
    } catch {
      // Network-level failure reaching Supabase directly (not an
      // auth rejection, which signInError above already covers).
      setError('تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت');
    } finally {
      setLoading(false);
    }
  }

  async function sendLoginOtp() {
    setError(null);

    const phoneCheck = saudiPhoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      setError(phoneCheck.error.issues[0]?.message ?? 'رقم جوال غير صحيح');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone, 'login');
      setOtpSent(true);
      resend.start();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  }

  function handleSendOtp(event: FormEvent) {
    event.preventDefault();
    void sendLoginOtp();
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const codeCheck = otpCodeSchema.safeParse(code);
    if (!codeCheck.success) {
      setError(codeCheck.error.issues[0]?.message ?? 'رمز غير صحيح');
      return;
    }

    setLoading(true);
    try {
      const { access_token, refresh_token } = await verifyLoginOtp(phone, code);
      await adoptSession(access_token, refresh_token);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next: LoginMode) {
    setMode(next);
    setError(null);
    setOtpSent(false);
    setCode('');
  }

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-text-primary">تسجيل الدخول</h1>
      <p className="mb-6 text-sm text-text-secondary">أدخل رقم جوالك للمتابعة إلى لوحة التحكم</p>

      <div className="mb-6 flex gap-2 rounded-control bg-surface-subtle p-1">
        <button
          type="button"
          onClick={() => switchMode('password')}
          className={`h-9 flex-1 rounded-control text-sm font-semibold transition-colors ${
            mode === 'password' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'
          }`}
        >
          كلمة المرور
        </button>
        <button
          type="button"
          onClick={() => switchMode('otp')}
          className={`h-9 flex-1 rounded-control text-sm font-semibold transition-colors ${
            mode === 'otp' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'
          }`}
        >
          رمز التحقق
        </button>
      </div>

      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
          <Input
            type="tel"
            placeholder="+966501234567"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            dir="ltr"
          />
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FormError message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </Button>
          <Link href="/forgot-password" className="text-center text-sm text-brand hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </form>
      )}

      {mode === 'otp' && !otpSent && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <Input
            type="tel"
            placeholder="+966501234567"
            value={phone}
            onChange={(event) => setPhone(event.target.value)}
            dir="ltr"
          />
          <FormError message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
          </Button>
        </form>
      )}

      {mode === 'otp' && otpSent && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">أدخل الرمز المرسل إلى {phone}</p>
          <OtpInput value={code} onChange={setCode} disabled={loading} />
          <FormError message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'جارٍ التحقق...' : 'تأكيد'}
          </Button>
          <button
            type="button"
            disabled={resend.secondsLeft > 0 || loading}
            onClick={() => void sendLoginOtp()}
            className="text-sm text-brand hover:underline disabled:cursor-not-allowed disabled:text-text-placeholder"
          >
            {resend.secondsLeft > 0 ? `إعادة الإرسال بعد ${resend.secondsLeft} ثانية` : 'إعادة إرسال الرمز'}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        ليس لديك حساب؟{' '}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          إنشاء حساب جديد
        </Link>
      </p>
    </Card>
  );
}
