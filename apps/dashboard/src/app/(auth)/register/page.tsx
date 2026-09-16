'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import {
  emailSchema,
  otpCodeSchema,
  passwordSchema,
  saudiPhoneSchema,
  REGISTRATION_OPEN,
  groupPlansByTier,
  planForCycle,
  type AccountType,
  type BillingCycle,
  type Plan,
  type PlanTier,
} from '@sbaah/shared';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { PasswordInput } from '@/components/ui/password-input';
import { PhoneInput } from '@/components/ui/phone-input';
import { OtpInput } from '@/components/ui/otp-input';
import { FormError } from '@/components/ui/form-error';
import { VerifiedBadge } from '@/components/ui/verified-badge';
import { LoadingState } from '@/components/ui/loading-state';
import { PasswordStrengthMeter } from '@/components/auth/password-strength-meter';
import { ProvisioningOverlay } from '@/components/auth/provisioning-overlay';
import { RegistrationStepper } from '@/components/auth/registration-stepper';
import { PlanCycleToggle } from '@/components/billing/plan-cycle-toggle';
import { PlanCard } from '@/components/billing/plan-card';
import { register, sendOtp, verifyRegisterOtp } from '@/lib/api/auth';
import { startCheckout } from '@/lib/api/billing';
import { listPlans, getTrialPlan } from '@/lib/api/reference-data';
import { ApiRequestError } from '@/lib/api/client';
import { adoptSession } from '@/lib/auth/session';
import { useResendCooldown } from '@/lib/auth/use-resend-cooldown';
import { useLocale } from '@/lib/i18n/locale-context';
import type { PageDictionaries } from '@/lib/i18n/page-dictionaries';

const STEPS = ['phone', 'otp', 'account', 'account_type', 'plan'] as const;
type Step = (typeof STEPS)[number];

const ACCOUNT_TYPES: AccountType[] = ['individual', 'institution', 'company'];

/** التسجيل متوقف مؤقتًا (packages/shared/src/config.ts) ريثما تُبنى خطوة اختيار الباقة والدفع عبر StreamPay. */
function RegistrationClosedNotice({ t }: { t: PageDictionaries['auth'] }) {
  return (
    <Card className="p-8">
      <h1 className="text-text-primary mb-2 text-2xl font-bold">{t.register.closedNotice.title}</h1>
      <p className="text-text-secondary text-sm">
        {t.register.closedNotice.body}{' '}
        <Link href="/login" className="text-brand font-semibold hover:underline">
          {t.shared.signIn}
        </Link>
        .
      </p>
    </Card>
  );
}

/**
 * docs/OTP_FLOW.md section 5a, ثم أعيد تصميمها (migration 0047): 5 خطوات
 * — هاتف، OTP، بيانات الحساب (اسم + بريد + كلمة مرور بخطوة واحدة)، نوع
 * الحساب (اختيار مجرّد، بلا حقول إضافية — بيانات الشركة/المؤسسة انتقلت
 * كاملة لحسابي بعد التسجيل)، ثم الباقة (تتضمن خيار التجربة المجانية إن
 * كانت مفعّلة من console). فقط الخطوة الأخيرة تُنشئ الحساب فعليًا
 * (register() + إما دخول مباشر للتجربة المجانية أو startCheckout()).
 */
