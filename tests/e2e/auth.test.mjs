import { test, before, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { api, db, passwordLogin, tokenFor, lastDelivered, resetOtpState, PHONES } from './lib.mjs';

before(resetOtpState);
beforeEach(() => db.query('delete from api_rate_limit_events'));

test('a disabled member (pre-existing, not banned) is refused by the API even with a valid Supabase session', async () => {
  const login = await passwordLogin(PHONES.disabledA);
  assert.equal(login.status, 200, 'seeded disabled user is not banned in Supabase yet');
  const me = await api('GET', '/auth/me', { token: login.body.access_token });
  assert.equal(me.status, 403);
  assert.equal(me.body.error.code, 'account_disabled');
  const leads = await api('GET', '/leads', { token: login.body.access_token });
  assert.equal(leads.status, 403);
});

test('disabling a member bans their Supabase login and revokes API access; re-enabling restores it', async () => {
  const adminToken = await tokenFor(PHONES.adminA);
  const agentToken = await tokenFor(PHONES.agentTwo);
  assert.equal((await api('GET', '/auth/me', { token: agentToken })).status, 200);

  const { rows } = await db.query("select id from users where phone = $1", [PHONES.agentTwo]);
  const disable = await api('PATCH', `/team/${rows[0].id}`, { token: adminToken, body: { status: 'disabled' } });
  assert.equal(disable.status, 200, JSON.stringify(disable.body));

  const staleSession = await api('GET', '/auth/me', { token: agentToken });
  assert.equal(staleSession.status, 403);
  assert.equal(staleSession.body.error.code, 'account_disabled');

  const relogin = await passwordLogin(PHONES.agentTwo);
  assert.equal(relogin.status, 400);
  assert.equal(relogin.body.msg, 'User is banned');

  const otp = await api('POST', '/auth/otp/send', { body: { channel: 'sms', phone: PHONES.agentTwo, purpose: 'login' } });
  assert.equal(otp.status, 403);
  assert.equal(otp.body.error.code, 'account_disabled');

  const enable = await api('PATCH', `/team/${rows[0].id}`, { token: adminToken, body: { status: 'active' } });
  assert.equal(enable.status, 200);
  const afterEnable = await passwordLogin(PHONES.agentTwo);
  assert.equal(afterEnable.status, 200);
  assert.equal((await api('GET', '/auth/me', { token: afterEnable.body.access_token })).status, 200);
});

test('concurrent wrong OTP guesses cannot exceed the 5-attempt budget, and the lock survives a resend', async () => {
  await resetOtpState();
  const sent = await api('POST', '/auth/otp/send', { body: { channel: 'email', email: 'owner-a@example.com', purpose: 'login' } });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  const realCode = lastDelivered('owner-a@example.com').code;
  const wrongCodes = Array.from({ length: 40 }, (_, index) => String((Number(realCode) + index + 1) % 10000).padStart(4, '0'));

  const results = await Promise.all(
    // Distinct client IPs: a distributed attacker is not stopped by per-IP limits,
    // so this isolates the per-identifier attempt budget.
    wrongCodes.map((code, index) => api('POST', '/auth/otp/verify', { body: { channel: 'email', email: 'owner-a@example.com', code, purpose: 'login' }, headers: { 'x-forwarded-for': `100.64.0.${index}` } })),
  );
  const evaluated = results.filter((result) => result.status === 401).length;
  assert.ok(evaluated <= 5, `at most 5 guesses may be evaluated, got ${evaluated}`);
  assert.ok(results.every((result) => [401, 409, 429].includes(result.status)), JSON.stringify(results.map((r) => r.status)));

  // Burn the rest of the budget sequentially, then the correct code must be refused.
  for (let index = 0; index < 5; index += 1) {
    await api('POST', '/auth/otp/verify', { body: { channel: 'email', email: 'owner-a@example.com', code: wrongCodes[index], purpose: 'login' } });
  }
  const correct = await api('POST', '/auth/otp/verify', { body: { channel: 'email', email: 'owner-a@example.com', code: realCode, purpose: 'login' } });
  assert.equal(correct.status, 429);

  const resend = await api('POST', '/auth/otp/send', { body: { channel: 'email', email: 'owner-a@example.com', purpose: 'login' } });
  assert.equal(resend.status, 429, 'a locked identifier must not receive a fresh code');

  const { rows } = await db.query("select coalesce(sum(attempt_count),0)::int as attempts from otp_verifications where email = 'owner-a@example.com'");
  assert.ok(rows[0].attempts <= 5, `persisted attempts ${rows[0].attempts}`);
});

test('a correct OTP logs in exactly once, even when submitted concurrently', async () => {
  await resetOtpState();
  const sent = await api('POST', '/auth/otp/send', { body: { channel: 'sms', phone: PHONES.ownerA, purpose: 'login' } });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  const code = lastDelivered(PHONES.ownerA).code;
  const results = await Promise.all(
    Array.from({ length: 5 }, () => api('POST', '/auth/otp/verify', { body: { channel: 'sms', phone: PHONES.ownerA, code, purpose: 'login' } })),
  );
  const sessions = results.filter((result) => result.status === 200);
  assert.equal(sessions.length, 1, JSON.stringify(results.map((r) => [r.status, r.body?.error?.code])));
  assert.equal((await api('GET', '/auth/me', { token: sessions[0].body.access_token })).status, 200);
});

test('account-change OTPs require an authenticated caller and complete a verified phone change', async () => {
  await resetOtpState();
  const anonymous = await api('POST', '/auth/otp/send', { body: { channel: 'sms', phone: '+966555000111', purpose: 'change_phone' } });
  assert.equal(anonymous.status, 401);
  const mismatch = await api('POST', '/auth/otp/send', { body: { channel: 'sms', phone: '+966555000111', purpose: 'change_email' } });
  assert.equal(mismatch.status, 400);

  const token = await tokenFor(PHONES.agentOne);
  const sent = await api('POST', '/auth/otp/send', { token, body: { channel: 'sms', phone: '+966555000111', purpose: 'change_phone' } });
  assert.equal(sent.status, 200, JSON.stringify(sent.body));
  const code = lastDelivered('+966555000111').code;
  const changed = await api('POST', '/auth/profile-change', { token, body: { channel: 'sms', phone: '+966555000111', code } });
  assert.equal(changed.status, 200, JSON.stringify(changed.body));

  const { rows } = await db.query("select u.phone, a.phone as auth_phone from users u join auth.users a on a.id = u.auth_user_id where u.full_name = 'Agent One'");
  assert.deepEqual(rows[0], { phone: '+966555000111', auth_phone: '+966555000111' });
  const loginWithNewPhone = await passwordLogin('+966555000111');
  assert.equal(loginWithNewPhone.status, 200);

  // Restore for later suites.
  await db.query("update users set phone = $1 where full_name = 'Agent One'", [PHONES.agentOne]);
  await db.query("update auth.users set phone = $1 where phone = '+966555000111'", [PHONES.agentOne]);
});

test('an OTP issued for an account change cannot be redeemed as a login', async () => {
  const result = await api('POST', '/auth/otp/verify', { body: { channel: 'sms', phone: PHONES.ownerA, code: '1234', purpose: 'change_phone' } });
  assert.equal(result.status, 400);
  assert.equal(result.body.error.code, 'otp_purpose_not_supported');
});
