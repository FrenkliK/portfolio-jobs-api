const { test, after } = require('node:test');
const assert = require('node:assert/strict');
const { server } = require('../src/server');
let origin;
test('API routes and validation', async t => {
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${server.address().port}`;
  await t.test('health responds', async () => { const r = await fetch(`${origin}/health`); assert.equal(r.status, 200); assert.equal((await r.json()).status, 'ok'); });
  await t.test('lists paginated jobs and filters by query', async () => { const r = await fetch(`${origin}/api/v1/jobs?q=frontend&page=1&limit=2`); const body = await r.json(); assert.equal(r.status, 200); assert.equal(body.pagination.total, 1); assert.match(body.data[0].title, /Frontend/); });
  await t.test('creates a valid job', async () => { const r = await fetch(`${origin}/api/v1/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: 'Test Engineer', company: 'Example', location: 'Remote', tags: ['Testing'] }) }); assert.equal(r.status, 201); assert.ok((await r.json()).data.id); });
  await t.test('rejects invalid job payload', async () => { const r = await fetch(`${origin}/api/v1/jobs`, { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ title: '', company: 'Example', location: 'Remote' }) }); assert.equal(r.status, 400); assert.equal((await r.json()).error, 'validation_failed'); });
});
after(() => { if (server.listening) server.close(); });
