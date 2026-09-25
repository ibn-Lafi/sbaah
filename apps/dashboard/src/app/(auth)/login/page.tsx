'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { emailSchema, otpCodeSchema, passwordSchema, saudiPhoneSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { FormError } from '@/components/ui/form-error';
import { SegmentedToggle } from '@/components/ui/segmented-toggle';
import { loginWithPasswordByEmail, sendOtp, verifyLoginOtp } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { adoptSession } from '@/lib/auth/session';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import { useResendCooldown } from '@/lib/auth/use-resend-cooldown';
import { useLocale } from '@/lib/i18n/locale-context';

type LoginMode = 'password' | 'otp';
type Channel = 'sms' | 'email';

/**
 * `channel` (جوال/بريد) applies to password mode only — password login
 * supports both phone and email, per docs/OTP_FLOW.md sections 5b/5c:
 * phone+password logs in directly against Supabase from the browser;
 * email+password goes through `api` (POST /v1/auth/login) since Supabase
 * Auth has no real notion of the user's own email (its `auth.users.email`
 * is a synthetic, never-emailed address — OTP_FLOW.md section 4) and the
 * email → phone lookup has to happen server-side. OTP login is phone-only
 * and goes through `api`'s otp/send + otp/verify and adopts the session
 * it mints.
 */
export default function LoginPage() {
  const router = useRouter();
  const { pages } = useLocale();
  const t = pages.auth;
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

  // (app)/layout.tsx signs a removed member out and lands them here.
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get('reason') === 'account_disabled') {
      setError(t.login.accountDisabled);
    }
  }, [t.login.accountDisabled]);

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
          ? t.login.invalidCredentials
          : signInError.message === 'User is banned'
            ? t.login.accountDisabled
            : t.login.loginFailedWithReason(signInError.message),
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
      setError(err instanceof ApiRequestError ? err.message : t.login.loginFailedFallback);
    }
  }

  async function handlePasswordLogin(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const passwordCheck = passwordSchema.safeParse(password);
    if (!passwordCheck.success) {
      setError(passwordCheck.error.issues[0]?.message ?? t.shared.invalidPasswordFallback);
      return;
    }

    if (channel === 'sms') {
      const phoneCheck = saudiPhoneSchema.safeParse(phone);
      if (!phoneCheck.success) {
        setError(phoneCheck.error.issues[0]?.message ?? t.shared.invalidPhoneFallback);
        return;
      }
    } else {
      const emailCheck = emailSchema.safeParse(email);
      if (!emailCheck.success) {
        setError(emailCheck.error.issues[0]?.message ?? t.shared.invalidEmailFallback);
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
      setError(t.login.connectionFailed);
    } finally {
      setLoading(false);
    }
  }

  async function sendLoginOtp() {
    setError(null);
    const phoneCheck = saudiPhoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      setError(phoneCheck.error.issues[0]?.message ?? t.shared.invalidPhoneFallback);
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone, 'login');
      setOtpSent(true);
      resend.start();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.shared.otpSendFailedFallback);
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
      setError(codeCheck.error.issues[0]?.message ?? t.shared.invalidOtpCodeFallback);
      return;
    }

    setLoading(true);
    try {
      const { access_token, refresh_token } = await verifyLoginOtp({ phone }, code);
      await adoptSession(access_token, refresh_token);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.shared.otpVerifyFailedFallback);
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
    <>
      <h1 className="mb-1 text-2xl font-bold text-text-primary">{t.shared.signIn}</h1>
      <p className="mb-6 text-sm text-text-secondary">{t.login.subtitle}</p>

      <div className="mb-4 flex gap-2 rounded-control bg-surface-subtle p-1">
        <button
          type="button"
          onClick={() => switchMode('password')}
          className={`h-9 flex-1 rounded-control text-sm font-semibold transition-colors ${
            mode === 'password' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'
          }`}
        >
          {t.login.passwordTab}
        </button>
        <button
          type="button"
          onClick={() => switchMode('otp')}
          className={`h-9 flex-1 rounded-control text-sm font-semibold transition-colors ${
            mode === 'otp' ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'
          }`}
        >
          {t.login.otpTab}
        </button>
      </div>

      {mode === 'password' && (
        <SegmentedToggle
          className="mb-6"
          value={channel}
          onChange={switchChannel}
          options={[
            { value: 'sms', label: t.shared.channelPhone },
            { value: 'email', label: t.shared.channelEmail },
          ]}
        />
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
          <PasswordInput
            placeholder={t.login.passwordPlaceholder}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />
          <FormError message={error} />
          <Button type="submit" loading={loading}>
            {loading ? t.login.signingIn : t.login.signInButton}
          </Button>
          <Link href="/forgot-password" className="text-center text-sm text-brand hover:underline">
            {t.login.forgotPasswordLink}
          </Link>
        </form>
      )}

      {mode === 'otp' && !otpSent && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <PhoneInput placeholder="5xxxxxxxx" value={phone} onChange={setPhone} />
          <FormError message={error} />
          <Button type="submit" loading={loading}>
            {loading ? t.shared.sendingOtp : t.shared.sendOtp}
          </Button>
        </form>
      )}

      {mode === 'otp' && otpSent && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <p className="text-sm text-text-secondary">{t.shared.otpSentTo(phone)}</p>
          <OtpInput value={code} onChange={setCode} disabled={loading} />
          <FormError message={error} />
          <Button type="submit" loading={loading}>
            {loading ? t.shared.verifying : t.shared.verify}
          </Button>
          <button
            type="button"
            disabled={resend.secondsLeft > 0 || loading}
            onClick={() => void sendLoginOtp()}
            className="text-sm text-brand hover:underline disabled:cursor-not-allowed disabled:text-text-placeholder"
          >
            {resend.secondsLeft > 0 ? t.shared.resendIn(resend.secondsLeft) : t.shared.resendCode}
          </button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        {t.login.noAccountPrompt}{' '}
        <Link href="/register" className="font-semibold text-brand hover:underline">
          {t.login.createAccountLink}
        </Link>
      </p>
    </>
  );
}
