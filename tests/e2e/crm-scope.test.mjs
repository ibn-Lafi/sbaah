import { test } from 'node:test';
import assert from 'node:assert/strict';
import { API, api, db, tokenFor, PHONES } from './lib.mjs';

const LEAD_ONE = '00000000-0000-0000-0000-00000000e001';
const LEAD_TWO = '00000000-0000-0000-0000-00000000e002';
const DEAL_TWO = '00000000-0000-0000-0000-00000000d002';
const FREE_ASSET = '00000000-0000-0000-0000-0000000aa001';
const RESERVED_ASSET = '00000000-0000-0000-0000-0000000aa002';
const TENANT_B_LEAD = '00000000-0000-0000-0000-00000000e101';

test('agent CRM lists never include another agent\'s records', async () => {
  const token = await tokenFor(PHONES.agentOne);
  const activities = await api('GET', '/crm/activities', { token });
  assert.equal(activities.status, 200);
  assert.deepEqual(activities.body.activities, []);
  const foreignActivities = await api('GET', `/crm/activities?lead_id=${LEAD_TWO}`, { token });
  assert.equal(foreignActivities.status, 403);
  const requirements = await api('GET', `/crm/requirements?lead_id=${LEAD_TWO}`, { token });
  assert.equal(requirements.status, 403);
  const deals = await api('GET', '/crm/deals', { token });
  assert.equal(deals.status, 200);
  assert.ok(deals.body.deals.every((deal) => deal.id !== DEAL_TWO));
  const reservations = await api('GET', '/reservations', { token });
  assert.equal(reservations.status, 200);
  assert.equal(reservations.body.total, 0);
});

test('an agent cannot modify or act on another agent\'s deal or lead', async () => {
  const token = await tokenFor(PHONES.agentOne);
  const patch = await api('PATCH', `/crm/deals/${DEAL_TWO}`, { token, body: { value: 1 } });
  assert.equal(patch.status, 404);
  const activity = await api('POST', '/crm/activities', { token, body: { lead_id: LEAD_TWO, activity_type: 'note', summary: 'x' } });
  assert.ok([400, 403].includes(activity.status), JSON.stringify(activity));
  const { rows } = await db.query('select value from deals where id = $1', [DEAL_TWO]);
  assert.equal(Number(rows[0].value), 1500000);
});

test('an agent reserving a unit another agent already holds gets a 409, not a 500', async () => {
  const token = await tokenFor(PHONES.agentOne);
  const conflict = await api('POST', '/crm/reservations', { token, body: { lead_id: LEAD_ONE, asset_ids: [RESERVED_ASSET] } });
  assert.equal(conflict.status, 409, JSON.stringify(conflict.body));
  assert.equal(conflict.body.error.code, 'asset_unavailable');
  const ok = await api('POST', '/crm/reservations', { token, body: { lead_id: LEAD_ONE, asset_ids: [FREE_ASSET] } });
  assert.equal(ok.status, 201, JSON.stringify(ok.body));
  await db.query('delete from reservations where id = $1', [ok.body.reservation.id]);
});

test('invalid input is a 400 with a validation message, never a 500', async () => {
  const badPhone = await api('POST', '/auth/otp/send', { body: { channel: 'sms', phone: '123', purpose: 'login' } });
  assert.equal(badPhone.status, 400);
  assert.equal(badPhone.body.error.code, 'validation_error');
  assert.match(badPhone.body.error.message, /[؀-ۿ]/);
  const malformed = await fetch(`${API}/auth/otp/send`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: '{not json' });
  assert.equal(malformed.status, 400);
  const token = await tokenFor(PHONES.agentOne);
  const missingLead = await api('GET', '/crm/matching', { token });
  assert.equal(missingLead.status, 400);
});

test('cross-tenant IDs are never readable through the API', async () => {
  const token = await tokenFor(PHONES.ownerA);
  const lead = await api('GET', `/leads/${TENANT_B_LEAD}`, { token });
  assert.equal(lead.status, 404);
  const asset = await api('GET', '/assets/00000000-0000-0000-0000-0000000bb001', { token });
  assert.equal(asset.status, 404);
  const interest = await api('POST', '/crm/interests', { token, body: { lead_id: LEAD_ONE, asset_id: '00000000-0000-0000-0000-0000000bb001' } });
  assert.equal(interest.status, 400);
});
