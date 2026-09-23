import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, db, SUPABASE } from './lib.mjs';
import { ANON_KEY } from './jwt.mjs';

const SECOND_ADMIN = '00000000-0000-0000-0000-0000000ad002';

test('the console keeps working once there is more than one platform admin', async () => {
  await db.query(`insert into auth.users (id, email) values ($1, 'second@sbaah.test') on conflict do nothing`, [SECOND_ADMIN]);
  await db.query(
    `insert into platform_admins (auth_user_id, phone, full_name) values ($1, '+966500000098', 'Second Admin') on conflict do nothing`,
    [SECOND_ADMIN],
  );
  try {
    const login = await fetch(`${SUPABASE}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', apikey: ANON_KEY, authorization: `Bearer ${ANON_KEY}` },
      body: JSON.stringify({ email: 'root@sbaah.test', password: 'Adm1nPass!' }),
    });
    const { access_token: token } = await login.json();
    const accounts = await api('GET', '/console/accounts', { token });
    assert.equal(accounts.status, 200, JSON.stringify(accounts.body));
  } finally {
    await db.query('delete from platform_admins where auth_user_id = $1', [SECOND_ADMIN]);
    await db.query('delete from auth.users where id = $1', [SECOND_ADMIN]);
  }
});
