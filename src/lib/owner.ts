import { ADMIN_EMAIL, AMA_KEYS, FIREBASE } from "./data";

/* Owner auth helpers, shared by the AMA owner console and the site editor.
   Moved verbatim from Ask.tsx; the localStorage key is unchanged
   (AMA_KEYS.ownerAuth), so one sign-in covers both. */

export type Owner = { email: string; idToken: string; refreshToken: string; expiresAt: number };

export async function jfetch(url: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(url, opts);
  const txt = await res.text();
  let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = { raw: txt }; }
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  return data;
}
export function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
export function lsSet(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* private mode */ } }
export function lsDel(key: string) { try { localStorage.removeItem(key); } catch { /* */ } }

/* ---------- auth ---------- */
export const ownerAuth = (): Owner | null => lsGet<Owner | null>(AMA_KEYS.ownerAuth, null);
export const setOwnerAuth = (a: Owner | null) => (a ? lsSet(AMA_KEYS.ownerAuth, a) : lsDel(AMA_KEYS.ownerAuth));

export async function refreshTokenIfNeeded(force = false): Promise<string> {
  const a = ownerAuth();
  if (!a?.refreshToken) throw new Error("Login again.");
  if (!force && a.expiresAt && Date.now() < a.expiresAt - 60000) return a.idToken;
  const data = await jfetch(`https://securetoken.googleapis.com/v1/token?key=${FIREBASE.apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "refresh_token", refresh_token: a.refreshToken }).toString(),
  });
  setOwnerAuth({ ...a, idToken: data.id_token, refreshToken: data.refresh_token || a.refreshToken, expiresAt: Date.now() + Number(data.expires_in || 3600) * 1000 });
  return data.id_token;
}

/** Password sign-in. Rejects any account other than the admin's. */
export async function signInOwner(email: string, password: string): Promise<Owner> {
  const data = await jfetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE.apiKey}`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: email.trim(), password, returnSecureToken: true }),
  });
  if (data.email !== ADMIN_EMAIL) throw new Error("Wrong account.");
  const next = { email: data.email, idToken: data.idToken, refreshToken: data.refreshToken, expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000 };
  setOwnerAuth(next);
  return next;
}

/** True when the stored session belongs to the admin. */
export function isOwner(): boolean {
  const a = ownerAuth();
  return !!(a?.idToken && a.email === ADMIN_EMAIL);
}

/** Fired after sign-in / sign-out so other parts of the page (the editor) can react. */
export const OWNER_EVENT = "v3:owner";
export function announceOwner() {
  window.dispatchEvent(new Event(OWNER_EVENT));
}

/** The server's message, whichever error shape it sent ({error:"…"} or {error:{message}}). */
export function apiErrorMessage(data: unknown): string {
  const e = (data as { error?: unknown } | null)?.error;
  if (typeof e === "string") return e;
  if (e && typeof e === "object" && typeof (e as { message?: unknown }).message === "string") return (e as { message: string }).message;
  return "";
}

/** True when this host has no /api (static preview / old deploy): 404, 405 or a non-JSON reply. */
export function apiMissing(response: Response | null): boolean {
  if (!response) return true;
  if (response.status === 404 || response.status === 405) return true;
  return !(response.headers.get("content-type") || "").includes("json");
}

/**
 * POST to an owner endpoint. On 401 the ID token is force-refreshed and the
 * request retried once before the owner is told to sign in again.
 */
export async function ownerPost(url: string, body: unknown): Promise<{ response: Response | null; data: any }> {
  const send = async (token: string) => {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify(body),
      });
      const data = (response.headers.get("content-type") || "").includes("json") ? await response.json().catch(() => null) : null;
      return { response, data };
    } catch {
      return { response: null as Response | null, data: null };
    }
  };
  let out = await send(await refreshTokenIfNeeded());
  if (out.response?.status === 401) out = await send(await refreshTokenIfNeeded(true));
  return out;
}
