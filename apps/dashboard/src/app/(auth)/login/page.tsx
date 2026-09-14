'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { emailSchema, otpCodeSchema, passwordSchema, saudiPhoneSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { FormError } from '@/components/ui/form-error';
import {
  loginWithPasswordByEmail,
  sendOtp,
  sendOtpByEmail,
  verifyLoginOtp,
  type OtpIdentifier,
} from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { adoptSession } from '@/lib/auth/session';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useResendCooldown } from '@/lib/auth/use-resend-cooldown';

type LoginMode = 'password' | 'otp';
type Channel = 'sms' | 'email';

/**
 * `channel` (جوال/بريد) is one shared toggle for the whole page, applying
 * to whichever mode (password/OTP) is active — matches the identifier
 * choice, not the login method. Two independent methods either way, per
 * docs/OTP_FLOW.md sections 5b/5c/10: phone+password logs in directly
 * against Supabase from the browser; email+password goes through `api`
 * (POST /v1/auth/login) since Supabase Auth has no real notion of the
 * user's own email (its `auth.users.email` is a synthetic, never-emailed
 * address — OTP_FLOW.md section 4) and the email → phone lookup has to
 * happen server-side. OTP login (either channel) goes through `api`'s
 * otp/send + otp/verify and adopts the session it mints.
 */
export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<LoginMode>('password');
  const [channel, setChannel] = useState<Channel>('sms');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resend = useResendCooldown();

  async function handlePasswordLoginByPhone() {
    const { error: signInError } = await getSupabaseBrowserClient().auth.signInWithPassword({ phone, password });
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
  }

  async function handlePasswordLoginByEmail() {
    try {
      const { access_token, refresh_token } = await loginWithPasswordByEmail(email, password);
      await adoptSession(access_token, refresh_token);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر تسجيل الدخول');
    }
  }

  async function handlePasswordLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const passwordCheck = passwordSchema.safeParse(password);
    if (!passwordCheck.success) {
      setError(passwordCheck.error.issues[0]?.message ?? 'كلمة مرور غير صحيحة');
      return;
    }

    if (channel === 'sms') {
      const phoneCheck = saudiPhoneSchema.safeParse(phone);
      if (!phoneCheck.success) {
        setError(phoneCheck.error.issues[0]?.message ?? 'رقم جوال غير صحيح');
        return;
      }
    } else {
      const emailCheck = emailSchema.safeParse(email);
      if (!emailCheck.success) {
        setError(emailCheck.error.issues[0]?.message ?? 'بريد إلكتروني غير صحيح');
        return;
      }
    }

    setLoading(true);
    try {
      if (channel === 'sms') {
        await handlePasswordLoginByPhone();
      } else {
        await handlePasswordLoginByEmail();
      }
    } catch {
      // Network-level failure reaching Supabase directly (phone channel
      // only — the email channel's ApiRequestError is already handled
      // inside handlePasswordLoginByEmail above).
      setError('تعذّر الاتصال بالخادم، تحقق من اتصالك بالإنترنت');
    } finally {
      setLoading(false);
    }
  }

  function currentIdentifier(): OtpIdentifier | null {
    if (channel === 'sms') {
      const check = saudiPhoneSchema.safeParse(phone);
      if (!check.success) {
        setError(check.error.issues[0]?.message ?? 'رقم جوال غير صحيح');
        return null;
      }
      return { phone };
    }
    const check = emailSchema.safeParse(email);
    if (!check.success) {
      setError(check.error.issues[0]?.message ?? 'بريد إلكتروني غير صحيح');
      return null;
    }
    return { email: check.data };
  }

  async function sendLoginOtp() {
    setError(null);
    const identifier = currentIdentifier();
    if (!identifier) return;

    setLoading(true);
    try {
      if ('phone' in identifier) {
        await sendOtp(identifier.phone, 'login');
      } else {
        await sendOtpByEmail(identifier.email, 'login');
      }
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
    const identifier = channel === 'sms' ? { phone } : { email };

    setLoading(true);
    try {
      const { access_token, refresh_token } = await verifyLoginOtp(identifier, code);
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

  function switchChannel(next: Channel) {
    setChannel(next);
    setError(null);
    setOtpSent(false);
    setCode('');
  }

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-text-primary">تسجيل الدخول</h1>
      <p className="mb-6 text-sm text-text-secondary">سجّل الدخول للمتابعة إلى لوحة التحكم</p>

      <div className="mb-4 flex gap-2 rounded-control bg-surface-subtle p-1">
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

      {!(mode === 'otp' && otpSent) && (
        <div className="mb-6 flex items-center justify-center gap-0.5 rounded-full bg-surface-subtle p-[5px]">
          <button
            type="button"
            onClick={() => switchChannel('sms')}
            className={`flex h-8 flex-1 items-center justify-center rounded-full px-3 text-xs transition-colors ${
              channel === 'sms' ? 'bg-brand-surface text-brand font-semibold' : 'text-text-secondary font-normal'
            }`}
          >
            عبر الجوال
          </button>
          <button
            type="button"
            onClick={() => switchChannel('email')}
            className={`flex h-8 flex-1 items-center justify-center rounded-full px-3 text-xs transition-colors ${
              channel === 'email' ? 'bg-brand-surface text-brand font-semibold' : 'text-text-secondary font-normal'
            }`}
          >
            عبر البريد الإلكتروني
          </button>
        </div>
      )}

      {mode === 'password' && (
        <form onSubmit={handlePasswordLogin} className="flex flex-col gap-4">
          {channel === 'sms' ? (
            <PhoneInput placeholder="5xxxxxxxx" value={phone} onChange={setPhone} />
          ) : (
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          )}
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FormError message={error} />
          <Button type="submit" loading={loading}>
            {loading ? 'جارٍ الدخول...' : 'دخول'}
          </Button>
          <Link href="/forgot-password" className="text-center text-sm text-brand hover:underline">
            نسيت كلمة المرور؟
          </Link>
        </form>
      )}

      {mode === 'otp' && !otpSent && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          {channel === 'sms' ? (
            <PhoneInput placeholder="5xxxxxxxx" value={phone} onChange={setPhone} />
          ) : (
            <Input
              type="email"
              placeholder="name@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              dir="ltr"
            />
          )}
          <FormError message={error} />
          <Button type="submit" loading={loading}>
            {loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
          </Button>
        </form>
      )}

      {mode === 'otp' && otpSent && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">
            أدخل الرمز المرسل إلى {channel === 'sms' ? phone : email}
          </p>
          <OtpInput value={code} onChange={setCode} disabled={loading} />
          <FormError message={error} />
          <Button type="submit" loading={loading}>
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
