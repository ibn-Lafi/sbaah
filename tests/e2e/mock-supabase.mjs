// Local stand-in for a Supabase project gateway: /rest/v1 is proxied to a
// real PostgREST over the harness database, /auth/v1 implements the GoTrue
// endpoints the API and dashboard actually call. Test-only, never shipped.
import http from 'node:http';
import crypto from 'node:crypto';
import pg from 'pg';
import { signJwt, verifyJwt } from './jwt.mjs';

const POSTGREST = process.env.E2E_POSTGREST_URL ?? 'http://127.0.0.1:54330';
const PORT = Number(process.env.E2E_SUPABASE_PORT ?? 54321);
// Connection comes from the standard PG* environment variables.
const db = new pg.Pool();

const refreshTokens = new Map();
const magicLinks = new Map();
const revokedSessions = new Set();

async function userRow(id) {
  const { rows } = await db.query('select id, email, phone, banned_until from auth.users where id = $1', [id]);
  return rows[0] ?? null;
}
const isBanned = (user) => user.banned_until && new Date(user.banned_until) > new Date();
function toUser(row) {
  return { id: row.id, aud: 'authenticated', role: 'authenticated', email: row.email, phone: row.phone,
    banned_until: row.banned_until, app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() };
}
async function session(row) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const sessionId = crypto.randomUUID();
  const accessToken = signJwt({ sub: row.id, role: 'authenticated', aud: 'authenticated', exp: expiresAt, session_id: sessionId });
  const refreshToken = crypto.randomBytes(16).toString('hex');
  refreshTokens.set(refreshToken, row.id);
  return { access_token: accessToken, refresh_token: refreshToken, token_type: 'bearer', expires_in: 3600,
    expires_at: expiresAt, user: toUser(row) };
}

function send(res, status, body) {
  res.writeHead(status, { 'content-type': 'application/json', 'access-control-allow-origin': '*' });
  res.end(body === undefined ? '' : JSON.stringify(body));
}
const readBody = (req) => new Promise((resolve) => {
  const chunks = [];
  req.on('data', (chunk) => chunks.push(chunk));
  req.on('end', () => resolve(Buffer.concat(chunks)));
});

