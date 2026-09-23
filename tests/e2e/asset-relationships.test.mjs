import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, tokenFor, PHONES } from './lib.mjs';

// Migration 0062 gave every table that references `leads` (and several
// that reference `users`) a second, composite same-tenant foreign key
// alongside the original one. PostgREST refuses an unhinted `leads(...)`
// embed the moment two relationships exist to the same table — a hard,
// deterministic 500 on every call, not a rare/transient one — so this
// asserts the fix on both the empty and the populated path, and that the
// embed resolves to the right lead, not just any relationship.
const FREE_ASSET = '00000000-0000-0000-0000-0000000aa001';
const RESERVED_ASSET = '00000000-0000-0000-0000-0000000aa002';
const LEAD_TWO_NAME = 'Lead of agent two';

test('an asset with no linked deals/viewings/reservations still returns its relationships, not a 500', async () => {
  // Other suites (abuse.test.mjs's WhatsApp-click leads) may attach an
  // interest to this asset, so only what this asset is actually free of is
  // asserted — the point is a 200 with the right shape, not emptiness.
  const token = await tokenFor(PHONES.ownerA);
  const response = await api('GET', `/assets/${FREE_ASSET}/relationships`, { token });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  assert.ok(Array.isArray(response.body.relationships.interests));
  assert.deepEqual(response.body.relationships.viewings, []);
  assert.deepEqual(response.body.relationships.reservations, []);
  assert.deepEqual(response.body.relationships.deals, []);
});

test('an asset with a real interest, viewing, reservation and deal embeds the correct lead on each', async () => {
  const token = await tokenFor(PHONES.ownerA);
  const response = await api('GET', `/assets/${RESERVED_ASSET}/relationships`, { token });
  assert.equal(response.status, 200, JSON.stringify(response.body));
  const { relationships } = response.body;

  assert.equal(relationships.interests.length, 1);
  assert.equal(relationships.interests[0].leads.full_name, LEAD_TWO_NAME);

  assert.equal(relationships.viewings.length, 1);
  assert.equal(relationships.viewings[0].leads.full_name, LEAD_TWO_NAME);

  assert.equal(relationships.reservations.length, 1);
  assert.equal(relationships.reservations[0].reservations.leads.full_name, LEAD_TWO_NAME);

  assert.equal(relationships.deals.length, 1);
  assert.equal(relationships.deals[0].deals.leads.full_name, LEAD_TWO_NAME);
  assert.equal(relationships.deals[0].deals.users.full_name, 'Agent Two');
});
