import { authenticator } from 'otplib';

/** Standard RFC 6238 TOTP (30s step, 6 digits, SHA1) via `otplib` — every mainstream authenticator app (Google Authenticator, Authy, 1Password, ...) speaks this without configuration. */
export function generateTotpSecret(): string {
  return authenticator.generateSecret();
}

export function verifyTotpCode(code: string, secret: string): boolean {
  return authenticator.verify({ token: code, secret });
}

/** `otpauth://` URI — lets a QR-code renderer (not built yet, task 37/42 shows the secret as manual-entry text instead) turn this into a scannable code later without any change here. */
export function buildTotpUri(secret: string, accountLabel: string): string {
  return authenticator.keyuri(accountLabel, 'سبعة Console', secret);
}
