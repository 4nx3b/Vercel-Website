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

export async function refreshTokenIfNeeded(): Promise<string> {
  const a = ownerAuth();
  if (!a?.refreshToken) throw new Error("Login again.");
  if (a.expiresAt && Date.now() < a.expiresAt - 60000) return a.idToken;
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
