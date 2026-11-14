#!/usr/bin/env node
/**
 * Offline tests for the owner editor endpoint, run against BOTH the Vercel
 * handler (api/site-content.js) and the Cloudflare function
 * (functions/api/site-content.js). Google's token/lookup and Firestore are
 * mocked, so this needs no network or credentials.
 *
 *   node scripts/test-site-content.mjs
 */
import { generateKeyPairSync } from "node:crypto";
import { Readable } from "node:stream";

const ADMIN = "asaxxhiii@gmail.com";
const { privateKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const SA = JSON.stringify({
  client_email: "svc@test.iam.gserviceaccount.com",
  private_key: privateKey.export({ type: "pkcs8", format: "pem" }),
});

/* ---- mocked Google + Firestore ---- */
const store = new Map();
const TOKENS = {
  owner_unverified: { email: ADMIN, emailVerified: false },
  owner_verified: { email: ADMIN, emailVerified: true },
  stranger: { email: "someone@example.com", emailVerified: true },
};
const jsonRes = (status, body) => new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
globalThis.fetch = async (input, init = {}) => {
  const url = String(typeof input === "string" ? input : input.url);
  const method = (init.method || "GET").toUpperCase();
  if (url.startsWith("https://oauth2.googleapis.com/token")) return jsonRes(200, { access_token: "svc-token", expires_in: 3600 });
  if (url.includes("accounts:lookup")) {
    const { idToken } = JSON.parse(init.body || "{}");
    const u = TOKENS[idToken];
    return u ? jsonRes(200, { users: [u] }) : jsonRes(400, { error: { message: "INVALID_ID_TOKEN" } });
  }
  const m = url.match(/documents\/([^?]+)/);
  if (m) {
    const path = decodeURIComponent(m[1]);
    if (method === "GET") return store.has(path) ? jsonRes(200, { fields: store.get(path) }) : jsonRes(404, { error: { message: "NOT_FOUND" } });
    if (method === "PATCH") {
      const { fields } = JSON.parse(init.body || "{}");
      store.set(path, { ...(store.get(path) || {}), ...fields });
      return jsonRes(200, { fields: store.get(path) });
    }
  }
  throw new Error("unmocked fetch " + method + " " + url);
};

/* ---- adapters: one call shape for both runtimes ---- */
async function vercelCall(handler, { method = "GET", path = "/api/site-content", token, body, origin }) {
  const raw = body === undefined ? "" : JSON.stringify(body);
  const req = Object.assign(Readable.from(raw ? [Buffer.from(raw)] : []), {
    method,
    url: path,
    headers: { ...(token ? { authorization: `Bearer ${token}` } : {}), ...(origin ? { origin } : {}) },
  });
  return await new Promise((resolve) => {
    const res = {
      statusCode: 0,
      headers: {},
      setHeader(k, v) { this.headers[k.toLowerCase()] = v; },
      end(b) { let j = null; try { j = b ? JSON.parse(String(b)) : null; } catch { j = { binary: true }; } resolve({ status: this.statusCode, json: j, headers: this.headers }); },
    };
    handler(req, res);
  });
}
async function cfCall(onRequest, { method = "GET", path = "/api/site-content", token, body }) {
  const request = new Request("https://x" + path, {
    method,
    headers: token ? { authorization: `Bearer ${token}` } : {},
    body: body === undefined || method === "GET" ? undefined : JSON.stringify(body),
  });
  const r = await onRequest({ request, env: { FIREBASE_SERVICE_ACCOUNT_KEY: SA } });
  const t = await r.text();
  let j = null; try { j = t ? JSON.parse(t) : null; } catch { j = { binary: true }; }
  return { status: r.status, json: j };
}

const AVATAR = "data:image/webp;base64," + Buffer.from("tiny-webp").toString("base64");
const BIG = "data:image/webp;base64," + "A".repeat(240_000);
const CASES = [
  ["owner WITHOUT verified email saves profile icon", { method: "POST", path: "/api/site-content?profile=1", token: "owner_unverified", body: { avatar: AVATAR } }, 200],
  ["verified owner saves profile icon", { method: "POST", path: "/api/site-content?profile=1", token: "owner_verified", body: { avatar: AVATAR } }, 200],
  ["visitors read the saved profile icon", { path: "/api/site-content?profile=1" }, 200, (j) => j?.avatar === AVATAR],
  ["wrong account → 401", { method: "POST", path: "/api/site-content?profile=1", token: "stranger", body: { avatar: AVATAR } }, 401],
  ["no token → 401", { method: "POST", path: "/api/site-content?profile=1", body: { avatar: AVATAR } }, 401],
  ["invalid/expired token → 401", { method: "POST", path: "/api/site-content", token: "nope", body: { json: "{}" } }, 401],
  ["bad avatar MIME → 400", { method: "POST", path: "/api/site-content?profile=1", token: "owner_unverified", body: { avatar: "data:text/html;base64,PGI+" } }, 400],
  ["oversize avatar → 413", { method: "POST", path: "/api/site-content?profile=1", token: "owner_unverified", body: { avatar: BIG } }, 413],
  ["owner publishes site content", { method: "POST", path: "/api/site-content", token: "owner_unverified", body: { json: JSON.stringify({ hero: { kicker: "edited" } }) } }, 200],
  ["visitors read published content", { path: "/api/site-content" }, 200, (j) => JSON.parse(j?.json || "{}").hero?.kicker === "edited"],
  ["owner uploads an image", { method: "POST", path: "/api/site-content?image=1", token: "owner_unverified", body: { data: AVATAR } }, 200, (j) => typeof j?.id === "string"],
  ["errors use { error: { message, code } }", { method: "POST", path: "/api/site-content", body: {} }, 401, (j) => typeof j?.error?.message === "string" && typeof j?.error?.code === "string"],
];

let failed = 0;
async function suite(name, call) {
  store.clear();
  console.log(`\n${name}`);
  for (const [label, req, want, check] of CASES) {
    const r = await call(req);
    const ok = r.status === want && (!check || check(r.json));
    if (!ok) failed++;
    console.log(`  ${ok ? "✓" : "✗"} ${label}${ok ? "" : `  (got ${r.status} ${JSON.stringify(r.json)?.slice(0, 120)})`}`);
  }
}

process.env.FIREBASE_SERVICE_ACCOUNT_KEY = SA;
const vercel = (await import("../api/site-content.js")).default;
await suite("Vercel  api/site-content.js", (r) => vercelCall(vercel, r));

for (const origin of ["https://v3rsi0n.miuka.moe", "https://v3rsi0n.wasmer.app"]) {
  const preflight = await vercelCall(vercel, { method: "OPTIONS", origin });
  const ok = preflight.status === 204 && preflight.headers["access-control-allow-origin"] === origin &&
    preflight.headers["access-control-allow-methods"]?.includes("POST") &&
    preflight.headers["access-control-allow-headers"]?.toLowerCase().includes("authorization");
  if (!ok) failed++;
  console.log(`  ${ok ? "✓" : "✗"} CORS preflight permits ${origin}`);
}
const blockedOrigin = await vercelCall(vercel, { method: "OPTIONS", origin: "https://not-allowed.example" });
const blocksUnknownOrigin = blockedOrigin.status === 204 && !blockedOrigin.headers["access-control-allow-origin"];
if (!blocksUnknownOrigin) failed++;
console.log(`  ${blocksUnknownOrigin ? "✓" : "✗"} CORS does not allow an unconfigured origin`);

const cf = await import("../functions/api/site-content.js");
await suite("Cloudflare  functions/api/site-content.js", (r) => cfCall(cf.onRequest, r));

delete process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
// fresh module instance, so no service-account token is cached from the cases above
const fresh = (await import("../api/site-content.js?no-env")).default;
const noEnv = await vercelCall(fresh, { path: "/api/site-content" });
const okNoEnv = noEnv.status === 503 && typeof noEnv.json?.error?.message === "string";
if (!okNoEnv) failed++;
console.log(`\n  ${okNoEnv ? "✓" : "✗"} missing service account → 503 JSON (no crash)`);

console.log(failed ? `\n${failed} FAILED` : "\nall passed");
process.exit(failed ? 1 : 0);
