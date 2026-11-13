/**
 * /api/site-content — the owner editor's published content, readable by everyone.
 *
 * Visitors could not see published edits because the `siteContent` Firestore
 * rules were never deployed: anonymous reads get 403. This endpoint reads and
 * writes with the service account (FIREBASE_SERVICE_ACCOUNT_KEY, the same one
 * /api/ama-vote uses), so it works whether or not the rules are deployed.
 *
 *   GET                      → { json, updatedAt }            (public, edge-cached 15s)
 *   GET  ?image=<id>         → the image bytes                 (public, immutable)
 *   POST { json }            → owner only, writes siteContent/live
 *   POST ?image=1 { data }   → owner only, stores a data-URL image, returns { id }
 *
 * Owner = a Firebase ID token whose account (looked up at Google, never taken
 * from the request body) has the admin email.
 */
const crypto = require('crypto');

const DEFAULT_PROJECT_ID = 'therealreze-2a3bf';
const WEB_API_KEY = 'AIzaSyCUG-oxLlGWKulnV8E0PwSEmr_s0EyCRUk';
const ADMIN_EMAIL = 'asaxxhiii@gmail.com';
const MAX_JSON_BYTES = 900 * 1024;
const MAX_IMAGE_BYTES = 1000 * 1000;

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw Object.assign(new Error('Missing FIREBASE_SERVICE_ACCOUNT_KEY'), { status: 503 });
  const sa = JSON.parse(raw);
  if (!sa.client_email || !sa.private_key) {
    throw Object.assign(new Error('FIREBASE_SERVICE_ACCOUNT_KEY must contain client_email and private_key'), { status: 503 });
  }
  return sa;
}

const b64url = (s) => Buffer.from(s).toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

let cachedToken = null;
async function googleAccessToken() {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;
  const sa = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }))}.${b64url(
    JSON.stringify({ iss: sa.client_email, scope: 'https://www.googleapis.com/auth/datastore', aud: 'https://oauth2.googleapis.com/token', iat: now, exp: now + 3600 })
  )}`;
  const sig = crypto.createSign('RSA-SHA256').update(unsigned).sign(sa.private_key, 'base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: `${unsigned}.${sig}` }),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.access_token) throw new Error(d?.error_description || `Google token error ${r.status}`);
  cachedToken = { value: d.access_token, exp: Date.now() + Number(d.expires_in || 3600) * 1000 };
  return cachedToken.value;
}

function docUrl(path) {
  const sa = serviceAccount();
  const pid = process.env.FIREBASE_PROJECT_ID || sa.project_id || DEFAULT_PROJECT_ID;
  return `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${path}`;
}

async function firestore(method, url, body) {
  const token = await googleAccessToken();
  const r = await fetch(url, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => null);
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(d?.error?.message || `Firestore ${method} ${r.status}`);
  return d;
}

/** The token's account, as Google sees it. Throws 401 unless it is the admin. */
async function requireOwner(req) {
  const h = req.headers?.authorization || req.headers?.Authorization || '';
  const idToken = String(h).replace(/^Bearer\s+/i, '').trim();
  if (!idToken) throw Object.assign(new Error('Sign in as the owner first'), { status: 401 });
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${WEB_API_KEY}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ idToken }),
  });
  const d = await r.json().catch(() => null);
  const email = d?.users?.[0]?.email;
  if (!r.ok || email !== ADMIN_EMAIL) throw Object.assign(new Error('Not the owner'), { status: 401 });
}

async function readBody(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  if (typeof req.body === 'string') return JSON.parse(req.body || '{}');
  const chunks = [];
  for await (const c of req) chunks.push(c);
  const raw = Buffer.concat(chunks).toString('utf8');
  return raw ? JSON.parse(raw) : {};
}

function send(res, status, obj, cache = 'no-store') {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Cache-Control', cache);
  res.end(JSON.stringify(obj));
}

module.exports = async function handler(req, res) {
  const url = new URL(req.url || '/', 'http://localhost');
  const imageId = url.searchParams.get('image');
  try {
    if (req.method === 'GET' || req.method === 'HEAD') {
      if (imageId) {
        if (!/^[\w-]{4,80}$/.test(imageId)) return send(res, 400, { error: 'bad image id' });
        const doc = await firestore('GET', docUrl(`siteImages/${imageId}`));
        const data = doc?.fields?.data?.stringValue || '';
        const m = data.match(/^data:([\w/+.-]+);base64,(.+)$/);
        if (!m) return send(res, 404, { error: 'no such image' });
        res.statusCode = 200;
        res.setHeader('Content-Type', m[1]);
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        return res.end(req.method === 'HEAD' ? undefined : Buffer.from(m[2], 'base64'));
      }
      const doc = await firestore('GET', docUrl('siteContent/live'));
      const json = doc?.fields?.json?.stringValue || '{}';
      const updatedAt = doc?.fields?.updatedAt?.stringValue || null;
      return send(res, 200, { json, updatedAt }, 's-maxage=15, stale-while-revalidate=60');
    }

    if (req.method === 'POST') {
      await requireOwner(req);
      const body = await readBody(req);
      const now = new Date().toISOString();
      if (imageId) {
        const data = String(body?.data || '');
        if (!/^data:image\/(webp|png|jpeg);base64,/.test(data)) return send(res, 400, { error: 'expected an image data URL' });
        if (data.length > MAX_IMAGE_BYTES) return send(res, 413, { error: 'image too large' });
        const id = crypto.randomUUID().replace(/-/g, '');
        await firestore('PATCH', docUrl(`siteImages/${id}`), { fields: { data: { stringValue: data }, createdAt: { stringValue: now } } });
        return send(res, 200, { ok: true, id });
      }
      const json = typeof body?.json === 'string' ? body.json : JSON.stringify(body?.json ?? {});
      if (Buffer.byteLength(json) > MAX_JSON_BYTES) return send(res, 413, { error: 'content too large' });
      JSON.parse(json); // must be valid JSON
      await firestore('PATCH', `${docUrl('siteContent/live')}?updateMask.fieldPaths=json&updateMask.fieldPaths=updatedAt`, {
        fields: { json: { stringValue: json }, updatedAt: { stringValue: now } },
      });
      return send(res, 200, { ok: true, updatedAt: now });
    }

    res.setHeader('Allow', 'GET, HEAD, POST');
    return send(res, 405, { error: 'method not allowed' });
  } catch (e) {
    return send(res, e.status || 500, { error: e.message || 'error' });
  }
};
