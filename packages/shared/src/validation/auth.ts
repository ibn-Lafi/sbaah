import { z } from 'zod';

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

export const requestOtpSchema = z.object({
  phone: saudiPhoneSchema,
});
export type RequestOtpInput = z.infer<typeof requestOtpSchema>;

export const verifyOtpSchema = z.object({
  phone: saudiPhoneSchema,
  code: otpCodeSchema,
});
export type VerifyOtpInput = z.infer<typeof verifyOtpSchema>;

export const setPasswordSchema = z.object({
  phone: saudiPhoneSchema,
  password: passwordSchema,
});
export type SetPasswordInput = z.infer<typeof setPasswordSchema>;

export const loginWithPasswordSchema = z.object({
  phone: saudiPhoneSchema,
  password: passwordSchema,
});
export type LoginWithPasswordInput = z.infer<typeof loginWithPasswordSchema>;
