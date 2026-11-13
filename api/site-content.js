import { createSign, randomUUID } from "node:crypto";

/**
 * Vercel API for the live site editor.
 *
 * Writes intentionally go through the service-account endpoint rather than
 * the browser's Firestore REST API. That keeps publishing independent of the
 * deployed client security rules while still authenticating the owner with a
 * Firebase ID token. Public reads use the same endpoint so every visitor sees
 * the published document and uploaded image assets.
 */

const DEFAULT_PROJECT_ID = "therealreze-2a3bf";
const WEB_API_KEY = "AIzaSyCUG-oxLlGWKulnV8E0PwSEmr_s0EyCRUk";
const ADMIN_EMAIL = "asaxxhiii@gmail.com";
const MAX_JSON_BYTES = 900 * 1024;
const MAX_IMAGE_BYTES = 1000 * 1000;
const MAX_PROFILE_AVATAR_BYTES = 220_000;
const IMAGE_DATA_URL = /^data:image\/(webp|png|jpeg);base64,([A-Za-z0-9+/]+={0,2})$/;
const PROFILE_AVATAR_DATA_URL = /^data:image\/(webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;

export const config = { api: { bodyParser: { sizeLimit: "3mb" } } };

function httpError(message, status, code) {
  return Object.assign(new Error(message), { status, code });
}

/** One error shape for every response: { error: { message, code } }. */
function errBody(message, code) {
  return { error: { message, code: code || "error" } };
}

function serviceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) throw httpError("Missing FIREBASE_SERVICE_ACCOUNT_KEY on the Vercel project", 503);

  let account;
  try {
    account = JSON.parse(raw);
  } catch {
    throw httpError("FIREBASE_SERVICE_ACCOUNT_KEY is not valid JSON", 503);
  }
  if (!account.client_email || !account.private_key) {
    throw httpError("FIREBASE_SERVICE_ACCOUNT_KEY must include client_email and private_key", 503);
  }
  return account;
}

const b64url = (value) =>
  Buffer.from(value).toString("base64").replace(/=/g, "").replace(/\+/g, "-").replace(/\//g, "_");

let cachedToken = null;
async function googleAccessToken() {
  if (cachedToken && cachedToken.exp > Date.now() + 60_000) return cachedToken.value;

  const account = serviceAccount();
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }))}.${b64url(
    JSON.stringify({
      iss: account.client_email,
      scope: "https://www.googleapis.com/auth/datastore",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  )}`;
  const signature = createSign("RSA-SHA256")
    .update(unsigned)
    .sign(account.private_key, "base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`,
    }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok || !data?.access_token) {
    throw httpError(data?.error_description || `Google service-account token request failed (${response.status})`, 502);
  }

  cachedToken = {
    value: data.access_token,
    exp: Date.now() + Number(data.expires_in || 3600) * 1000,
  };
  return cachedToken.value;
}

function docUrl(path) {
  const projectId = process.env.FIREBASE_PROJECT_ID || DEFAULT_PROJECT_ID;
  if (projectId !== DEFAULT_PROJECT_ID) {
    throw httpError(`FIREBASE_PROJECT_ID must be ${DEFAULT_PROJECT_ID} to share content with the client`, 503);
  }
  return `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/${path}`;
}

async function firestore(method, url, body) {
  const token = await googleAccessToken();
  const response = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const data = await response.json().catch(() => null);
  if (response.status === 404) return null;
  if (!response.ok) {
    const message = data?.error?.message || `Firestore ${method} failed (${response.status})`;
    throw httpError(message, response.status === 403 ? 403 : response.status >= 500 ? 502 : response.status);
  }
  return data;
}

/**
 * Trust the identity returned by Google, never an email supplied in a body.
 * Ownership = a valid Google-issued ID token whose account email is the admin's.
 * Email *verification* is deliberately not required: the owner signs in with
 * email + password, and those accounts are unverified unless a link was
 * clicked. That gate is what made "Set profile icon" fail with 403.
 */
async function requireOwner(req) {
  const authorization = req.headers?.authorization || req.headers?.Authorization || "";
  const idToken = String(authorization).replace(/^Bearer\s+/i, "").trim();
  if (!idToken) throw httpError("Sign in as the site owner first", 401);

  const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${WEB_API_KEY}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ idToken }),
  });
  const data = await response.json().catch(() => null);
  const user = data?.users?.[0];
  const email = String(user?.email || "").toLowerCase();
  if (!response.ok) {
    throw httpError("The owner sign-in has expired or is invalid. Sign in again.", 401, "token_invalid");
  }
  if (email !== ADMIN_EMAIL.toLowerCase()) {
    throw httpError("This account is not the site owner.", 401, "not_owner");
  }
}

