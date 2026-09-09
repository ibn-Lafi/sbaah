import { z } from 'zod';
import { passwordSchema, saudiPhoneSchema } from './auth';

/** 6-digit TOTP code — RFC 6238 default, matches every mainstream authenticator app (Google Authenticator, Authy, 1Password, ...). */
export const totpCodeSchema = z.string().regex(/^\d{6}$/, 'رمز التحقق يجب أن يكون 6 أرقام');

/** Step 1 of console login (task 37/42) — password is the first factor; a successful result never carries a usable Supabase session, only a short-lived TOTP challenge (or setup) token. */
export const consoleLoginSchema = z.object({
  phone: saudiPhoneSchema,
  password: passwordSchema,
});
export type ConsoleLoginInput = z.infer<typeof consoleLoginSchema>;

/** Step 2 (already has 2FA set up) — exchanges the challenge token + a real TOTP code for an actual session. */
export const consoleVerifyTotpSchema = z.object({
  challenge_token: z.string().min(1),
  code: totpCodeSchema,
});
export type ConsoleVerifyTotpInput = z.infer<typeof consoleVerifyTotpSchema>;

/** First-ever login (2FA not set up yet) — asks the server to generate a new secret. */
export const consoleSetupTotpSchema = z.object({
  challenge_token: z.string().min(1),
});
export type ConsoleSetupTotpInput = z.infer<typeof consoleSetupTotpSchema>;

/** Confirms the freshly-generated secret with one real code from the admin's authenticator app before it's persisted — a secret is never saved unconfirmed. */
export const consoleConfirmTotpSchema = z.object({
  setup_token: z.string().min(1),
  code: totpCodeSchema,
});
export type ConsoleConfirmTotpInput = z.infer<typeof consoleConfirmTotpSchema>;
