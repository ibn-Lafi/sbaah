import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, tokenFor, PHONES } from './lib.mjs';

// create_lead_with_interest() (migration 0099) inserted into
// leads(...,notes,...) — a column `leads` has never had (migration 0004;
// only `lead_notes`, a separate per-lead note timeline, exists) — so
// every manual lead creation from the dashboard's "add a customer/lead"
// form failed with a hard 500, with or without a linked property.
// Reproduced directly against the API before 0117.
const FREE_ASSET = '00000000-0000-0000-0000-0000000aa001';

test('an owner can create a manual lead with no linked property', async () => {
  const token = await tokenFor(PHONES.ownerA);
  const created = await api('POST', '/leads', {
    token,
    body: { full_name: 'عميل تجريبي', phone: '+966511119999' },
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  assert.equal(created.body.lead.full_name, 'عميل تجريبي');
});

test('an owner can create a manual lead with a linked property', async () => {
  const token = await tokenFor(PHONES.ownerA);
  const created = await api('POST', '/leads', {
    token,
    body: { full_name: 'عميل تجريبي مهتم', phone: '+966511118888', asset_id: FREE_ASSET },
  });
  assert.equal(created.status, 201, JSON.stringify(created.body));
});

test('an agent cannot create a manual lead', async () => {
  const token = await tokenFor(PHONES.agentOne);
  const created = await api('POST', '/leads', {
    token,
    body: { full_name: 'محاولة وسيط', phone: '+966511117777' },
  });
  assert.equal(created.status, 403);
});
