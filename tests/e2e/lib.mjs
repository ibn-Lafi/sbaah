import fs from 'node:fs';
import pg from 'pg';
import { ANON_KEY } from './jwt.mjs';

export const API = process.env.E2E_API_URL ?? 'http://127.0.0.1:3001/v1';
export const SUPABASE = `http://127.0.0.1:${process.env.E2E_SUPABASE_PORT ?? 54321}`;
export const OUTBOX = process.env.E2E_OUTBOX ?? new URL('./.cache/outbox.jsonl', import.meta.url).pathname;
// Connection comes from the standard PG* environment variables.
export const db = new pg.Pool();

// Fixtures from supabase/tests/seed.sql.
export const PHONES = {
  ownerA: '+966500000001', adminA: '+966500000002', agentOne: '+966500000003', agentTwo: '+966500000004',
  disabledA: '+966500000005', ownerB: '+966500000011',
};
export const PASSWORD = 'Passw0rd!';

export async function api(method, route, { token, body, headers = {} } = {}) {
  const response = await fetch(`${API}${route}`, {
    method,
    headers: {
      ...(body !== undefined ? { 'content-type': 'application/json' } : {}),
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await response.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  return { status: response.status, body: json };
}

/** Same call dashboard makes for phone+password login: straight to Supabase Auth. */
export async function passwordLogin(phone, password = PASSWORD) {
  const response = await fetch(`${SUPABASE}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}` },
    body: JSON.stringify({ phone, password }),
  });
  return { status: response.status, body: await response.json() };
}

export async function tokenFor(phone) {
  const login = await passwordLogin(phone);
  if (login.status !== 200) throw new Error(`login failed for ${phone}: ${JSON.stringify(login.body)}`);
  return login.body.access_token;
}

/** Last OTP/email the API "sent" to `to` (recorded by mock-providers.cjs). */
export function lastDelivered(to) {
  if (!fs.existsSync(OUTBOX)) return null;
  const entries = fs.readFileSync(OUTBOX, 'utf8').trim().split('\n').filter(Boolean).map((line) => JSON.parse(line));
  return entries.reverse().find((entry) => entry.to === to) ?? null;
}

export async function resetOtpState() {
  await db.query('delete from otp_verifications');
}
