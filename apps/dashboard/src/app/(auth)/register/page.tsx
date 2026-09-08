'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  otpCodeSchema,
  passwordSchema,
  saudiPhoneSchema,
  tenantRegistrationSchema,
  type AccountType,
  type TenantRegistrationInput,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import { FormError } from '@/components/ui/form-error';
import { register, sendOtp, verifyRegisterOtp } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { adoptSession } from '@/lib/auth/session';
import { useResendCooldown } from '@/lib/auth/use-resend-cooldown';

type Step = 'phone' | 'otp' | 'details';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  individual: 'فرد',
  institution: 'مؤسسة',
  company: 'شركة',
};

/** docs/OTP_FLOW.md section 5a — three steps: phone, OTP, then account details + password (only step 3 actually creates the account). */
export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const resend = useResendCooldown();

  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [fullName, setFullName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [falLicenseNumber, setFalLicenseNumber] = useState('');
  const [password, setPassword] = useState('');

  async function handleSendOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const phoneCheck = saudiPhoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      setError(phoneCheck.error.issues[0]?.message ?? 'رقم جوال غير صحيح');
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone, 'register');
      setStep('otp');
      resend.start();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setError(null);
    setLoading(true);
    try {
      await sendOtp(phone, 'register');
      resend.start();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إرسال رمز التحقق');
    } finally {
      setLoading(false);
    }
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
      const { registration_token } = await verifyRegisterOtp(phone, code);
      setRegistrationToken(registration_token);
      setStep('details');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitDetails(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const account: TenantRegistrationInput =
      accountType === 'individual'
        ? { account_type: 'individual', full_name: fullName, fal_license_number: falLicenseNumber }
        : {
            account_type: accountType,
            name_ar: nameAr,
            owner_full_name: ownerFullName,
            cr_number: crNumber,
            tax_number: taxNumber,
            fal_license_number: falLicenseNumber,
          };

    const accountCheck = tenantRegistrationSchema.safeParse(account);
    if (!accountCheck.success) {
      setError(accountCheck.error.issues[0]?.message ?? 'يرجى مراجعة بيانات الحساب');
      return;
    }
    const passwordCheck = passwordSchema.safeParse(password);
    if (!passwordCheck.success) {
      setError(passwordCheck.error.issues[0]?.message ?? 'كلمة مرور غير صحيحة');
      return;
    }

    setLoading(true);
    try {
      const { access_token, refresh_token } = await register({
        registration_token: registrationToken,
        password,
        account: accountCheck.data,
      });
      await adoptSession(access_token, refresh_token);
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-8">
      <h1 className="mb-1 text-2xl font-bold text-text-primary">إنشاء حساب جديد</h1>
      <p className="mb-6 text-sm text-text-secondary">
        {step === 'phone' && 'أدخل رقم جوالك لبدء التسجيل'}
        {step === 'otp' && `أدخل الرمز المرسل إلى ${phone}`}
        {step === 'details' && 'أكمل بيانات الحساب'}
      </p>

      {step === 'phone' && (
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
            onClick={() => void resendOtp()}
            className="text-sm text-brand hover:underline disabled:cursor-not-allowed disabled:text-text-placeholder"
          >
            {resend.secondsLeft > 0 ? `إعادة الإرسال بعد ${resend.secondsLeft} ثانية` : 'إعادة إرسال الرمز'}
          </button>
        </form>
      )}

      {step === 'details' && (
        <form onSubmit={handleSubmitDetails} className="flex flex-col gap-4">
          <div className="flex gap-2 rounded-control bg-surface-subtle p-1">
            {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => setAccountType(type)}
                className={`h-9 flex-1 rounded-control text-sm font-semibold transition-colors ${
                  accountType === type ? 'bg-surface-card text-text-primary shadow-sm' : 'text-text-secondary'
                }`}
              >
                {ACCOUNT_TYPE_LABELS[type]}
              </button>
            ))}
          </div>

          {accountType === 'individual' ? (
            <Input placeholder="الاسم الثلاثي" value={fullName} onChange={(event) => setFullName(event.target.value)} />
          ) : (
            <>
              <Input
                placeholder={accountType === 'institution' ? 'اسم المؤسسة' : 'اسم الشركة'}
                value={nameAr}
                onChange={(event) => setNameAr(event.target.value)}
              />
              <Input
                placeholder="الاسم الثلاثي لمسؤول الحساب"
                value={ownerFullName}
                onChange={(event) => setOwnerFullName(event.target.value)}
              />
              <Input placeholder="رقم السجل التجاري" value={crNumber} onChange={(event) => setCrNumber(event.target.value)} />
              <Input placeholder="الرقم الضريبي" value={taxNumber} onChange={(event) => setTaxNumber(event.target.value)} />
            </>
          )}

          <Input
            placeholder="رقم رخصة فال"
            value={falLicenseNumber}
            onChange={(event) => setFalLicenseNumber(event.target.value)}
          />
          <Input
            type="password"
            placeholder="كلمة المرور"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
          />

          <FormError message={error} />
          <Button type="submit" disabled={loading}>
            {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
          </Button>
        </form>
      )}

      <p className="mt-6 text-center text-sm text-text-secondary">
        لديك حساب بالفعل؟{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          تسجيل الدخول
        </Link>
      </p>
    </Card>
  );
}
