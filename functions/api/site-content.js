// Cloudflare Pages Function: /api/site-content — same contract as the Vercel handler in /api.
// Needs env FIREBASE_SERVICE_ACCOUNT_KEY (Pages → Settings → Variables and Secrets).

const DEFAULT_PROJECT_ID = "therealreze-2a3bf";
const WEB_API_KEY = "AIzaSyCUG-oxLlGWKulnV8E0PwSEmr_s0EyCRUk";
const ADMIN_EMAIL = "asaxxhiii@gmail.com";
const MAX_JSON_BYTES = 900 * 1024;
const MAX_IMAGE_BYTES = 1000 * 1000;
const MAX_PROFILE_AVATAR_BYTES = 220_000;
const IMAGE_DATA_URL = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;
const PROFILE_AVATAR_DATA_URL = /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;

const json = (obj, status = 200, cache = "no-store", headOnly = false) =>
  new Response(headOnly ? null : JSON.stringify(obj), { status, headers: { "Content-Type": "application/json", "Cache-Control": cache } });

function serviceAccount(env) {
  const raw = env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw Object.assign(new Error("Missing FIREBASE_SERVICE_ACCOUNT_KEY"), { status: 503 });
  let sa;
  try {
    sa = JSON.parse(raw);
  } catch {
    throw Object.assign(new Error("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON"), { status: 503 });
  }
  if (!sa || !sa.client_email || !sa.private_key) throw Object.assign(new Error("Bad FIREBASE_SERVICE_ACCOUNT_KEY"), { status: 503 });
  return sa;
}

const enc = new TextEncoder();
const b64url = (bytes) =>
  btoa(String.fromCharCode(...new Uint8Array(bytes))).replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");
const b64urlStr = (s) => b64url(enc.encode(s));

function pemToDer(pem) {
  const b = atob(pem.replace(/-----[^-]+-----/g, "").replace(/\s+/g, ""));
  const out = new Uint8Array(b.length);
  for (let i = 0; i < b.length; i++) out[i] = b.charCodeAt(i);
  return out.buffer;
}

let cached = null;
async function googleAccessToken(env) {
  if (cached && cached.exp > Date.now() + 60_000) return cached.value;
  const sa = serviceAccount(env);
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64urlStr(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64urlStr(
    JSON.stringify({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/datastore", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })
  )}`;
  const key = await crypto.subtle.importKey("pkcs8", pemToDer(sa.private_key), { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("RSASSA-PKCS1-v1_5", key, enc.encode(unsigned));
  const r = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${b64url(sig)}` }),
  });
  const d = await r.json().catch(() => null);
  if (!r.ok || !d?.access_token) throw new Error(d?.error_description || `Google token error ${r.status}`);
  cached = { value: d.access_token, exp: Date.now() + Number(d.expires_in || 3600) * 1000 };
  return cached.value;
}

function docUrl(env, path) {
  const pid = env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
  if (pid !== DEFAULT_PROJECT_ID) {
    throw Object.assign(new Error(`FIREBASE_PROJECT_ID must be ${DEFAULT_PROJECT_ID} to share content with the client`), { status: 503 });
  }
  return `https://firestore.googleapis.com/v1/projects/${pid}/databases/(default)/documents/${path}`;
}

async function firestore(env, method, url, body) {
  const token = await googleAccessToken(env);
  const r = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body ? JSON.stringify(body) : undefined,
  });
  const d = await r.json().catch(() => null);
  if (r.status === 404) return null;
  if (!r.ok) throw Object.assign(new Error(d?.error?.message || `Firestore ${method} ${r.status}`), { status: r.status === 403 ? 403 : r.status >= 500 ? 502 : r.status });
  return d;
}

