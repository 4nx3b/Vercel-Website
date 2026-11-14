#!/usr/bin/env node
/**
 * Offline client-path checks for the shared owner profile write.
 *
 *   node scripts/test-owner-profile-client.mjs
 *
 * The API/database are mocked. This verifies Vercel uses its same-origin API,
 * while miuka and Wasmer route to the shared Vercel API and only use the
 * signed-in owner's direct Firestore write as a fallback.
 */
import assert from "node:assert/strict";
import { createServer } from "vite";

class MemoryStorage {
  values = new Map();
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}

const AVATAR = "data:image/png;base64,AA==";
const ownerProfile = "https://firestore.googleapis.com/v1/projects/therealreze-2a3bf/databases/(default)/documents/siteOwner/profile";
const response = (body, status = 200, contentType = "application/json") =>
  new Response(typeof body === "string" ? body : JSON.stringify(body), { status, headers: { "Content-Type": contentType } });

async function runScenario({ name, hostname, apiResponses, expectDirectWrite, expectApiWrite }) {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  const previousWindow = globalThis.window;
  const previousStorage = globalThis.localStorage;
  const previousFetch = globalThis.fetch;
  try {
    globalThis.window = { location: { hostname } };
    globalThis.localStorage = new MemoryStorage();
    const api = await vite.ssrLoadModule("/src/lib/site-content-api.ts");
    const apiRoot = api.siteContentApiUrlForHost(hostname);
    const apiProfileUrl = api.siteContentApiUrlForHost(hostname, "?profile=1");
    const owner = await vite.ssrLoadModule("/src/lib/owner.ts");
    owner.setOwnerAuth({
      email: "asaxxhiii@gmail.com",
      idToken: "owner-id-token",
      refreshToken: "unused-refresh-token",
      expiresAt: Date.now() + 60 * 60 * 1000,
    });
    const store = await vite.ssrLoadModule("/src/content/store.tsx");
    const calls = [];
    let apiIndex = 0;
    globalThis.fetch = async (input, init = {}) => {
      const url = String(input);
      const method = String(init.method || "GET").toUpperCase();
      calls.push({ url, method, headers: init.headers || {}, body: String(init.body || "") });

      if (url.startsWith(apiProfileUrl)) {
        const planned = apiResponses[apiIndex++];
        if (!planned) throw new Error(`Unexpected profile API request: ${method}`);
        return planned();
      }
      if (url.startsWith(ownerProfile) && method === "PATCH") {
        return response({ name: "projects/therealreze-2a3bf/databases/(default)/documents/siteOwner/profile" });
      }
      throw new Error(`Unexpected request: ${method} ${url}`);
    };

    await store.saveOwnerAvatar(AVATAR);
    const directWrite = calls.find((call) => call.url.startsWith(ownerProfile) && call.method === "PATCH");
    assert.equal(Boolean(directWrite), expectDirectWrite, `${name}: direct Firestore fallback mismatch`);
    if (directWrite) {
      assert.equal(directWrite.headers.Authorization || directWrite.headers.authorization, "Bearer owner-id-token");
      assert.equal(JSON.parse(directWrite.body).fields.avatar.stringValue, AVATAR);
    }

    const apiWrite = calls.find((call) => call.url.startsWith(apiProfileUrl) && call.method === "POST");
    assert.equal(Boolean(apiWrite), expectApiWrite, `${name}: shared API write mismatch`);
    if (apiWrite) {
      assert.equal(apiWrite.headers.Authorization, "Bearer owner-id-token");
      assert.equal(JSON.parse(apiWrite.body).avatar, AVATAR);
      assert.equal(apiWrite.url, apiProfileUrl);
    }
    if (["v3rsi0n.wasmer.app", "v3rsi0n.miuka.moe"].includes(hostname)) {
      assert.ok(apiRoot.startsWith("https://v3rsi0n.vercel.app/"), `${name}: should use the canonical Vercel API`);
    }
    console.log(`  ✓ ${name}`);
  } finally {
    await vite.close();
    if (previousWindow === undefined) delete globalThis.window;
    else globalThis.window = previousWindow;
    if (previousStorage === undefined) delete globalThis.localStorage;
    else globalThis.localStorage = previousStorage;
    if (previousFetch === undefined) delete globalThis.fetch;
    else globalThis.fetch = previousFetch;
  }
}

const apiMissing = () => response("<!doctype html>", 404, "text/html");
const apiRead = () => response({ resource: "siteOwner/profile", avatar: "" });
const apiSave = () => response({ resource: "siteOwner/profile", ok: true, updatedAt: "2026-01-01T00:00:00.000Z" });
const apiDenied = () => response({ error: { message: "service-account write denied", code: "http_403" } }, 403);

console.log("Shared profile client write paths");
await runScenario({ name: "Vercel uses its same-origin API", hostname: "v3rsi0n.vercel.app", apiResponses: [apiRead, apiSave], expectDirectWrite: false, expectApiWrite: true });
await runScenario({ name: "miuka uses the canonical Vercel API", hostname: "v3rsi0n.miuka.moe", apiResponses: [apiRead, apiSave], expectDirectWrite: false, expectApiWrite: true });
await runScenario({ name: "Wasmer uses the canonical Vercel API", hostname: "v3rsi0n.wasmer.app", apiResponses: [apiRead, apiSave], expectDirectWrite: false, expectApiWrite: true });
await runScenario({ name: "API 403 falls back to Firestore", hostname: "v3rsi0n.vercel.app", apiResponses: [apiRead, apiDenied], expectDirectWrite: true, expectApiWrite: true });
await runScenario({ name: "Wasmer API failure falls back to Firestore", hostname: "v3rsi0n.wasmer.app", apiResponses: [apiMissing], expectDirectWrite: true, expectApiWrite: false });
console.log("all passed");
