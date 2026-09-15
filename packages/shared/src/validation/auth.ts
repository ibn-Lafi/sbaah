import { z } from 'zod';
import { OTP_PURPOSES, ACCOUNT_TYPES } from '../types/enums';

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
 * Which field identifies the account for a given request — `sms` means
 * `phone`, `email` means `email`. Originally OTP-only (`sms` default, via
 * Authentica, the original and only channel for every OTP purpose
 * including 'register'; `email` is newer, self-verified — no Authentica
 * involved, see migration 0042 — and only valid for 'login'/
 * 'reset_password': there is deliberately no email-based account
 * creation, phone stays the sole registration identifier), now reused by
 * `loginWithPasswordSchema` below too since it's the same "which
 * identifier did the caller send" concept either way.
 */
export const authChannelSchema = z.enum(['sms', 'email']);
export type AuthChannel = z.infer<typeof authChannelSchema>;

/** `phone`/`channel` stay optional so every existing `{phone, purpose}` caller keeps working unchanged. */
export const requestOtpSchema = z
  .object({
    channel: authChannelSchema.default('sms'),
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
    channel: authChannelSchema.default('sms'),
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

/**
 * Phone+password logs in directly against Supabase from the browser
 * (docs/OTP_FLOW.md section 5b) — this schema is only actually sent to
 * `api` for the email channel (POST /v1/auth/login), since Supabase Auth
 * has no real notion of the user's own email (its `auth.users.email` is
 * a synthetic, never-emailed address — see OTP_FLOW.md section 4), so
 * resolving email → phone has to happen server-side before the real
 * `signInWithPassword` call.
 */
export const loginWithPasswordSchema = z
  .object({
    channel: authChannelSchema.default('sms'),
    phone: saudiPhoneSchema.optional(),
    email: emailSchema.optional(),
    password: passwordSchema,
  })
  .refine((v) => (v.channel === 'sms' ? !!v.phone : !!v.email), {
    message: 'رقم الجوال أو البريد الإلكتروني مطلوب بحسب قناة الدخول',
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
 *
 * Migration 0047 redesign — flat shape, no more account_type-dependent
 * fields at registration: full_name/email/password (one unified step),
 * account_type on its own (just the pick, no extra fields), then plan_id.
 * فال license/CR/tax/entity-name move entirely to حسابي after signup.
 */
export const registerSchema = z.object({
  registration_token: z.string().min(1),
  full_name: z.string().min(3, 'الاسم الكريم مطلوب'),
  email: emailSchema,
  password: passwordSchema,
  account_type: z.enum(ACCOUNT_TYPES),
  /** Chosen at registration's last step — no more silent default-to-Basic. May be the one free-trial plan (migration 0047). */
  plan_id: z.string().uuid('يجب اختيار باقة'),
});
export type RegisterInput = z.infer<typeof registerSchema>;
