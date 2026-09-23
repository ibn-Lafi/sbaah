import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, db, tokenFor, PHONES, SUPABASE } from './lib.mjs';
import { ANON_KEY } from './jwt.mjs';

const TENANT_B = "(select id from tenants where subdomain = 'agency-b')";

test('the custom domain flow still works for the owner through the API', async () => {
  await db.query(`update plans set custom_domain_allowed = true where id = (select plan_id from tenants where subdomain = 'agency-a')`);
  const owner = await tokenFor(PHONES.ownerA);
  const admin = await tokenFor(PHONES.adminA);

  assert.equal((await api('PATCH', '/tenant/domain', { token: admin, body: { custom_domain: 'agency-a.example' } })).status, 403);

  const added = await api('PATCH', '/tenant/domain', { token: owner, body: { custom_domain: 'agency-a.example' } });
  assert.equal(added.status, 200, JSON.stringify(added.body));
  assert.equal(added.body.custom_domain_status, 'pending');

  const verified = await api('POST', '/tenant/domain/verify', { token: owner });
  assert.equal(verified.status, 200, JSON.stringify(verified.body));
  assert.equal(verified.body.verified, true);

  const removed = await api('DELETE', '/tenant/domain', { token: owner });
  assert.equal(removed.status, 200, JSON.stringify(removed.body));
  const { rows } = await db.query(`select custom_domain, custom_domain_status from tenants where subdomain = 'agency-a'`);
  assert.deepEqual(rows[0], { custom_domain: null, custom_domain_status: null });
});

test('a trial owner cannot extend the trial or self-verify a domain through PostgREST', async () => {
  await db.query(`update tenants set trial_ends_at = now() + interval '3 days' where id = ${TENANT_B}`);
  try {
    const token = await tokenFor(PHONES.ownerB);
    const response = await fetch(`${SUPABASE}/rest/v1/tenants?subdomain=eq.agency-b`, {
      method: 'PATCH',
      headers: { apikey: ANON_KEY, authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ trial_ends_at: null, custom_domain: 'agency-b.example', custom_domain_status: 'verified' }),
    });
    assert.equal(response.status, 403, await response.text());
    const { rows } = await db.query(`select trial_ends_at is not null as on_trial, custom_domain from tenants where id = ${TENANT_B}`);
    assert.deepEqual(rows[0], { on_trial: true, custom_domain: null });
  } finally {
    await db.query(`update tenants set trial_ends_at = null where id = ${TENANT_B}`);
  }
});
