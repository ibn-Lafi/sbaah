import { z } from 'zod';
import { passwordSchema } from './auth';

/**
 * `console` login (task 37/42, revised) — email + password only, no
 * second factor. Originally mandatory TOTP; the founder explicitly asked
 * to drop it after being told the tradeoff (console is the
 * highest-value target in the system). A success here mints a real
 * session directly.
 */
export const consoleLoginSchema = z.object({
  email: z.string().email('بريد إلكتروني غير صالح'),
  password: passwordSchema,
});
export type ConsoleLoginInput = z.infer<typeof consoleLoginSchema>;
