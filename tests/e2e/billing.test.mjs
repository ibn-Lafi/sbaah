import { test, before } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { API, db } from './lib.mjs';

const SECRET = 'e2e-streampay-secret';
let tenantId;
let paidPlanId;

function signed(body, timestamp = Math.floor(Date.now() / 1000)) {
  const raw = JSON.stringify(body);
  const signature = crypto.createHmac('sha256', SECRET).update(`${timestamp}.${raw}`).digest('hex');
  return { raw, header: `t=${timestamp},v1=${signature}` };
}
async function deliver(body, options = {}) {
  const { raw, header } = signed(body, options.timestamp);
  const response = await fetch(`${API}/billing/webhook/streampay`, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-webhook-signature': options.header ?? header },
    body: raw,
  });
  return { status: response.status, body: await response.json() };
}

before(async () => {
  const tenant = await db.query("select id from tenants where subdomain = 'agency-a'");
  tenantId = tenant.rows[0].id;
  const plan = await db.query("select id from plans where not is_trial and is_active order by price desc limit 1");
  paidPlanId = plan.rows[0].id;
  await db.query("delete from payments where tenant_id = $1", [tenantId]);
});

test('a successful payment ends an expired trial and reactivates the tenant', async () => {
  await db.query("update tenants set trial_ends_at = now() - interval '1 day', payment_status = 'pending' where id = $1", [tenantId]);
  assert.equal((await db.query('select is_tenant_active($1) as active', [tenantId])).rows[0].active, false);
  await db.query("insert into payments (tenant_id, plan_id, amount, status, provider_reference) values ($1, $2, 100, 'pending', 'pl_success')", [tenantId, paidPlanId]);

  const result = await deliver({ event_type: 'PAYMENT_SUCCEEDED', entity_id: 'pl_success' });
  assert.equal(result.status, 200);
  const { rows } = await db.query('select plan_id, payment_status, trial_ends_at, is_tenant_active(id) as active from tenants where id = $1', [tenantId]);
  assert.deepEqual(rows[0], { plan_id: paidPlanId, payment_status: 'paid', trial_ends_at: null, active: true });
  assert.equal((await db.query("select status from payments where provider_reference = 'pl_success'")).rows[0].status, 'paid');

  const duplicate = await deliver({ event_type: 'PAYMENT_SUCCEEDED', entity_id: 'pl_success' });
  assert.equal(duplicate.status, 200);
});

test('a failed plan-switch attempt does not flag a paying tenant as failed', async () => {
  await db.query("insert into payments (tenant_id, plan_id, amount, status, provider_reference) values ($1, $2, 100, 'pending', 'pl_failed')", [tenantId, paidPlanId]);
  const result = await deliver({ event_type: 'PAYMENT_FAILED', entity_id: 'pl_failed' });
  assert.equal(result.status, 200);
  assert.equal((await db.query('select payment_status from tenants where id = $1', [tenantId])).rows[0].payment_status, 'paid');
  assert.equal((await db.query("select status from payments where provider_reference = 'pl_failed'")).rows[0].status, 'failed');
});

test('forged, stale and unsigned webhook deliveries are rejected', async () => {
  const forged = await deliver({ event_type: 'PAYMENT_SUCCEEDED', entity_id: 'pl_failed' }, { header: 't=1,v1=00' });
  assert.equal(forged.status, 401);
  const stale = await deliver({ event_type: 'PAYMENT_SUCCEEDED', entity_id: 'pl_failed' }, { timestamp: Math.floor(Date.now() / 1000) - 3600 });
  assert.equal(stale.status, 401);
  const unsigned = await fetch(`${API}/billing/webhook/streampay`, { method: 'POST', body: '{}' });
  assert.equal(unsigned.status, 401);
  assert.equal((await db.query("select status from payments where provider_reference = 'pl_failed'")).rows[0].status, 'failed');
});
