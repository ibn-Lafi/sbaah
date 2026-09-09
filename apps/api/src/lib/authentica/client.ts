/**
 * Thin wrapper over Authentica's OTP API (docs/OTP_FLOW.md section 2).
 * `fetchImpl` is injectable so the request-building logic can be tested
 * without a real network call or Authentica credentials.
 *
 * Unlike Twilio Verify, Authentica does not own the OTP code's lifecycle:
 * `/send-otp` takes the code as a request field (we generate it —
 * `../otp/generate-code`) and only delivers + stores it so the matching
 * `/verify-otp` call can check what the customer typed against it.
 */

const AUTHENTICA_BASE_URL = 'https://api.authentica.sa/api/v2';

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function buildHeaders(): Record<string, string> {
  return {
    'X-Authorization': requireEnv('AUTHENTICA_API_KEY'),
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
}

export async function sendOtpSms(phone: string, otp: string, fetchImpl: typeof fetch = fetch): Promise<void> {
  const body: Record<string, string | number> = { method: 'sms', phone, otp };
  // Optional — a custom SMS template configured in the Authentica portal.
  // Omitted entirely when unset, since Authentica's default sender-name
  // template applies automatically in that case (their docs, section 2).
  const templateId = process.env.AUTHENTICA_OTP_TEMPLATE_ID;
  if (templateId) {
    body.template_id = Number(templateId);
  }

  const response = await fetchImpl(`${AUTHENTICA_BASE_URL}/send-otp`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`Authentica send-otp failed: HTTP ${response.status}`);
  }
}

/**
 * Returns whether the code was accepted. Authentica's documented success
 * shape is `{ status: true, message }` on HTTP 200; the documented error
 * examples only cover HTTP 401 (bad API key), not a wrong-code case, so
 * both a non-2xx response and a 200 with `status !== true` are treated as
 * "not verified" — whichever convention they actually use for a wrong
 * code, this covers it.
 */
export async function verifyOtpSms(phone: string, otp: string, fetchImpl: typeof fetch = fetch): Promise<boolean> {
  const response = await fetchImpl(`${AUTHENTICA_BASE_URL}/verify-otp`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({ phone, otp }),
  });

  if (!response.ok) {
    return false;
  }

  const data = (await response.json()) as { status?: boolean };
  return data.status === true;
}
