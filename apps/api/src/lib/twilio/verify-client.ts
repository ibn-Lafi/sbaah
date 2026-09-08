/**
 * Thin wrapper over Twilio Verify's REST API (docs/OTP_FLOW.md section 2).
 * `fetchImpl` is injectable so the request-building logic can be tested
 * without a real network call or Twilio credentials.
 */

const VERIFY_BASE_URL = 'https://verify.twilio.com/v2';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildAuthHeader(): string {
  const accountSid = requireEnv('TWILIO_ACCOUNT_SID');
  const authToken = requireEnv('TWILIO_AUTH_TOKEN');
  const encoded = Buffer.from(`${accountSid}:${authToken}`).toString('base64');
  return `Basic ${encoded}`;
}

export interface SendVerificationResult {
  sid: string;
  status: string;
}

export interface CheckVerificationResult {
  status: string;
}

export async function sendVerification(
  phone: string,
  fetchImpl: typeof fetch = fetch,
): Promise<SendVerificationResult> {
  const serviceSid = requireEnv('TWILIO_VERIFY_SERVICE_SID');
  const response = await fetchImpl(`${VERIFY_BASE_URL}/Services/${serviceSid}/Verifications`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: phone, Channel: 'sms' }),
  });

  if (!response.ok) {
    throw new Error(`Twilio Verify send failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as { sid: string; status: string };
  return { sid: data.sid, status: data.status };
}

export async function checkVerification(
  phone: string,
  code: string,
  fetchImpl: typeof fetch = fetch,
): Promise<CheckVerificationResult> {
  const serviceSid = requireEnv('TWILIO_VERIFY_SERVICE_SID');
  const response = await fetchImpl(`${VERIFY_BASE_URL}/Services/${serviceSid}/VerificationCheck`, {
    method: 'POST',
    headers: {
      Authorization: buildAuthHeader(),
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ To: phone, Code: code }),
  });

  if (!response.ok) {
    throw new Error(`Twilio Verify check failed: HTTP ${response.status}`);
  }

  const data = (await response.json()) as { status: string };
  return { status: data.status };
}
