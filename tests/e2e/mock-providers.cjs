// Preloaded into the API process (NODE_OPTIONS=--require) by run.sh:
// answers fetch calls to external providers (Authentica, SNDR, Turnstile,
// Cloudflare, Google, Nominatim) so OTP/email/captcha/domain flows run
// without credentials.
// Delivered codes are appended to the outbox file for the tests to read.
const fs = require('node:fs');
const path = require('node:path');

const OUTBOX = process.env.E2E_OUTBOX ?? path.join(__dirname, '.cache', 'outbox.jsonl');
const realFetch = globalThis.fetch;
const smsCodes = new Map();

function record(entry) {
  fs.appendFileSync(OUTBOX, `${JSON.stringify({ at: new Date().toISOString(), ...entry })}\n`);
}
const json = (status, body) =>
  new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

globalThis.fetch = async function mockedFetch(input, init = {}) {
  const url = new URL(typeof input === 'string' ? input : input.url ?? String(input));
  const bodyText = typeof init.body === 'string' ? init.body : '';

  if (url.hostname === 'api.authentica.sa') {
    const body = JSON.parse(bodyText || '{}');
    if (url.pathname.endsWith('/send-otp')) {
      if (process.env.E2E_AUTHENTICA_FAIL === '1') return json(503, { status: false });
      smsCodes.set(body.phone, body.otp);
      record({ kind: 'sms', to: body.phone, code: body.otp });
      return json(200, { status: true });
    }
    if (url.pathname.endsWith('/verify-otp')) {
      // Simulates provider latency so concurrent-verify races are observable.
      await new Promise((resolve) => setTimeout(resolve, 150));
      return json(200, { status: smsCodes.get(body.phone) === body.otp });
    }
  }
  if (url.hostname === 'api.sndr.sh') {
    const body = JSON.parse(bodyText || '{}');
    const code = /(\d{4})/.exec(body.subject ?? '')?.[1] ?? null;
    record({ kind: 'email', to: Array.isArray(body.to) ? body.to[0] : body.to, subject: body.subject, code, html: body.html });
    return json(200, { id: `email_${Date.now()}`, status: 'queued' });
  }
  if (url.hostname === 'challenges.cloudflare.com') {
    const token = new URLSearchParams(bodyText).get('response');
    return json(200, { success: token === 'e2e-pass' });
  }
  if (url.hostname === 'api.cloudflare.com') {
    const hostnameId = /\/custom_hostnames\/([^/]+)$/.exec(url.pathname)?.[1];
    if (init.method === 'POST') {
      const { hostname } = JSON.parse(bodyText || '{}');
      return json(200, {
        success: true,
        result: { id: `cf_${hostname}`, ownership_verification: { name: `_cf-custom-hostname.${hostname}`, value: 'e2e-ownership' } },
      });
    }
    if (init.method === 'DELETE') return json(200, { success: true, result: { id: hostnameId } });
    return json(200, {
      success: true,
      result: { status: 'active', ssl: { status: 'active', validation_records: [{ txt_name: '_acme-challenge.e2e', txt_value: 'e2e-ssl' }] } },
    });
  }
  if (url.hostname.endsWith('googleapis.com') || url.hostname === 'accounts.google.com') {
    return json(503, { error: 'google disabled in e2e' });
  }
  if (url.hostname === 'nominatim.openstreetmap.org') return json(200, []);
  return realFetch(input, init);
};
