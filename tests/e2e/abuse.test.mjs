import { test, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { api, db, tokenFor, PHONES } from './lib.mjs';

beforeEach(async () => {
  await db.query('delete from api_rate_limit_events');
  await db.query('delete from console_login_attempts');
});

test('OTP sends are limited per client IP, and a spoofed X-Forwarded-For prefix does not reset the budget', async () => {
  const statuses = [];
  for (let index = 0; index < 12; index += 1) {
    const phone = `+9665800000${String(index).padStart(2, '0')}`;
    const result = await api('POST', '/auth/otp/send', {
      body: { channel: 'sms', phone, purpose: 'register' },
      headers: { 'x-forwarded-for': `10.0.0.${index}, 203.0.113.7` },
    });
    statuses.push(result.status);
  }
  assert.deepEqual(statuses.slice(0, 10), Array(10).fill(200), JSON.stringify(statuses));
  assert.deepEqual(statuses.slice(10), [429, 429]);

  const otherClient = await api('POST', '/auth/otp/send', {
    body: { channel: 'sms', phone: '+966580000099', purpose: 'register' },
    headers: { 'x-forwarded-for': '203.0.113.8' },
  });
  assert.equal(otherClient.status, 200);
});

test('console login lockout cannot be bypassed with parallel guesses', async () => {
  const guesses = await Promise.all(
    Array.from({ length: 20 }, (_, index) =>
      api('POST', '/console-auth/login', {
        body: { email: 'root@sbaah.test', password: `wrong-password-${index}` },
        headers: { 'x-forwarded-for': `198.51.100.${index}` },
      }),
    ),
  );
  const evaluated = guesses.filter((result) => result.status === 401).length;
  assert.ok(evaluated <= 5, `at most 5 guesses evaluated, got ${evaluated}: ${guesses.map((r) => r.status)}`);
  const { rows } = await db.query("select attempt_count, locked_until is not null as locked from console_login_attempts where email = 'root@sbaah.test'");
  assert.equal(rows[0].locked, true);
});

test('public support tickets are rate limited and tracking needs the exact email', async () => {
  const headers = { 'x-forwarded-for': '192.0.2.44' };
  const body = { requester_name: 'زائر', requester_email: 'visitor_1@example.com', type: 'support', category: 'other', subject: 'استفسار', description: 'وصف طويل بما يكفي للطلب' };
  const created = await api('POST', '/public/support/tickets', { body, headers });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const number = created.body.ticket.ticket_number;

  const wildcard = await api('GET', `/public/support/tickets?ticket_number=${number}&requester_email=${encodeURIComponent('visitor11@example.com')}`, { headers });
  assert.equal(wildcard.status, 404, 'underscore must not act as a wildcard');
  const exact = await api('GET', `/public/support/tickets?ticket_number=${number}&requester_email=${encodeURIComponent('VISITOR_1@example.com')}`, { headers });
  assert.equal(exact.status, 200);

  for (let index = 0; index < 4; index += 1) await api('POST', '/public/support/tickets', { body, headers });
  const limited = await api('POST', '/public/support/tickets', { body, headers });
  assert.equal(limited.status, 429);
});

test('an admin can save contact links (incl. Facebook/X/Telegram) and they reach the public site data', async () => {
  const token = await tokenFor(PHONES.adminA);
  const saved = await api('PATCH', '/tenant/social-links', {
    token,
    body: { social_instagram: 'https://instagram.com/agency', social_facebook: 'https://facebook.com/agency', social_x: 'https://x.com/agency', social_telegram: 'https://t.me/agency' },
  });
  assert.equal(saved.status, 200, JSON.stringify(saved.body));
  assert.equal(saved.body.social_facebook, 'https://facebook.com/agency');
  const read = await api('GET', '/tenant/social-links', { token });
  assert.equal(read.body.social_telegram, 'https://t.me/agency');

  const agent = await api('PATCH', '/tenant/social-links', { token: await tokenFor(PHONES.agentOne), body: { social_x: 'https://x.com/evil' } });
  assert.equal(agent.status, 403);

  const site = await api('GET', '/public/website?domain=agency-a.sbaah.test');
  assert.equal(site.status, 200, JSON.stringify(site.body));
  assert.equal(site.body.tenant.social_x, 'https://x.com/agency');
});
