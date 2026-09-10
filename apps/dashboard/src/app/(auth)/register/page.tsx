'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  otpCodeSchema,
  passwordSchema,
  saudiPhoneSchema,
  tenantRegistrationSchema,
  REGISTRATION_OPEN,
  type AccountType,
  type TenantRegistrationInput,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import { FormError } from '@/components/ui/form-error';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';
import { ProvisioningOverlay } from '@/components/auth/provisioning-overlay';
import { register, sendOtp, verifyRegisterOtp } from '@/lib/api/auth';
import { ApiRequestError } from '@/lib/api/client';
import { adoptSession } from '@/lib/auth/session';
import { useResendCooldown } from '@/lib/auth/use-resend-cooldown';

const STEPS = ['phone', 'otp', 'password', 'details'] as const;
type Step = (typeof STEPS)[number];

const STEP_TITLES: Record<Step, string> = {
  phone: 'رقم الجوال',
  otp: 'رمز التحقق',
  password: 'تعيين كلمة المرور',
  details: 'بيانات الحساب',
};

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  individual: 'فرد',
  institution: 'مؤسسة',
  company: 'شركة',
};

/**
 * docs/OTP_FLOW.md section 5a — four steps: phone, OTP, password (its own
 * step, with a confirm field + strength meter, matching the founder's
 * mockup's step 3), then account details. Only step 4 actually creates
 * the account (`register()` still takes password + account together in
 * one call — the split here is presentational, not a new API round trip).
 * The mockup's flow goes on to a 5th/6th step (account type, then plan
 * selection) — not built here; plan selection during signup is separate,
 * larger scope (every account still starts on the Basic plan and can
 * change it after registering), so the step count stays honest at 4
 * rather than claiming "خطوة X من 6" for steps that don't exist yet.
 */
/** التسجيل متوقف مؤقتًا (packages/shared/src/config.ts) ريثما تُبنى خطوة اختيار الباقة والدفع عبر StreamPay. */
function RegistrationClosedNotice() {
  return (
    <Card className="p-8">
      <h1 className="mb-2 text-2xl font-bold text-text-primary">التسجيل متوقف مؤقتًا</h1>
      <p className="text-sm text-text-secondary">
        نعمل حاليًا على تحديث خطوات إنشاء الحساب، وسنعيد فتح التسجيل قريبًا. لديك حساب بالفعل؟{' '}
        <Link href="/login" className="font-semibold text-brand hover:underline">
          تسجيل الدخول
        </Link>
        .
      </p>
    </Card>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [registrationToken, setRegistrationToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [provisioning, setProvisioning] = useState(false);
  const [provisioningDone, setProvisioningDone] = useState(false);
  const resend = useResendCooldown();

  const [accountType, setAccountType] = useState<AccountType>('individual');
  const [fullName, setFullName] = useState('');
  const [nameAr, setNameAr] = useState('');
  const [ownerFullName, setOwnerFullName] = useState('');
  const [crNumber, setCrNumber] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [falLicenseNumber, setFalLicenseNumber] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

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
      setStep('password');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر التحقق من الرمز');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmitPassword(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const passwordCheck = passwordSchema.safeParse(password);
    if (!passwordCheck.success) {
      setError(passwordCheck.error.issues[0]?.message ?? 'كلمة مرور غير صحيحة');
      return;
    }
    if (password !== passwordConfirm) {
      setError('كلمتا المرور غير متطابقتين');
      return;
    }
    setStep('details');
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

    setLoading(true);
    setProvisioning(true);
    try {
      const { access_token, refresh_token } = await register({
        registration_token: registrationToken,
        password,
        account: accountCheck.data,
      });
      await adoptSession(access_token, refresh_token);
      setProvisioningDone(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      router.push('/');
    } catch (err) {
      setProvisioning(false);
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إنشاء الحساب');
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  if (!REGISTRATION_OPEN) {
    return <RegistrationClosedNotice />;
  }

  return (
    <>
      <ProvisioningOverlay active={provisioning} done={provisioningDone} />
      <Card className="p-8">
        <div className="text-brand mb-1 text-xs font-semibold">
          الخطوة {stepIndex + 1} من {STEPS.length}
        </div>
        <h1 className="text-text-primary mb-1 text-2xl font-bold">
          {step === 'phone' || step === 'otp' ? 'إنشاء حساب جديد' : STEP_TITLES[step]}
        </h1>
        <p className="text-text-secondary mb-6 text-sm">
          {step === 'phone' && 'أدخل رقم جوالك لبدء التسجيل'}
          {step === 'otp' && `أدخل الرمز المرسل إلى ${phone}`}
          {step === 'password' && 'ستستخدمها لاحقًا للدخول بدل رمز التحقق'}
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
            <Button type="submit" loading={loading}>
              {loading ? 'جارٍ الإرسال...' : 'إرسال رمز التحقق'}
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <OtpInput value={code} onChange={setCode} disabled={loading} />
            <FormError message={error} />
            <Button type="submit" loading={loading}>
              {loading ? 'جارٍ التحقق...' : 'تأكيد'}
            </Button>
            <button
              type="button"
              disabled={resend.secondsLeft > 0 || loading}
              onClick={() => void resendOtp()}
              className="text-brand disabled:text-text-placeholder text-sm hover:underline disabled:cursor-not-allowed"
            >
              {resend.secondsLeft > 0
                ? `إعادة الإرسال بعد ${resend.secondsLeft} ثانية`
                : 'إعادة إرسال الرمز'}
            </button>
          </form>
        )}

        {step === 'password' && (
          <form onSubmit={handleSubmitPassword} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-text-primary text-sm font-medium">كلمة المرور</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <PasswordStrengthMeter password={password} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-text-primary text-sm font-medium">تأكيد كلمة المرور</label>
              <Input
                type="password"
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </div>
            <FormError message={error} />
            <Button type="submit" disabled={loading}>
              متابعة
            </Button>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmitDetails} className="flex flex-col gap-4">
            <div className="rounded-control bg-surface-subtle flex gap-2 p-1">
              {(Object.keys(ACCOUNT_TYPE_LABELS) as AccountType[]).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setAccountType(type)}
                  className={`rounded-control h-9 flex-1 text-sm font-semibold transition-colors ${
                    accountType === type
                      ? 'bg-surface-card text-text-primary shadow-sm'
                      : 'text-text-secondary'
                  }`}
                >
                  {ACCOUNT_TYPE_LABELS[type]}
                </button>
              ))}
            </div>

            {accountType === 'individual' ? (
              <Input
                placeholder="الاسم الثلاثي"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
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
                <Input
                  placeholder="رقم السجل التجاري"
                  value={crNumber}
                  onChange={(event) => setCrNumber(event.target.value)}
                />
                <Input
                  placeholder="الرقم الضريبي"
                  value={taxNumber}
                  onChange={(event) => setTaxNumber(event.target.value)}
                />
              </>
            )}

            <Input
              placeholder="رقم رخصة فال"
              value={falLicenseNumber}
              onChange={(event) => setFalLicenseNumber(event.target.value)}
            />

            <FormError message={error} />
            <Button type="submit" loading={loading}>
              {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
            </Button>
          </form>
        )}

        <p className="text-text-secondary mt-6 text-center text-sm">
          لديك حساب بالفعل؟{' '}
          <Link href="/login" className="text-brand font-semibold hover:underline">
            تسجيل الدخول
          </Link>
        </p>
      </Card>
    </>
  );
}
