const http = require('node:http');
const { URL } = require('node:url');

const seed = [
  { id: 'job-101', title: 'Backend Engineer', company: 'Cedar Labs', location: 'Remote', type: 'Full-time', tags: ['Node.js', 'APIs'], postedAt: '2026-10-18' },
  { id: 'job-102', title: 'Frontend Developer', company: 'Northstar Studio', location: 'Tirana, Albania', type: 'Full-time', tags: ['React', 'Accessibility'], postedAt: '2026-10-20' },
  { id: 'job-103', title: 'QA Automation Engineer', company: 'Orbit Systems', location: 'Remote', type: 'Contract', tags: ['Testing', 'Playwright'], postedAt: '2026-10-21' }
];
const jobs = new Map(seed.map(job => [job.id, job]));
const port = Number(process.env.PORT) || 3000;
const allowedTypes = new Set(['Full-time', 'Part-time', 'Contract', 'Internship']);

function json(res, status, body, extra = {}) {
  res.writeHead(status, { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...extra });
  res.end(JSON.stringify(body, null, 2));
}
function validJob(body) {
  const errors = [];
  if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 120) errors.push('title must be a non-empty string up to 120 characters');
  if (typeof body.company !== 'string' || !body.company.trim() || body.company.length > 120) errors.push('company must be a non-empty string up to 120 characters');
  if (typeof body.location !== 'string' || !body.location.trim() || body.location.length > 120) errors.push('location must be a non-empty string up to 120 characters');
  if (body.type !== undefined && !allowedTypes.has(body.type)) errors.push('type must be Full-time, Part-time, Contract, or Internship');
  if (body.tags !== undefined && (!Array.isArray(body.tags) || body.tags.length > 12 || body.tags.some(tag => typeof tag !== 'string' || tag.length > 40))) errors.push('tags must be an array of up to 12 strings (40 characters each)');
  return errors;
}
function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = ''; req.on('data', chunk => { data += chunk; if (data.length > 20_000) { reject(new Error('Request body too large')); req.destroy(); } });
    req.on('end', () => { try { resolve(JSON.parse(data || '{}')); } catch { reject(new Error('Request body must be valid JSON')); } });
    req.on('error', reject);
  });
}
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  if (req.method === 'OPTIONS') return json(res, 204, {}, { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET,POST,OPTIONS', 'access-control-allow-headers': 'content-type' });
  if (url.pathname === '/health' && req.method === 'GET') return json(res, 200, { status: 'ok', service: 'portfolio-jobs-api' });
  if (url.pathname === '/api/v1/jobs' && req.method === 'GET') {
    const query = (url.searchParams.get('q') || '').toLowerCase();
    const type = url.searchParams.get('type');
    const page = Math.max(1, Number(url.searchParams.get('page')) || 1);
    const limit = Math.min(50, Math.max(1, Number(url.searchParams.get('limit')) || 10));
    const filtered = [...jobs.values()].filter(job => (!query || `${job.title} ${job.company} ${job.location} ${job.tags.join(' ')}`.toLowerCase().includes(query)) && (!type || job.type === type));
    const total = filtered.length;
    const items = filtered.slice((page - 1) * limit, page * limit);
    return json(res, 200, { data: items, pagination: { page, limit, total, pages: Math.ceil(total / limit) } });
  }
  if (url.pathname === '/api/v1/jobs' && req.method === 'POST') {
    try {
      const body = await readBody(req); const errors = validJob(body);
      if (errors.length) return json(res, 400, { error: 'validation_failed', details: errors });
      const job = { id: `job-${crypto.randomUUID()}`, title: body.title.trim(), company: body.company.trim(), location: body.location.trim(), type: body.type || 'Full-time', tags: body.tags || [], postedAt: new Date().toISOString().slice(0, 10) };
      jobs.set(job.id, job); return json(res, 201, { data: job }, { location: `/api/v1/jobs/${job.id}` });
    } catch (error) { return json(res, 400, { error: 'invalid_request', message: error.message }); }
  }
  const match = url.pathname.match(/^\/api\/v1\/jobs\/([\w-]+)$/);
  if (match && req.method === 'GET') {
    const job = jobs.get(match[1]); return job ? json(res, 200, { data: job }) : json(res, 404, { error: 'not_found', message: 'Job not found' });
  }
  return json(res, 404, { error: 'not_found', message: 'Route not found' });
});
if (require.main === module) server.listen(port, '0.0.0.0', () => console.log(`Jobs API listening on ${port}`));
module.exports = { server, jobs, validJob };
