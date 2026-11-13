#!/usr/bin/env node
/**
 * Offline client-path checks for the shared owner profile write.
 *
 *   node scripts/test-owner-profile-client.mjs
 *
 * The API/database are mocked. This verifies that Vercel's API path is preferred,
 * while a denied/missing API falls back to Firestore siteOwner/profile using the
 * signed-in owner's ID token (the path used by static hosts such as Wasmer).
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

async function runScenario(name, apiResponses, expectDirectWrite) {
  const vite = await createServer({ server: { middlewareMode: true }, appType: "custom", logLevel: "silent" });
  try {
    globalThis.localStorage = new MemoryStorage();
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

      if (url.startsWith("/api/site-content?profile=1")) {
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

    const apiWrite = calls.find((call) => call.url.startsWith("/api/site-content?profile=1") && call.method === "POST");
    if (name === "Vercel API success") {
      assert.ok(apiWrite, "Vercel should save through its same-origin API when it succeeds");
      assert.equal(apiWrite.headers.Authorization, "Bearer owner-id-token");
      assert.equal(JSON.parse(apiWrite.body).avatar, AVATAR);
    }
    console.log(`  ✓ ${name}`);
  } finally {
    await vite.close();
  }
}

const apiMissing = () => response("<!doctype html>", 404, "text/html");
const apiRead = () => response({ resource: "siteOwner/profile", avatar: "" });
const apiSave = () => response({ resource: "siteOwner/profile", ok: true, updatedAt: "2026-01-01T00:00:00.000Z" });
const apiDenied = () => response({ error: { message: "service-account write denied", code: "http_403" } }, 403);

console.log("Shared profile client write paths");
await runScenario("Vercel API success", [apiRead, apiSave], false);
await runScenario("Vercel API 403 falls back to Firestore", [apiRead, apiDenied], true);
await runScenario("Wasmer missing API falls back to Firestore", [apiMissing], true);
console.log("all passed");
