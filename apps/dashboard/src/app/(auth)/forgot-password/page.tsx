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
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';
import { resetPassword, sendOtp, sendOtpByEmail, verifyResetPasswordOtp, type OtpIdentifier } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { useResendCooldown } from '@/lib/auth/use-resend-cooldown';

type Step = 'identify' | 'otp' | 'new_password';
type OtpChannel = 'sms' | 'email';

/**
 * docs/OTP_FLOW.md section 5d — same OTP shape as the other two flows,
 * but success does not mint a session: the user re-enters through the
 * normal password login with the new password. Section 10 adds an email
 * channel here alongside the original phone one.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('identify');
  const [channel, setChannel] = useState<OtpChannel>('sms');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resend = useResendCooldown();

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

  async function sendResetOtp() {
    setError(null);
    const identifier = currentIdentifier();
    if (!identifier) return;

    setLoading(true);
    try {
      if ('phone' in identifier) {
        await sendOtp(identifier.phone, 'reset_password');
      } else {
        await sendOtpByEmail(identifier.email, 'reset_password');
      }
      setStep('otp');
      resend.start();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  }

  function handleSendOtp(event: FormEvent) {
    event.preventDefault();
    void sendResetOtp();
  }

  async function handleVerifyOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const codeCheck = otpCodeSchema.safeParse(code);
    if (!codeCheck.success) {
      setError(codeCheck.error.issues[0]?.message ?? 'رمز غير صحيح');
      return;
    }
    const identifier: OtpIdentifier = channel === 'sms' ? { phone } : { email };

    setLoading(true);
    try {
      const { reset_token } = await verifyResetPasswordOtp(identifier, code);
      setResetToken(reset_token);
      setStep('new_password');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitNewPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const passwordCheck = passwordSchema.safeParse(newPassword);
    if (!passwordCheck.success) {
      setError(passwordCheck.error.issues[0]?.message ?? 'كلمة مرور غير صحيحة');
      return;
    }

    setLoading(true);
    try {
      await resetPassword({ reset_token: resetToken, new_password: newPassword });
      router.push('/login');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر تحديث كلمة المرور');
    } finally {
      setLoading(false);
    }
  }

  function switchChannel(next: OtpChannel) {
    setChannel(next);
    setError(null);
  }

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-text-primary">استعادة كلمة المرور</h1>
      <p className="mb-6 text-sm text-text-secondary">
        {step === 'identify' && 'أدخل رقم جوالك أو بريدك الإلكتروني المسجّل'}
        {step === 'otp' && `أدخل الرمز المرسل إلى ${channel === 'sms' ? phone : email}`}
        {step === 'new_password' && 'أدخل كلمة المرور الجديدة'}
      </p>

      {step === 'identify' && (
        <div className="flex flex-col gap-4">
          <div className="flex gap-4 text-sm">
            <button
              type="button"
              onClick={() => switchChannel('sms')}
              className={`font-semibold ${channel === 'sms' ? 'text-brand' : 'text-text-secondary'}`}
            >
              عبر الجوال
            </button>
            <button
              type="button"
              onClick={() => switchChannel('email')}
              className={`font-semibold ${channel === 'email' ? 'text-brand' : 'text-text-secondary'}`}
            >
              عبر البريد الإلكتروني
            </button>
          </div>
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
            <Button type="submit" disabled={loading}>
              {loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
            </Button>
          </form>
        </div>
      )}

      {step === 'otp' && (
        <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
          <OtpInput value={code} onChange={setCode} disabled={loading} />
          <FormError message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'جارٍ التحقق...' : 'تأكيد'}
          </Button>
          <button
            type="button"
            disabled={resend.secondsLeft > 0 || loading}
            onClick={() => void sendResetOtp()}
            className="text-sm text-brand hover:underline disabled:cursor-not-allowed disabled:text-text-placeholder"
          >
            {resend.secondsLeft > 0 ? `إعادة الإرسال بعد ${resend.secondsLeft} ثانية` : 'إعادة إرسال الرمز'}
          </button>
        </form>
      )}

      {step === 'new_password' && (
        <form onSubmit={handleSubmitNewPassword} className="flex flex-col gap-4">
          <Input
            type="password"
            placeholder="كلمة المرور الجديدة"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
          />
          <PasswordStrengthMeter password={newPassword} />
          <FormError message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'جارٍ التحديث...' : 'تحديث كلمة المرور'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        تذكّرت كلمة المرور؟{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </Card>
  );
}