async function handleAuth(req, res, path, url) {
  const raw = (await readBody(req)).toString();
  const body = raw ? JSON.parse(raw) : {};
  const bearer = (req.headers.authorization ?? '').replace(/^Bearer /i, '');
  const claims = verifyJwt(bearer);

  if (req.method === 'GET' && path === '/user') {
    if (!claims || claims.role !== 'authenticated' || revokedSessions.has(claims.session_id)) return send(res, 401, { msg: 'invalid JWT' });
    const row = await userRow(claims.sub);
    return row ? send(res, 200, toUser(row)) : send(res, 404, { msg: 'User not found' });
  }
  if (req.method === 'POST' && path === '/token') {
    const grant = url.searchParams.get('grant_type');
    if (grant === 'password') {
      const { rows } = await db.query(
        'select id, email, phone, banned_until from auth.users where (phone = $1 or email = $2) and encrypted_password = crypt($3, encrypted_password)',
        [body.phone ? body.phone.replace(/^\+/, '+') : null, body.email ?? null, body.password ?? ''],
      );
      const row = rows[0];
      if (!row) return send(res, 400, { error: 'invalid_grant', error_description: 'Invalid login credentials', msg: 'Invalid login credentials', code: 'invalid_credentials' });
      if (isBanned(row)) return send(res, 400, { error: 'user_banned', msg: 'User is banned', code: 'user_banned' });
      return send(res, 200, await session(row));
    }
    if (grant === 'refresh_token') {
      const id = refreshTokens.get(body.refresh_token);
      const row = id && (await userRow(id));
      if (!row) return send(res, 400, { error: 'invalid_grant', msg: 'Invalid Refresh Token' });
      if (isBanned(row)) return send(res, 400, { error: 'user_banned', msg: 'User is banned' });
      return send(res, 200, await session(row));
    }
  }
  if (req.method === 'POST' && path === '/verify') {
    const id = magicLinks.get(body.token_hash);
    magicLinks.delete(body.token_hash);
    const row = id && (await userRow(id));
    if (!row) return send(res, 403, { msg: 'Token has expired or is invalid' });
    if (isBanned(row)) return send(res, 403, { msg: 'User is banned' });
    return send(res, 200, await session(row));
  }
  if (req.method === 'POST' && path === '/logout') {
    if (claims?.session_id) revokedSessions.add(claims.session_id);
    return send(res, 204);
  }

  // Admin API requires the service role key.
  if (!claims || claims.role !== 'service_role') return send(res, 401, { msg: 'service role required' });
  if (req.method === 'POST' && path === '/admin/users') {
    try {
      const { rows } = await db.query(
        `insert into auth.users (email, phone, encrypted_password) values ($1, $2, case when $3::text is null then null else crypt($3, gen_salt('bf')) end)
         returning id, email, phone, banned_until`,
        [body.email ?? null, body.phone ?? null, body.password ?? null],
      );
      return send(res, 200, toUser(rows[0]));
    } catch (error) {
      return send(res, 422, { msg: error.message, code: 'user_already_exists' });
    }
  }
  if (req.method === 'POST' && path === '/admin/generate_link') {
    const { rows } = await db.query('select id from auth.users where email = $1', [body.email]);
    if (!rows[0]) return send(res, 404, { msg: 'User not found' });
    const hashed = crypto.randomBytes(16).toString('hex');
    magicLinks.set(hashed, rows[0].id);
    return send(res, 200, { ...toUser({ ...rows[0], email: body.email }), action_link: 'x', hashed_token: hashed,
      email_otp: '000000', redirect_to: '', verification_type: 'magiclink', properties: { hashed_token: hashed } });
  }
  if (req.method === 'POST' && path.startsWith('/admin/logout')) return send(res, 204);
  const match = path.match(/^\/admin\/users\/([0-9a-f-]{36})$/);
  if (match) {
    const id = match[1];
    if (req.method === 'GET') {
      const row = await userRow(id);
      return row ? send(res, 200, toUser(row)) : send(res, 404, { msg: 'User not found' });
    }
    if (req.method === 'DELETE') {
      await db.query('delete from auth.users where id = $1', [id]);
      return send(res, 200, {});
    }
    if (req.method === 'PUT') {
      const sets = [];
      const values = [id];
      if (body.phone !== undefined) { values.push(body.phone); sets.push(`phone = $${values.length}`); }
      if (body.password !== undefined) { values.push(body.password); sets.push(`encrypted_password = crypt($${values.length}, gen_salt('bf'))`); }
      if (body.ban_duration !== undefined) {
        sets.push(body.ban_duration === 'none' ? 'banned_until = null' : `banned_until = now() + interval '100 years'`);
      }
      if (sets.length) await db.query(`update auth.users set ${sets.join(', ')} where id = $1`, values);
      const row = await userRow(id);
      return row ? send(res, 200, toUser(row)) : send(res, 404, { msg: 'User not found' });
    }
  }
  return send(res, 404, { msg: `mock gotrue: unhandled ${req.method} ${path}` });
}

function proxyRest(req, res, path) {
  const target = new URL(path, POSTGREST);
  const headers = { ...req.headers };
  delete headers.host;
  const proxied = http.request(target, { method: req.method, headers }, (upstream) => {
    res.writeHead(upstream.statusCode ?? 502, upstream.headers);
    upstream.pipe(res);
  });
  proxied.on('error', (error) => send(res, 502, { message: error.message }));
  req.pipe(proxied);
}

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'access-control-allow-origin': '*',
      'access-control-allow-methods': 'GET,POST,PUT,PATCH,DELETE,OPTIONS',
      'access-control-allow-headers': '*',
    });
    return res.end();
  }
  try {
    if (url.pathname.startsWith('/rest/v1')) return proxyRest(req, res, url.pathname.slice('/rest/v1'.length) + url.search);
    if (url.pathname.startsWith('/auth/v1')) return await handleAuth(req, res, url.pathname.slice('/auth/v1'.length), url);
    if (url.pathname.startsWith('/storage/v1')) return send(res, 200, { Key: 'mock' });
    send(res, 404, { msg: 'not found' });
  } catch (error) {
    send(res, 500, { msg: error.message });
  }
}).listen(PORT, () => console.log(`mock supabase on ${PORT}`));