async function requireOwner(request, requireVerifiedEmail = false) {
  const idToken = (request.headers.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (!idToken) throw Object.assign(new Error("Sign in as the owner first"), { status: 401 });
  const r = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const d = await r.json().catch(() => null);
  const user = d?.users?.[0];
  const email = String(user?.email || "").toLowerCase();
  if (!r.ok || email !== ADMIN_EMAIL.toLowerCase()) throw Object.assign(new Error("Not the owner"), { status: 401 });
  if (requireVerifiedEmail && user?.emailVerified !== true) {
    throw Object.assign(new Error(`Verify the owner email ${ADMIN_EMAIL} before saving the shared profile icon`), { status: 403 });
  }
}

async function handle({ request, env }) {
  const url = new URL(request.url);
  const imageId = url.searchParams.get("image");
  const ownerProfile = url.searchParams.get("profile") === "1";
  try {
    if (request.method === "GET" || request.method === "HEAD") {
      if (ownerProfile) {
        const doc = await firestore(env, "GET", docUrl(env, "siteOwner/profile"));
        return json(
          {
            resource: "siteOwner/profile",
            avatar: doc?.fields?.avatar?.stringValue || "",
            updatedAt: doc?.fields?.updatedAt?.stringValue || null,
          },
          200,
          "no-store",
          request.method === "HEAD"
        );
      }
      if (imageId) {
        if (!/^[\w-]{4,80}$/.test(imageId)) return json({ error: "bad image id" }, 400);
        const doc = await firestore(env, "GET", docUrl(env, `siteImages/${imageId}`));
        const m = (doc?.fields?.data?.stringValue || "").match(IMAGE_DATA_URL);
        if (!m) return json({ error: "no such image" }, 404);
        const bin = Uint8Array.from(atob(m[2]), (c) => c.charCodeAt(0));
        return new Response(request.method === "HEAD" ? null : bin, {
          headers: { "Content-Type": `image/${m[1]}`, "Cache-Control": "public, max-age=31536000, immutable" },
        });
      }
      const doc = await firestore(env, "GET", docUrl(env, "siteContent/live"));
      return json(
        { json: doc?.fields?.json?.stringValue || "{}", updatedAt: doc?.fields?.updatedAt?.stringValue || null },
        200,
        "public, max-age=0, s-maxage=5, stale-while-revalidate=5",
        request.method === "HEAD"
      );
    }
    if (request.method === "POST") {
      await requireOwner(request, ownerProfile);
      let body;
      try {
        body = await request.json();
      } catch {
        return json({ error: "Request body must be valid JSON" }, 400);
      }
      const now = new Date().toISOString();
      if (ownerProfile) {
        const avatar = typeof body?.avatar === "string" ? body.avatar : "";
        if (avatar && !PROFILE_AVATAR_DATA_URL.test(avatar)) {
          return json({ error: "Expected a PNG, JPEG, or WebP profile image" }, 400);
        }
        if (enc.encode(avatar).length > MAX_PROFILE_AVATAR_BYTES) {
          return json({ error: "Profile image is too large" }, 413);
        }
        await firestore(env, "PATCH", `${docUrl(env, "siteOwner/profile")}?updateMask.fieldPaths=avatar&updateMask.fieldPaths=updatedAt`, {
          fields: { avatar: { stringValue: avatar }, updatedAt: { stringValue: now } },
        });
        return json({ resource: "siteOwner/profile", ok: true, updatedAt: now });
      }
      if (imageId) {
        const data = String(body?.data || "");
        if (!IMAGE_DATA_URL.test(data)) return json({ error: "Expected a WebP, PNG, or JPEG image data URL" }, 400);
        if (enc.encode(data).length > MAX_IMAGE_BYTES) return json({ error: "Image is too large" }, 413);
        const id = crypto.randomUUID().replace(/-/g, "");
        await firestore(env, "PATCH", docUrl(env, `siteImages/${id}`), { fields: { data: { stringValue: data }, createdAt: { stringValue: now } } });
        return json({ ok: true, id });
      }
      const text = typeof body?.json === "string" ? body.json : JSON.stringify(body?.json ?? {});
      if (enc.encode(text).length > MAX_JSON_BYTES) return json({ error: "Site content is too large" }, 413);
      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        return json({ error: "Published content must be valid JSON" }, 400);
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) return json({ error: "Published content must be a JSON object" }, 400);
      await firestore(env, "PATCH", `${docUrl(env, "siteContent/live")}?updateMask.fieldPaths=json&updateMask.fieldPaths=updatedAt`, {
        fields: { json: { stringValue: text }, updatedAt: { stringValue: now } },
      });
      return json({ ok: true, updatedAt: now });
    }
    return json({ error: "method not allowed" }, 405);
  } catch (e) {
    return json({ error: e.message || "error" }, e.status || 500);
  }
}

export const onRequest = handle;
