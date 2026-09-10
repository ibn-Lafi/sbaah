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

/** docs/OTP_FLOW.md: which of the three OTP-driven flows this request belongs to. */
export const otpPurposeSchema = z.enum(OTP_PURPOSES);

export const requestOtpSchema = z.object({
  phone: saudiPhoneSchema,
  purpose: otpPurposeSchema,
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: saudiPhoneSchema,
  code: otpCodeSchema,
  purpose: otpPurposeSchema,
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

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
