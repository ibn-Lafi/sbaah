'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { otpCodeSchema, passwordSchema, saudiPhoneSchema } from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PhoneInput } from '@/components/ui/phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { FormError } from '@/components/ui/form-error';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';
import { resetPassword, sendOtp, verifyResetPasswordOtp } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { useResendCooldown } from '@/lib/auth/use-resend-cooldown';

type Step = 'phone' | 'otp' | 'new_password';

/**
 * docs/OTP_FLOW.md section 5d — same OTP shape as the other two flows,
 * but success does not mint a session: the user re-enters through the
 * normal password login with the new password.
 */
export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [resetToken, setResetToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resend = useResendCooldown();

  async function sendResetOtp() {
    setError(null);
    setLoading(true);
    try {
      await sendOtp(phone, 'reset_password');
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
    const phoneCheck = saudiPhoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      setError(phoneCheck.error.issues[0]?.message ?? 'رقم جوال غير صحيح');
      return;
    }
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

    setLoading(true);
    try {
      const { reset_token } = await verifyResetPasswordOtp(phone, code);
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

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-text-primary">استعادة كلمة المرور</h1>
      <p className="mb-6 text-sm text-text-secondary">
        {step === 'phone' && 'أدخل رقم جوالك المسجّل'}
        {step === 'otp' && `أدخل الرمز المرسل إلى ${phone}`}
        {step === 'new_password' && 'أدخل كلمة المرور الجديدة'}
      </p>

      {step === 'phone' && (
        <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
          <PhoneInput placeholder="5xxxxxxxx" value={phone} onChange={setPhone} />
          <FormError message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
          </Button>
        </form>
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