export default function RegisterPage() {
  const { pages } = useLocale();
  const t = pages.auth;
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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');

  const [tiers, setTiers] = useState<PlanTier[] | null>(null);
  const [trialPlan, setTrialPlan] = useState<Plan | null | undefined>(undefined);
  const [cycle, setCycle] = useState<BillingCycle>('annual');
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);

  useEffect(() => {
    if (step !== 'plan' || tiers !== null) return;
    void Promise.all([listPlans(), getTrialPlan()]).then(([loaded, trial]) => {
      const grouped = groupPlansByTier(loaded);
      setTiers(grouped);
      setTrialPlan(trial);
      setSelectedPlanId((current) => current ?? trial?.id ?? (grouped[0] ? planForCycle(grouped[0], cycle).id : null));
    });
    // Intentionally excludes `cycle` — this only sets the *initial*
    // selection once tiers are fetched, it shouldn't re-run every time
    // the toggle changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, tiers]);

  /** Keeps the same tier selected across a cycle switch (rather than leaving `selectedPlanId` pointing at a now-hidden card, which would submit a plan no longer shown as chosen). Never touches the trial selection — it has no cycle. */
  function handleCycleChange(newCycle: BillingCycle) {
    setCycle(newCycle);
    if (trialPlan && selectedPlanId === trialPlan.id) return;
    const currentTier = tiers?.find((tier) => tier.monthly?.id === selectedPlanId || tier.annual?.id === selectedPlanId);
    if (currentTier) {
      setSelectedPlanId(planForCycle(currentTier, newCycle).id);
    }
  }

  async function handleSendOtp(event: FormEvent) {
    event.preventDefault();
    setError(null);

    const phoneCheck = saudiPhoneSchema.safeParse(phone);
    if (!phoneCheck.success) {
      setError(phoneCheck.error.issues[0]?.message ?? t.shared.invalidPhoneFallback);
      return;
    }

    setLoading(true);
    try {
      await sendOtp(phone, 'register');
      setStep('otp');
      resend.start();
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.shared.otpSendFailedFallback);
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
      setError(err instanceof ApiRequestError ? err.message : t.shared.otpSendFailedFallback);
    } finally {
      setLoading(false);
    }
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
      const { registration_token } = await verifyRegisterOtp(phone, code);
      setRegistrationToken(registration_token);
      setStep('account');
    } catch (err) {
      setError(err instanceof ApiRequestError ? err.message : t.shared.otpVerifyFailedFallback);
    } finally {
      setLoading(false);
    }
  }

  function handleSubmitAccount(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (fullName.trim().length < 3) {
      setError(t.register.fullNameRequired);
      return;
    }
    const emailCheck = emailSchema.safeParse(email);
    if (!emailCheck.success) {
      setError(emailCheck.error.issues[0]?.message ?? t.shared.invalidEmailFallback);
      return;
    }
    const passwordCheck = passwordSchema.safeParse(password);
    if (!passwordCheck.success) {
      setError(passwordCheck.error.issues[0]?.message ?? t.shared.invalidPasswordFallback);
      return;
    }
    if (password !== passwordConfirm) {
      setError(t.register.passwordMismatch);
      return;
    }
    setStep('account_type');
  }

  function handleSubmitAccountType(event: FormEvent) {
    event.preventDefault();
    setStep('plan');
  }

  async function handleSubmitPlan(event: FormEvent) {
    event.preventDefault();
    setError(null);

    if (!selectedPlanId) {
      setError(t.register.selectPlanRequired);
      return;
    }

    setLoading(true);
    setProvisioning(true);
    try {
      const { access_token, refresh_token, is_trial } = await register({
        registration_token: registrationToken,
        full_name: fullName,
        email,
        password,
        account_type: accountType,
        plan_id: selectedPlanId,
      });
      await adoptSession(access_token, refresh_token);
      if (is_trial) {
        setProvisioningDone(true);
        window.location.href = '/';
        return;
      }
      const { checkout_url } = await startCheckout(access_token);
      setProvisioningDone(true);
      window.location.href = checkout_url;
    } catch (err) {
      setProvisioning(false);
      setError(err instanceof ApiRequestError ? err.message : t.register.registrationFailedFallback);
    } finally {
      setLoading(false);
    }
  }

  const stepIndex = STEPS.indexOf(step);

  if (!REGISTRATION_OPEN) {
    return <RegistrationClosedNotice t={t} />;
  }

  return (
    <>
      <ProvisioningOverlay active={provisioning} done={provisioningDone} />
      <Card className="p-8">
        <RegistrationStepper labels={STEPS.map((s) => t.register.stepperLabels[s])} currentIndex={stepIndex} />
        <h1 className="text-text-primary mb-1 text-2xl font-bold">
          {step === 'phone' || step === 'otp' ? t.register.createAccountHeading : t.register.stepTitles[step]}
        </h1>
        <p className="text-text-secondary mb-6 text-sm">
          {step === 'phone' && t.register.phoneSubtitle}
          {step === 'otp' && t.shared.otpSentTo(phone)}
          {step === 'account' && t.register.accountSubtitle}
          {step === 'account_type' && t.register.accountTypeSubtitle}
          {step === 'plan' && t.register.planSubtitle}
        </p>

        {step === 'phone' && (
          <form onSubmit={handleSendOtp} className="flex flex-col gap-4">
            <PhoneInput placeholder="5xxxxxxxx" value={phone} onChange={setPhone} />
            <FormError message={error} />
            <Button type="submit" loading={loading}>
              {loading ? t.shared.sendingOtp : t.shared.sendOtp}
            </Button>
          </form>
        )}

        {step === 'otp' && (
          <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
            <OtpInput value={code} onChange={setCode} disabled={loading} />
            <FormError message={error} />
            <Button type="submit" loading={loading}>
              {loading ? t.shared.verifying : t.shared.verify}
            </Button>
            <button
              type="button"
              disabled={resend.secondsLeft > 0 || loading}
              onClick={() => void resendOtp()}
              className="text-brand disabled:text-text-placeholder text-sm hover:underline disabled:cursor-not-allowed"
            >
              {resend.secondsLeft > 0 ? t.shared.resendIn(resend.secondsLeft) : t.shared.resendCode}
            </button>
          </form>
        )}

        {step === 'account' && (
          <form onSubmit={handleSubmitAccount} className="flex flex-col gap-4">
            <Input
              placeholder={t.register.fullNamePlaceholder}
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
            />
            <Input
              type="email"
              placeholder={t.register.emailPlaceholder}
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              dir="ltr"
            />
            <div className="flex flex-col gap-2">
              <label className="text-text-primary text-sm font-medium">{t.register.passwordLabel}</label>
              <PasswordInput
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
              <PasswordStrengthMeter password={password} />
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-text-primary text-sm font-medium">{t.register.confirmPasswordLabel}</label>
              <PasswordInput
                placeholder="••••••••"
                value={passwordConfirm}
                onChange={(event) => setPasswordConfirm(event.target.value)}
              />
            </div>
            <FormError message={error} />
            <Button type="submit" disabled={loading}>
              {t.register.continueButton}
            </Button>
          </form>
        )}

        {step === 'account_type' && (
          <form onSubmit={handleSubmitAccountType} className="flex flex-col gap-4">
            <div className="flex flex-col gap-3">
              {ACCOUNT_TYPES.map((type) => {
                const selected = accountType === type;
                const { label, description } = t.register.accountTypes[type];
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
            <Button type="submit">{t.register.continueButton}</Button>
          </form>
        )}

        {step === 'plan' && (
          <form onSubmit={(e) => void handleSubmitPlan(e)} className="flex flex-col gap-4">
            {tiers === null ? (
              <LoadingState className="py-6" />
            ) : (
              <>
                {trialPlan && (
                  <PlanCard
                    plan={trialPlan}
                    isCurrent={false}
                    selected={selectedPlanId === trialPlan.id}
                    selecting={false}
                    selectDisabled={loading}
                    onSelect={() => setSelectedPlanId(trialPlan.id)}
                  />
                )}
                <PlanCycleToggle value={cycle} onChange={handleCycleChange} />
                <div className="flex flex-col gap-3">
                  {tiers.map((tier) => {
                    const plan = planForCycle(tier, cycle);
                    return (
                      <PlanCard
                        key={tier.key}
                        plan={plan}
                        monthlyEquivalent={tier.monthly}
                        isCurrent={false}
                        selected={selectedPlanId === plan.id}
                        selecting={false}
                        selectDisabled={loading}
                        showIntroPricing
                        onSelect={() => setSelectedPlanId(plan.id)}
                      />
                    );
                  })}
                </div>
              </>
            )}
            <FormError message={error} />
            <Button type="submit" loading={loading}>
              {loading
                ? t.register.preparingButton
                : trialPlan && selectedPlanId === trialPlan.id
                  ? t.register.startTrialButton
                  : t.register.payAndSubscribeButton}
            </Button>
          </form>
        )}

        <p className="text-text-secondary mt-6 text-center text-sm">
          {t.register.haveAccountPrompt}{' '}
          <Link href="/login" className="text-brand font-semibold hover:underline">
            {t.shared.signIn}
          </Link>
        </p>
      </Card>
    </>
  );
}
