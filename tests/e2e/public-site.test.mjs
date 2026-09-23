import { test } from 'node:test';
import assert from 'node:assert/strict';
import { api, db, tokenFor, PHONES } from './lib.mjs';

const DOMAIN = 'agency-a.sbaah.test';

test('a project published from the dashboard gets a working public link', async () => {
  const token = await tokenFor(PHONES.ownerA);
  const { rows } = await db.query('select id from cities order by id limit 1');
  const created = await api('POST', '/projects', { token, body: { name_ar: 'مشروع الواحة', city_id: rows[0].id } });
  assert.equal(created.status, 201, JSON.stringify(created.body));
  const projectId = created.body.project.id;
  const published = await api('PATCH', `/projects/${projectId}`, { token, body: { status: 'published' } });
  assert.equal(published.status, 200, JSON.stringify(published.body));

  const feed = await api('GET', `/public/projects?domain=${DOMAIN}`);
  assert.equal(feed.status, 200);
  const listed = feed.body.projects.find((project) => project.id === projectId);
  assert.ok(listed, 'published project is listed');
  assert.equal(typeof listed.slug, 'string', 'public-site builds /projects/<slug> from this value');

  const detail = await api('GET', `/public/projects/${encodeURIComponent(listed.slug)}?domain=${DOMAIN}`);
  assert.equal(detail.status, 200, JSON.stringify(detail.body));
  assert.equal(detail.body.project.id, projectId);
  assert.equal(detail.body.project.slug, listed.slug, 'detail page redirects to this slug when it differs');
});
