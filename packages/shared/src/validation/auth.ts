import { z } from 'zod';
import { OTP_PURPOSES } from '../types/enums';
import { tenantRegistrationSchema } from './tenant';

/**
 * Saudi mobile numbers only, E.164 format (e.g. +966501234567).
 * PRODUCT_SPEC section 2: phone is the sole login identifier.
 */
export const saudiPhoneSchema = z
  .string()
  .regex(/^\+9665\d{8}$/, 'رقم جوال سعودي غير صحيح (مثال: +966501234567)');

/** 4-digit OTP, per PRODUCT_SPEC section 2. */
export const otpCodeSchema = z.string().regex(/^\d{4}$/, 'رمز التحقق يجب أن يكون 4 أرقام');

/** Minimum 8 characters, per PRODUCT_SPEC section 10. */
export const passwordSchema = z
  .string()
  .min(8, 'كلمة المرور يجب أن تكون 8 خانات على الأقل');

/** Optional secondary identifier (settings, team invites, email-OTP) — always normalized the same way wherever it's collected. */
export const emailSchema = z.string().trim().toLowerCase().email('بريد إلكتروني غير صحيح');

/** docs/OTP_FLOW.md: which of the three OTP-driven flows this request belongs to. */
export const otpPurposeSchema = z.enum(OTP_PURPOSES);

/**
 * `sms` (default, via Authentica) is the original and only channel for
 * every purpose including 'register'. `email` is newer, self-verified
 * (no Authentica involved — see migration 0042), and only valid for
 * 'login'/'reset_password': there is deliberately no email-based account
 * creation, phone stays the sole registration identifier.
 */
export const otpChannelSchema = z.enum(['sms', 'email']);
export type OtpChannel = z.infer<typeof otpChannelSchema>;

/** `phone`/`channel` stay optional so every existing `{phone, purpose}` caller keeps working unchanged. */
export const requestOtpSchema = z
  .object({
    channel: otpChannelSchema.default('sms'),
    phone: saudiPhoneSchema.optional(),
    email: emailSchema.optional(),
    purpose: otpPurposeSchema,
  })
  .refine((v) => (v.channel === 'sms' ? !!v.phone : !!v.email), {
    message: 'رقم الجوال أو البريد الإلكتروني مطلوب بحسب قناة الإرسال',
  });
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z
  .object({
    channel: otpChannelSchema.default('sms'),
    phone: saudiPhoneSchema.optional(),
    email: emailSchema.optional(),
    code: otpCodeSchema,
    purpose: otpPurposeSchema,
  })
  .refine((v) => (v.channel === 'sms' ? !!v.phone : !!v.email), {
    message: 'رقم الجوال أو البريد الإلكتروني مطلوب بحسب قناة الإرسال',
  });
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

/**
 * PATCH /v1/auth/me — "حسابي" own-profile email. Nullable so a user can
 * clear it back out (email stays optional contact info, not mandatory);
 * omitting the field entirely leaves the current value untouched.
 */
export const updateMyEmailSchema = z.object({
  email: emailSchema.nullable(),
});
export type UpdateMyEmailInput = z.infer<typeof updateMyEmailSchema>;

export const loginWithPasswordSchema = z.object({
  phone: saudiPhoneSchema,
  password: passwordSchema,
});
export type LoginWithPasswordInput = z.infer<typeof loginWithPasswordSchema>;

/**
 * docs/OTP_FLOW.md section 5d: `reset_token` is the short-lived token
 * issued by `POST /v1/auth/otp/verify` on a successful reset_password
 * verification — it already carries the phone number, so it isn't
 * repeated here.
 */
export const resetPasswordSchema = z.object({
  reset_token: z.string().min(1),
  new_password: passwordSchema,
});
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

/**
 * docs/OTP_FLOW.md section 5a step 5: `registration_token` is the
 * short-lived token from a successful `purpose: 'register'` OTP verify —
 * it already carries the phone number, so it isn't repeated here.
 */
export const registerSchema = z.object({
  registration_token: z.string().min(1),
  password: passwordSchema,
  account: tenantRegistrationSchema,
  /** Chosen at registration step 6 (اختر باقة وادفع) — no more silent default-to-Basic. */
  plan_id: z.string().uuid('يجب اختيار باقة'),
});
export type RegisterInput = z.infer<typeof registerSchema>;
