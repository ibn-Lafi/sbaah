import { getSndrClient } from '@/lib/sndr/client';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export interface EmailMessage {
  to: string;
  subject: string;
  html: string;
}

/**
 * The single call site every notification email goes through (team
 * invites, OTP-by-email codes, new-lead-assigned alerts, and future
 * user-type notifications — see `./templates.ts`) — callers never touch
 * `getSndrClient()` or `SNDR_FROM_EMAIL` directly, so the "from" address
 * and the SDK shape only live in one place.
 */
export async function sendEmail(message: EmailMessage): Promise<void> {
  const sndr = getSndrClient();
  const from = requireEnv('SNDR_FROM_EMAIL');
  await sndr.emails.send({ from, to: message.to, subject: message.subject, html: message.html });
}
