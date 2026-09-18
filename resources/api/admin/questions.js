const ADMIN_EMAIL_DEFAULT = 'asaxxhiii@gmail.com';
function json(data, status = 200) { return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json; charset=utf-8' } }); }
function clean(s, max) { return String(s || '').trim().slice(0, max); }

async function requireAdmin(request, env) {
  const auth = request.headers.get('Authorization') || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  if (!token) throw new Error('Login required.');
  const r = await fetch('https://oauth2.googleapis.com/tokeninfo?id_token=' + encodeURIComponent(token));
  if (!r.ok) throw new Error('Google login expired. Login again.');
  const info = await r.json();
  if (env.GOOGLE_CLIENT_ID && info.aud !== env.GOOGLE_CLIENT_ID) throw new Error('Invalid Google client.');
  const adminEmail = (env.ADMIN_EMAIL || ADMIN_EMAIL_DEFAULT).toLowerCase();
  if (!info.email_verified || String(info.email || '').toLowerCase() !== adminEmail) throw new Error('This Google account is not allowed.');
  return info;
}

async function allQuestions(env) {
  const listed = await env.AMA_KV.list({ prefix: 'q:', limit: 1000 });
  const questions = [];
  for (const k of listed.keys) {
    const q = await env.AMA_KV.get(k.name, 'json');
    if (q) questions.push(q);
  }
  questions.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  return questions;
}

export async function onRequestGet({ request, env }) {
  if (!env.AMA_KV) return json({ error: 'AMA_KV is not configured.' }, 500);
  try { await requireAdmin(request, env); } catch (e) { return json({ error: e.message }, 401); }
  return json({ questions: await allQuestions(env) });
}

export async function onRequestPut({ request, env }) {
  if (!env.AMA_KV) return json({ error: 'AMA_KV is not configured.' }, 500);
  try { await requireAdmin(request, env); } catch (e) { return json({ error: e.message }, 401); }
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }
  const id = clean(body.id, 80);
  const answer = clean(body.answer, 1000);
  if (!id || !answer) return json({ error: 'Question id and answer are required.' }, 400);
  const key = `q:${id}`;
  const q = await env.AMA_KV.get(key, 'json');
  if (!q) return json({ error: 'Question not found.' }, 404);
  q.answer = answer;
  q.answeredAt = new Date().toISOString();
  await env.AMA_KV.put(key, JSON.stringify(q));
  return json({ ok: true, question: q });
}
