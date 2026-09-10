'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  otpCodeSchema,
  passwordSchema,
  saudiPhoneSchema,
  tenantRegistrationSchema,
  REGISTRATION_OPEN,
  type AccountType,
  type Plan,
  type TenantRegistrationInput,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { OtpInput } from '@/components/ui/otp-input';
import { FormError } from '@/components/ui/form-error';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';
import { ProvisioningOverlay } from '@/components/auth/provisioning-overlay';
import { register, sendOtp, verifyRegisterOtp } from '@/lib/api/auth';
import { startCheckout } from '@/lib/api/billing';
import { listPlans } from '@/lib/api/reference-data';
import { ApiRequestError } from '@/lib/api/client';
import { adoptSession } from '@/lib/auth/session';
import { useResendCooldown } from '@/lib/auth/use-resend-cooldown';

const STEPS = ['phone', 'otp', 'password', 'account_type', 'details', 'plan'] as const;
type Step = (typeof STEPS)[number];

const STEP_TITLES: Record<Step, string> = {
  phone: 'رقم الجوال',
  otp: 'رمز التحقق',
  password: 'تعيين كلمة المرور',
  account_type: 'ما نوع حسابك؟',
  details: 'بيانات الحساب',
  plan: 'اختر باقتك',
};

const ACCOUNT_TYPE_OPTIONS: { type: AccountType; label: string; description: string }[] = [
  { type: 'individual', label: 'فرد', description: 'وسيط مستقل يعمل باسمه برخصة فال' },
  { type: 'institution', label: 'مؤسسة', description: 'مؤسسة فردية لها سجل تجاري ورقم ضريبي' },
  { type: 'company', label: 'شركة', description: 'شركة عقارية بفريق ووسطاء متعددين' },
];

function introMonthsLabel(months: number): string {
  if (months === 1) return 'أول شهر';
  if (months === 2) return 'أول شهرين';
  return `أول ${months} أشهر`;
}

function planPriceLabel(plan: Plan): string {
  const cycleLabel = plan.billing_cycle === 'annual' ? 'سنويًا' : 'شهريًا';
  if (plan.intro_price != null && plan.intro_months != null) {
    return `${plan.intro_price} ر.س/${cycleLabel} لـ${introMonthsLabel(plan.intro_months)}، ثم ${plan.price} ر.س/${cycleLabel}`;
  }
  return `${plan.price} ر.س/${cycleLabel}`;
}

/** التسجيل متوقف مؤقتًا (packages/shared/src/config.ts) ريثما تُبنى خطوة اختيار الباقة والدفع عبر StreamPay. */
function RegistrationClosedNotice() {
  return (
    <Card className="p-8">
      <h1 className="text-text-primary mb-2 text-2xl font-bold">التسجيل متوقف مؤقتًا</h1>
      <p className="text-text-secondary text-sm">
        نعمل حاليًا على تحديث خطوات إنشاء الحساب، وسنعيد فتح التسجيل قريبًا. لديك حساب بالفعل؟{' '}
        <Link href="/login" className="text-brand font-semibold hover:underline">
          تسجيل الدخول
        </Link>
        .
      </p>
    </Card>
  );
}

/**
 * docs/OTP_FLOW.md section 5a, extended per the founder's mockup: 6 steps
 * — phone, OTP, password (own step, confirm field + strength meter),
 * account type (its own step, 3 badge cards matching the mockup — not a
 * segmented control buried in "تفاصيل الحساب" anymore), account details,
 * then plan + StreamPay payment. Only the last step actually creates the
 * account and starts checkout (`register()` + `startCheckout()`) — every
 * earlier step is presentational/validation only.
 */
export default function RegisterPage() {
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

  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 'plan' || plans !== null) return;
    void listPlans().then((loaded) => {
      setPlans(loaded);
      setSelectedPlanId((current) => current ?? loaded[0]?.id ?? null);
    });
  }, [step, plans]);

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
    setStep('account_type');
  }

  function handleSubmitAccountType(event: FormEvent) {
    event.preventDefault();
    setStep('details');
  }

  function handleSubmitDetails(event: FormEvent) {
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
    setStep('plan');
  }

  async function handleSubmitPlan(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!selectedPlanId) {
      setError('اختر باقة للمتابعة');
      return;
    }

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

    setLoading(true);
    setProvisioning(true);
    try {
      const { access_token, refresh_token } = await register({
        registration_token: registrationToken,
        password,
        account,
        plan_id: selectedPlanId,
      });
      await adoptSession(access_token, refresh_token);
      const { checkout_url } = await startCheckout(access_token);
      setProvisioningDone(true);
      window.location.href = checkout_url;
    } catch (err) {
      setProvisioning(false);
      setError(err instanceof ApiRequestError ? err.message : 'تعذّر إنشاء الحساب، حاول مرة أخرى');
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
          {step === 'account_type' && 'يحدّد النوع الحقول المطلوبة وشكل صفحة "من نحن" في موقعك'}
          {step === 'details' && 'أكمل بيانات الحساب'}
          {step === 'plan' && 'الدفع مطلوب لتفعيل حسابك بالكامل'}
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

        {step === 'account_type' && (
          <form onSubmit={handleSubmitAccountType} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {ACCOUNT_TYPE_OPTIONS.map(({ type, label, description }) => {
                const selected = accountType === type;
                return (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setAccountType(type)}
                    className={`rounded-input flex items-center gap-4 border p-4 text-start transition-colors ${
                      selected
                        ? 'border-brand ring-brand ring-1'
                        : 'border-border-default hover:border-text-placeholder'
                    }`}
                  >
                    <VerifiedBadge accountType={type} size={40} />
                    <div className="flex flex-1 flex-col gap-0.5">
                      <span className="text-text-primary text-sm font-semibold">{label}</span>
                      <span className="text-text-secondary text-xs">{description}</span>
                    </div>
                  </button>
                );
              })}
            </div>
            <FormError message={error} />
            <Button type="submit">متابعة</Button>
          </form>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmitDetails} className="flex flex-col gap-4">
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
            <Button type="submit">متابعة</Button>
          </form>
        )}

        {step === 'plan' && (
          <form onSubmit={handleSubmitPlan} className="flex flex-col gap-4">
            {plans === null ? (
              <LoadingState className="py-6" />
            ) : (
              <div className="flex flex-col gap-3">
                {plans.map((plan) => {
                  const selected = selectedPlanId === plan.id;
                  return (
                    <button
                      key={plan.id}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`rounded-input flex flex-col gap-1 border p-4 text-start transition-colors ${
                        selected
                          ? 'border-brand ring-brand ring-1'
                          : 'border-border-default hover:border-text-placeholder'
                      }`}
                    >
                      <span className="text-text-primary text-sm font-semibold">
                        {plan.name_ar} — {plan.billing_cycle === 'annual' ? 'سنوي' : 'شهري'}
                      </span>
                      <span className="text-brand text-sm" dir="ltr">
                        {planPriceLabel(plan)}
                      </span>
                      <span className="text-text-secondary text-xs">
                        حتى {plan.max_properties} عقار · {plan.max_users} مستخدم
                        {plan.custom_domain_allowed ? ' · دومين مخصص' : ''}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
            <FormError message={error} />
            <Button type="submit" loading={loading}>
              {loading ? 'جارٍ التجهيز...' : 'الدفع والاشتراك'}
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