async function readBody(req) {
  if (req.body !== undefined && req.body !== null) {
    if (typeof req.body === "object") return req.body;
    try {
      return JSON.parse(String(req.body || "{}"));
    } catch {
      throw httpError("Request body must be valid JSON", 400);
    }
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    throw httpError("Request body must be valid JSON", 400);
  }
}

function send(res, status, obj, cache = "no-store", headOnly = false) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", cache);
  res.end(headOnly ? undefined : JSON.stringify(obj));
}

function sendError(res, error) {
  const status = Number.isInteger(error?.status) ? error.status : 500;
  return send(res, status, errBody(error?.message || "Site content request failed", error?.code || `http_${status}`));
}

export default async function handler(req, res) {
  const url = new URL(req.url || "/", "http://localhost");
  const imageId = url.searchParams.get("image");
  const ownerProfile = url.searchParams.get("profile") === "1";

  try {
    if (req.method === "GET" || req.method === "HEAD") {
      if (ownerProfile) {
        const doc = await firestore("GET", docUrl("siteOwner/profile"));
        return send(
          res,
          200,
          {
            resource: "siteOwner/profile",
            avatar: doc?.fields?.avatar?.stringValue || "",
            updatedAt: doc?.fields?.updatedAt?.stringValue || null,
          },
          "no-store",
          req.method === "HEAD"
        );
      }

      if (imageId) {
        if (!/^[\w-]{4,80}$/.test(imageId)) return send(res, 400, errBody("Invalid image ID"));
        const doc = await firestore("GET", docUrl(`siteImages/${imageId}`));
        const dataUrl = doc?.fields?.data?.stringValue || "";
        const match = dataUrl.match(IMAGE_DATA_URL);
        if (!match) return send(res, 404, errBody("Image not found"));

        res.statusCode = 200;
        res.setHeader("Content-Type", `image/${match[1]}`);
        res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
        return res.end(req.method === "HEAD" ? undefined : Buffer.from(match[2], "base64"));
      }

      const doc = await firestore("GET", docUrl("siteContent/live"));
      return send(
        res,
        200,
        {
          json: doc?.fields?.json?.stringValue || "{}",
          updatedAt: doc?.fields?.updatedAt?.stringValue || null,
        },
        "public, max-age=0, s-maxage=5, stale-while-revalidate=5",
        req.method === "HEAD"
      );
    }

    if (req.method === "POST") {
      await requireOwner(req);
      const body = await readBody(req);
      const now = new Date().toISOString();

      if (ownerProfile) {
        const avatar = typeof body?.avatar === "string" ? body.avatar : "";
        if (avatar && !PROFILE_AVATAR_DATA_URL.test(avatar)) {
          return send(res, 400, errBody("Expected a PNG, JPEG, or WebP profile image"));
        }
        if (Buffer.byteLength(avatar, "utf8") > MAX_PROFILE_AVATAR_BYTES) {
          return send(res, 413, errBody("Profile image is too large"));
        }

        await firestore("PATCH", `${docUrl("siteOwner/profile")}?updateMask.fieldPaths=avatar&updateMask.fieldPaths=updatedAt`, {
          fields: {
            avatar: { stringValue: avatar },
            updatedAt: { stringValue: now },
          },
        });
        return send(res, 200, { resource: "siteOwner/profile", ok: true, updatedAt: now });
      }

      if (imageId) {
        const dataUrl = String(body?.data || "");
        const match = dataUrl.match(IMAGE_DATA_URL);
        if (!match) return send(res, 400, errBody("Expected a WebP, PNG, or JPEG image data URL"));
        if (Buffer.byteLength(dataUrl) > MAX_IMAGE_BYTES) return send(res, 413, errBody("Image is too large"));

        const id = randomUUID().replace(/-/g, "");
        await firestore("PATCH", docUrl(`siteImages/${id}`), {
          fields: {
            data: { stringValue: dataUrl },
            createdAt: { stringValue: now },
          },
        });
        return send(res, 200, { ok: true, id });
      }

      const json = typeof body?.json === "string" ? body.json : JSON.stringify(body?.json ?? {});
      if (Buffer.byteLength(json, "utf8") > MAX_JSON_BYTES) return send(res, 413, errBody("Site content is too large"));
      let parsed;
      try {
        parsed = JSON.parse(json);
      } catch {
        return send(res, 400, errBody("Published content must be valid JSON"));
      }
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
        return send(res, 400, errBody("Published content must be a JSON object"));
      }

      await firestore("PATCH", `${docUrl("siteContent/live")}?updateMask.fieldPaths=json&updateMask.fieldPaths=updatedAt`, {
        fields: {
          json: { stringValue: json },
          updatedAt: { stringValue: now },
        },
      });
      return send(res, 200, { ok: true, updatedAt: now });
    }

    res.setHeader("Allow", "GET, HEAD, POST");
    return send(res, 405, errBody("Method not allowed"));
  } catch (error) {
    return sendError(res, error);
  }
}
