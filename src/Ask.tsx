import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { RefreshCw, ShieldCheck, X } from "lucide-react";
import { Reveal, SectionHead } from "./ui";
import { cn } from "./utils/cn";

/* ═══════════════════════════════════════════════════════════════════════════
   ASK / AMA — real integration, ported 1:1 from the previous site build.
   Firestore REST (answered questions, votes, owner queue) · anonymous public
   auth · /api/ama-vote with direct-PATCH fallback · /api/telegram notify ·
   Formspree email fallback · 10/day rate limit · owner login with
   answer / edit / dismiss / delete. localStorage keys unchanged, so
   existing votes, sort prefs, queues and owner sessions carry over.
   ═══════════════════════════════════════════════════════════════════════════ */

const FIREBASE = { apiKey: "AIzaSyCUG-oxLlGWKulnV8E0PwSEmr_s0EyCRUk", projectId: "therealreze-2a3bf" };
const ADMIN_EMAIL = "asaxxhiii@gmail.com";
const FORMSPREE_ENDPOINT = "https://formspree.io/f/mwvdqnyn";
const COL = "amaQuestions";
const AUTH_KEY = "ama_owner_auth_v4";
const PUBLIC_AUTH_KEY = "ama_public_anon_auth_v4";
const QUEUE_KEY = "ama_pending_questions_v4";
const VOTED_KEY = "ama_voted_question_ids_v6";
const SORT_KEY = "ama_public_sort_v6";
const DAILY_LIMIT = 10;
const PAGE_SIZE = 4;

const base = () => `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents`;
const docUrl = (id: string) => `${base()}/${COL}/${encodeURIComponent(id)}`;
const colUrl = () => `${base()}/${COL}`;
const queryUrl = () => `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents:runQuery`;

type AmaQ = {
  id: string; name: string; question: string; answer: string;
  answered: boolean; dismissed: boolean; votes: number;
  createdAt: string; answeredAt: string;
};
type Owner = { email: string; idToken: string; refreshToken: string; expiresAt: number };

/* ---------- tiny helpers (ported) ---------- */
async function jfetch(url: string, opts: RequestInit = {}): Promise<any> {
  const res = await fetch(url, opts);
  const txt = await res.text();
  let data: any = null;
  try { data = txt ? JSON.parse(txt) : null; } catch { data = { raw: txt }; }
  if (!res.ok) throw new Error(data?.error?.message || `HTTP ${res.status}`);
  return data;
}
const nowISO = () => new Date().toISOString();
const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : "q_" + Date.now() + "_" + Math.random().toString(16).slice(2));
function timeAgo(iso: string) {
  const t = new Date(iso || Date.now()).getTime();
  const d = Math.max(0, Date.now() - t), m = Math.floor(d / 60000), h = Math.floor(m / 60), day = Math.floor(h / 24);
  return day ? day + "d ago" : h ? h + "h ago" : m ? m + "m ago" : "now";
}
function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function lsSet(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* private mode */ } }
function lsDel(key: string) { try { localStorage.removeItem(key); } catch { /* */ } }

/* ---------- firestore value mapping (ported) ---------- */
function toFields(q: AmaQ) {
  return { fields: {
    id: { stringValue: q.id },
    name: { stringValue: q.name },
    question: { stringValue: q.question },
    answer: { stringValue: q.answer || "" },
    answered: { booleanValue: !!q.answered },
    dismissed: { booleanValue: !!q.dismissed },
    votes: { integerValue: String(Number(q.votes || 0)) },
    createdAt: { stringValue: q.createdAt || nowISO() },
    answeredAt: q.answeredAt ? { stringValue: q.answeredAt } : { nullValue: null },
  }};
}
function fromDoc(doc: any): AmaQ {
  const f = doc.fields || {};
  return {
    id: (f.id && f.id.stringValue) || (doc.name ? doc.name.split("/").pop() : ""),
    name: f.name?.stringValue || "Anonymous",
    question: f.question?.stringValue || "",
    answer: f.answer?.stringValue || "",
    answered: !!f.answered?.booleanValue,
    dismissed: !!f.dismissed?.booleanValue,
    votes: Number(f.votes?.integerValue || f.votes?.doubleValue || 0),
    createdAt: f.createdAt?.stringValue || "",
    answeredAt: f.answeredAt?.stringValue || "",
  };
}

/* ---------- auth (ported) ---------- */
const ownerAuth = (): Owner | null => lsGet<Owner | null>(AUTH_KEY, null);
const setOwnerAuth = (a: Owner | null) => (a ? lsSet(AUTH_KEY, a) : lsDel(AUTH_KEY));
let anonAuth: { idToken: string; refreshToken: string; expiresAt: number } | null = null;

async function publicToken(): Promise<string> {
  const stored = lsGet<{ idToken: string; refreshToken: string; expiresAt: number } | null>(PUBLIC_AUTH_KEY, null);
  if (stored?.idToken && stored.expiresAt && Date.now() < stored.expiresAt - 60000) return stored.idToken;
  const data = await jfetch("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + FIREBASE.apiKey, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }),
  });
  const next = { idToken: data.idToken, refreshToken: data.refreshToken, expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000 };
  lsSet(PUBLIC_AUTH_KEY, next);
  return next.idToken;
}
async function refreshTokenIfNeeded(): Promise<string> {
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

/* ---------- notify + queue (ported) ---------- */
async function writeQuestion(q: AmaQ) {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const a = ownerAuth();
    if (a?.idToken && a.email === ADMIN_EMAIL) headers.Authorization = "Bearer " + (await refreshTokenIfNeeded());
    else headers.Authorization = "Bearer " + (await publicToken());
  } catch (e) { console.warn("Public auth unavailable; trying Firestore write without token.", e); }
  await jfetch(docUrl(q.id), { method: "PATCH", headers, body: JSON.stringify(toFields(q)) });
}
function notifyTelegram(q: AmaQ) {
  return fetch("/api/telegram", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ name: q.name, question: q.question, id: q.id, createdAt: q.createdAt }),
  }).then(async (res) => {
    if (!res.ok) {
      let msg = "Telegram HTTP " + res.status;
      try { const data = await res.json(); msg = data?.error || msg; } catch { /* */ }
      throw new Error(msg);
    }
    return res;
  });
}
function notifyFormspree(q: AmaQ) {
  return fetch(FORMSPREE_ENDPOINT, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({
      _subject: "New AMA question from " + q.name, email: ADMIN_EMAIL, name: q.name, question: q.question,
      message: `New question on your website\n\nFrom: ${q.name}\nQuestion: ${q.question}`,
    }),
  }).then((res) => { if (!res.ok) throw new Error("Formspree HTTP " + res.status); return res; });
}
let flushInProgress = false;
async function flushQueue(): Promise<void> {
  if (flushInProgress) return;
  flushInProgress = true;
  try {
    let queue = lsGet<AmaQ[]>(QUEUE_KEY, []);
    if (!queue.length) return;
    const seen = new Set<string>();
    queue = queue.filter((item) => { if (!item?.id || seen.has(item.id)) return false; seen.add(item.id); return true; });
    const remaining: AmaQ[] = [];
    for (const item of queue) {
      const next = { ...item };
      let keepQueued = false;
      if (!next.telegramNotified) {
        (next as any).telegramNotified = true;
        lsSet(QUEUE_KEY, queue.map((x) => (x.id === next.id ? next : x)));
        try { await notifyTelegram(next); }
        catch (e) { console.warn("AMA Telegram notification failed; will retry later.", e); (next as any).telegramNotified = false; keepQueued = true; }
      }
      if (!(next as any).emailNotified) {
        try { await notifyFormspree(next); (next as any).emailNotified = true; }
        catch (e) { console.warn("AMA email fallback failed; will retry later.", e); }
      }
      try { await writeQuestion(next); }
      catch (e) { console.warn("AMA Firestore write pending; keeping question queued locally.", e); keepQueued = true; }
      if (keepQueued) remaining.push(next);
    }
    lsSet(QUEUE_KEY, remaining);
  } finally {
    flushInProgress = false;
  }
}

/* ---------- votes (ported, /api/ama-vote with direct PATCH fallback) ---------- */
async function syncVote(id: string, delta: number, optimistic: number): Promise<number> {
  try {
    const res = await fetch("/api/ama-vote", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id, delta }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || typeof data?.votes === "undefined") throw new Error(data?.error || "Vote API HTTP " + res.status);
    return Number(data.votes || 0);
  } catch (apiErr) {
    console.warn("Vote API unavailable, falling back to direct Firestore patch.", apiErr);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    try {
      const a = ownerAuth();
      if (a?.idToken && a.email === ADMIN_EMAIL) headers.Authorization = "Bearer " + (await refreshTokenIfNeeded());
      else headers.Authorization = "Bearer " + (await publicToken());
    } catch { /* anonymous */ }
    await jfetch(docUrl(id) + "?updateMask.fieldPaths=votes", {
      method: "PATCH", headers, body: JSON.stringify({ fields: { votes: { integerValue: String(optimistic) } } }),
    });
    return optimistic;
  }
}

/* ═══════════════════ UI ═══════════════════ */

type Sort = "top" | "recent" | "oldest";
const SORTS: { key: Sort; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "recent", label: "Recent" },
  { key: "oldest", label: "Oldest" },
];
const todayKey = () => "ama_count_" + new Date().toISOString().slice(0, 10);
const getUsed = () => { try { return Number(localStorage.getItem(todayKey()) || "0"); } catch { return 0; } };

function sortItems(items: AmaQ[], sort: Sort) {
  const arr = [...items];
  const stamp = (q: AmaQ) => new Date(q.answeredAt || q.createdAt || 0).getTime();
  if (sort === "oldest") arr.sort((a, b) => stamp(a) - stamp(b));
  else if (sort === "recent") arr.sort((a, b) => stamp(b) - stamp(a));
  else arr.sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0) || stamp(b) - stamp(a));
  return arr;
}

/* ---------- public question card ---------- */
function AmaItem({ q, owner, onVote, voted, onDelete }: {
  q: AmaQ; owner: boolean; voted: boolean;
  onVote: (id: string) => void; onDelete: (id: string) => void;
}) {
  return (
    <article className="px-5 py-5 sm:px-7">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-[10.5px] uppercase tracking-[0.16em] text-fog-dim">
        <span className="text-fog">from: {q.name}</span>
        <span className="ml-auto">{timeAgo(q.createdAt)}</span>
        {owner && (
          <button
            type="button" onClick={() => onDelete(q.id)}
            className="border border-coral/40 px-2 py-0.5 text-[10px] text-coral transition-colors hover:bg-coral/10"
            aria-label="Delete question"
          >
            del
          </button>
        )}
      </div>
      <p className="mt-2.5 break-words text-[15px] leading-relaxed text-snow">
        <span className="mr-2 font-mono text-[11px] text-fog-dim" aria-hidden>Q</span>{q.question}
      </p>
      <p className="mt-1.5 break-words text-sm leading-relaxed text-fog">
        <span className="mr-2 font-mono text-[11px] font-bold text-lime" aria-hidden>A</span>{q.answer}
      </p>
      <button
        type="button"
        onClick={() => onVote(q.id)}
        aria-pressed={voted}
        className={cn(
          "mt-4 inline-flex items-center gap-2 border px-3.5 py-1.5 font-mono text-[11px] tracking-[0.1em] transition-all duration-300",
          voted ? "border-lime/60 bg-lime/10 text-lime" : "border-line text-fog hover:border-lime/50 hover:text-snow"
        )}
      >
        ▲ <span className="tabular-nums">{Number(q.votes || 0)}</span>
      </button>
    </article>
  );
}

/* ---------- owner modal ---------- */
function OwnerModal({ onClose, onPublicChanged }: { onClose: () => void; onPublicChanged: () => void }) {
  const [auth, setAuth] = useState<Owner | null>(() => ownerAuth());
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [status, setStatus] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<AmaQ[] | null>(null);
  const [filter, setFilter] = useState<"unanswered" | "dismissed" | "answered">("unanswered");
  const isOwner = !!(auth?.idToken && auth.email === ADMIN_EMAIL);

  const state = (q: AmaQ) => (q.answered || (q.answer || "").trim() ? "answered" : q.dismissed ? "dismissed" : "unanswered");
  const counts = useMemo(() => {
    const c = { answered: 0, dismissed: 0, unanswered: 0 };
    (items || []).forEach((q) => { c[state(q) as keyof typeof c]++; });
    return c;
  }, [items]);
  const visible = useMemo(() => (items || []).filter((q) => state(q) === filter), [items, filter]);

  const loadOwner = useCallback(async () => {
    setStatus("Loading questions…"); setErr(false); setItems(null);
    try {
      const token = await refreshTokenIfNeeded();
      const data = await jfetch(colUrl() + "?pageSize=200", { headers: { Authorization: "Bearer " + token } });
      let list: AmaQ[] = (data.documents || []).map(fromDoc).filter((q: AmaQ) => q.question);
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      // normalize legacy answered docs (ported)
      const legacy = list.filter((q) => (q.answer || "").trim() && (!q.answered || q.dismissed));
      let fixed = 0;
      for (const q of legacy) {
        const answeredAt = q.answeredAt || q.createdAt || nowISO();
        try {
          await jfetch(docUrl(q.id) + "?updateMask.fieldPaths=answered&updateMask.fieldPaths=dismissed&updateMask.fieldPaths=answeredAt", {
            method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
            body: JSON.stringify({ fields: { answered: { booleanValue: true }, dismissed: { booleanValue: false }, answeredAt: { stringValue: answeredAt } } }),
          });
          const it = list.find((x) => x.id === q.id);
          if (it) { it.answered = true; it.dismissed = false; it.answeredAt = answeredAt; }
          fixed++;
        } catch (e) { console.warn("Legacy normalize failed for", q.id, e); }
      }
      setItems([...list]);
      if (!list.length) setStatus("No questions found in Firestore yet.");
      else setStatus(list.length + " question" + (list.length === 1 ? "" : "s") + " loaded." + (fixed ? " Fixed " + fixed + " old flag" + (fixed === 1 ? "" : "s") + "." : ""));
      if (fixed) onPublicChanged();
    } catch (e) {
      console.error("Owner load failed", e);
      setStatus((e as Error).message || "Could not load questions. Check Firestore rules."); setErr(true);
    }
  }, [onPublicChanged]);

  async function login(e?: FormEvent) {
    e?.preventDefault();
    if (!email.trim() || !pass) { setStatus("Enter email and password."); setErr(true); return; }
    setBusy(true);
    try {
      const data = await jfetch(`https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${FIREBASE.apiKey}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: pass, returnSecureToken: true }),
      });
      if (data.email !== ADMIN_EMAIL) throw new Error("Wrong account.");
      const next = { email: data.email, idToken: data.idToken, refreshToken: data.refreshToken, expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000 };
      setOwnerAuth(next); setAuth(next); setStatus(""); setErr(false);
    } catch (err) {
      console.error("Owner login failed", err);
      setStatus((err as Error).message || "Login failed."); setErr(true);
    } finally { setBusy(false); }
  }

  async function saveAnswer(q: AmaQ, answer: string) {
    const trimmed = answer.trim();
    if (!trimmed) { setStatus("Write an answer first."); setErr(true); return; }
    setBusy(true);
    try {
      const token = await refreshTokenIfNeeded();
      const savedAt = nowISO();
      await jfetch(docUrl(q.id) + "?updateMask.fieldPaths=answer&updateMask.fieldPaths=answered&updateMask.fieldPaths=answeredAt&updateMask.fieldPaths=dismissed", {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ fields: { answer: { stringValue: trimmed.slice(0, 1000) }, answered: { booleanValue: true }, answeredAt: { stringValue: savedAt }, dismissed: { booleanValue: false } } }),
      });
      setItems((prev) => (prev ? prev.map((x) => (x.id === q.id ? { ...x, answer: trimmed.slice(0, 1000), answered: true, dismissed: false, answeredAt: savedAt } : x)) : prev));
      setStatus("Answer saved."); setErr(false);
      onPublicChanged();
    } catch (err) {
      console.error("Save failed", err);
      setStatus((err as Error).message || "Could not save answer."); setErr(true);
    } finally { setBusy(false); }
  }
  async function dismiss(q: AmaQ) {
    if (!window.confirm("Dismiss this question?")) return;
    setBusy(true);
    try {
      const token = await refreshTokenIfNeeded();
      await jfetch(docUrl(q.id) + "?updateMask.fieldPaths=dismissed&updateMask.fieldPaths=answered", {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ fields: { dismissed: { booleanValue: true }, answered: { booleanValue: false } } }),
      });
      setItems((prev) => (prev ? prev.map((x) => (x.id === q.id ? { ...x, dismissed: true, answered: false } : x)) : prev));
      setStatus("Question dismissed."); setErr(false);
    } catch (err) {
      setStatus((err as Error).message || "Could not dismiss."); setErr(true);
    } finally { setBusy(false); }
  }
  async function remove(q: AmaQ) {
    if (!window.confirm("Delete this question permanently?")) return;
    setBusy(true);
    try {
      const token = await refreshTokenIfNeeded();
      await jfetch(docUrl(q.id), { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      setItems((prev) => (prev || []).filter((x) => x.id !== q.id));
      setStatus("Question deleted."); setErr(false);
      onPublicChanged();
    } catch (err) {
      setStatus((err as Error).message || "Could not delete question."); setErr(true);
    } finally { setBusy(false); }
  }
  async function editAnswer(q: AmaQ) {
    const next = window.prompt("Edit the answer:", q.answer || "");
    if (next === null) return;
    const answer = next.trim().slice(0, 1000);
    if (!answer) { setStatus("Answer cannot be empty."); setErr(true); return; }
    await saveAnswer(q, answer);
  }

  useEffect(() => { if (isOwner) void loadOwner(); }, [isOwner, loadOwner]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-ink-950/95 p-0 sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="AMA owner console">
      <div className="flex max-h-[92vh] w-full max-w-2xl flex-col border border-line bg-ink-900 pop-in">
        <div className="flex items-center justify-between border-b border-line px-5 py-4 sm:px-7">
          <p className="font-mono text-[11px] uppercase tracking-[0.24em] text-lime">
            <span className="text-fog-dim">$</span> ama — owner console
          </p>
          <button type="button" onClick={onClose} aria-label="Close owner console" className="flex h-9 w-9 items-center justify-center border border-line text-fog transition-colors hover:border-lime/50 hover:text-lime">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          {!isOwner ? (
            <form onSubmit={login} className="mx-auto flex max-w-sm flex-col gap-3 py-6">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="admin email"
                className="border border-line bg-ink-800 px-4 py-3 font-mono text-[13px] text-snow placeholder:text-fog-dim focus:border-lime/60 focus:outline-none" />
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" placeholder="password"
                className="border border-line bg-ink-800 px-4 py-3 font-mono text-[13px] text-snow placeholder:text-fog-dim focus:border-lime/60 focus:outline-none" />
              <button type="submit" disabled={busy} className="mt-1 skew-x-[-6deg] bg-lime px-6 py-3 font-mono text-[12px] font-bold uppercase tracking-[0.14em] text-ink-900 transition-colors hover:bg-lime-deep disabled:opacity-50 [&>*]:skew-x-[6deg]">
                <span>{busy ? "…" : "Login"}</span>
              </button>
              <p className="text-center font-mono text-[10px] uppercase tracking-[0.16em] text-fog-dim">reze only · answers, dismisses, deletes</p>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {(["unanswered", "dismissed", "answered"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setFilter(k)}
                    className={cn("border px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-all",
                      filter === k ? "border-lime/60 bg-lime/10 text-lime" : "border-line text-fog hover:border-lime/40 hover:text-snow")}>
                    {k} · {counts[k]}
                  </button>
                ))}
                <span className="ml-auto flex gap-2">
                  <button type="button" onClick={() => void loadOwner()} disabled={busy}
                    className="border border-line px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog transition-colors hover:border-lime/40 hover:text-snow disabled:opacity-50">
                    reload
                  </button>
                  <button type="button" onClick={() => { setOwnerAuth(null); setAuth(null); setItems(null); setStatus("Logged out."); }}
                    className="border border-line px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] text-fog transition-colors hover:border-coral/50 hover:text-coral">
                    logout
                  </button>
                </span>
              </div>

              {status && <p className={cn("mt-4 font-mono text-[11px]", err ? "text-coral" : "text-fog-dim")} role="status">{status}</p>}

              {items === null ? (
                <p className="py-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-fog-dim">loading…</p>
              ) : visible.length === 0 ? (
                <p className="py-8 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-fog-dim">no {filter} questions</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {visible.map((q) => (
                    <OwnerRow key={q.id} q={q} state={state(q)} busy={busy} onSave={(a) => void saveAnswer(q, a)} onDismiss={() => void dismiss(q)} onDelete={() => void remove(q)} onEdit={() => void editAnswer(q)} />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function OwnerRow({ q, state, busy, onSave, onDismiss, onDelete, onEdit }: {
  q: AmaQ; state: string; busy: boolean;
  onSave: (answer: string) => void; onDismiss: () => void; onDelete: () => void; onEdit: () => void;
}) {
  const [answer, setAnswer] = useState(q.answer || "");
  return (
    <li className="border border-line bg-ink-850 p-4">
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-fog-dim">{q.name} · {timeAgo(q.createdAt)} · {state}</p>
      <p className="mt-2 break-words text-sm leading-relaxed text-snow">{q.question}</p>
      {state === "dismissed" ? (
        q.answer ? <p className="mt-2 break-words text-sm text-fog">A: {q.answer}</p> : null
      ) : (
        <textarea value={answer} onChange={(e) => setAnswer(e.target.value)} readOnly={state === "answered"} rows={2} placeholder="Write your answer…"
          className="mt-2.5 w-full resize-none border border-line bg-ink-800 px-3.5 py-2.5 font-mono text-[12.5px] leading-relaxed text-snow placeholder:text-fog-dim focus:border-lime/60 focus:outline-none read-only:text-fog" />
      )}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {state === "unanswered" && (
          <>
            <button type="button" disabled={busy} onClick={() => onSave(answer)} className="bg-lime px-4 py-1.5 font-mono text-[10.5px] font-bold uppercase tracking-[0.12em] text-ink-900 transition-colors hover:bg-lime-deep disabled:opacity-50">save answer</button>
            <button type="button" disabled={busy} onClick={onDismiss} className="border border-line px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-fog transition-colors hover:border-lime/40 hover:text-snow disabled:opacity-50">dismiss</button>
          </>
        )}
        {state === "answered" && (
          <button type="button" disabled={busy} onClick={onEdit} className="border border-line px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-fog transition-colors hover:border-lime/40 hover:text-snow disabled:opacity-50">edit</button>
        )}
        <button type="button" disabled={busy} onClick={onDelete} className="border border-coral/40 px-4 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.12em] text-coral transition-colors hover:bg-coral/10 disabled:opacity-50">delete</button>
      </div>
    </li>
  );
}

/* ---------- main section ---------- */
export default function Ask() {
  const [items, setItems] = useState<AmaQ[] | null>(null);
  const [loadError, setLoadError] = useState(false);
  const [sort, setSort] = useState<Sort>(() => (typeof window === "undefined" ? "top" : ((localStorage.getItem(SORT_KEY) as Sort) || "top")));
  const [page, setPage] = useState(1);
  const [voted, setVoted] = useState<Set<string>>(() => new Set(lsGet<string[]>(VOTED_KEY, [])));
  const [used, setUsed] = useState(0);
  const [handle, setHandle] = useState("");
  const [msg, setMsg] = useState("");
  const [formErr, setFormErr] = useState("");
  const [sent, setSent] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const statusTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const flash = useCallback((text: string, ok = false) => {
    setFormErr(ok ? "" : text);
    if (ok) setSent(true);
    clearTimeout(statusTimer.current);
    statusTimer.current = setTimeout(() => { setFormErr(""); }, 3200);
  }, []);

  const loadPublic = useCallback(async (silent = false) => {
    if (!silent) { setItems(null); setLoadError(false); }
    try {
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      try {
        const a = ownerAuth();
        if (a?.idToken && a.email === ADMIN_EMAIL) headers.Authorization = "Bearer " + (await refreshTokenIfNeeded());
      } catch { /* public read needs no token */ }
      const data = await jfetch(queryUrl(), {
        method: "POST", headers,
        body: JSON.stringify({ structuredQuery: {
          from: [{ collectionId: COL }],
          where: { fieldFilter: { field: { fieldPath: "answered" }, op: "EQUAL", value: { booleanValue: true } } },
          limit: 80,
        }}),
      });
      setItems((data || []).filter((x: any) => x.document).map((x: any) => fromDoc(x.document)).filter((q: AmaQ) => (q.answer || "").trim()));
      setPage(1);
    } catch (e) {
      console.error("Public load failed", e);
      setLoadError(true);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    setUsed(getUsed());
    setIsOwner(!!(ownerAuth()?.idToken && ownerAuth().email === ADMIN_EMAIL));
    void loadPublic();
    void flushQueue();
    const iv = setInterval(() => void flushQueue(), 15000);
    return () => clearInterval(iv);
  }, [loadPublic]);

  const sorted = useMemo(() => sortItems(items || [], sort), [items, sort]);
  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pageItems = sorted.slice((safePage - 1) * PAGE_SIZE, (safePage - 1) * PAGE_SIZE + PAGE_SIZE);

  function changeSort(next: Sort) {
    setSort(next);
    try { localStorage.setItem(SORT_KEY, next); } catch { /* */ }
    setPage(1);
  }

  async function onVote(id: string) {
    if (!id || !items) return;
    const item = items.find((q) => q.id === id);
    if (!item) return;
    const wasVoted = voted.has(id);
    const delta = wasVoted ? -1 : 1;
    const previous = Number(item.votes || 0);
    const optimistic = Math.max(0, previous + delta);
    // optimistic UI
    setItems((prev) => (prev || []).map((q) => (q.id === id ? { ...q, votes: optimistic } : q)));
    const nextVoted = new Set(voted);
    if (wasVoted) nextVoted.delete(id); else nextVoted.add(id);
    setVoted(nextVoted);
    lsSet(VOTED_KEY, [...nextVoted]);
    try {
      const saved = await syncVote(id, delta, optimistic);
      setItems((prev) => (prev || []).map((q) => (q.id === id ? { ...q, votes: Math.max(0, Number(saved || 0)) } : q)));
    } catch (e) {
      console.warn("Vote sync failed; reverting optimistic vote state.", e);
      setItems((prev) => (prev || []).map((q) => (q.id === id ? { ...q, votes: previous } : q)));
      const revert = new Set(voted);
      if (wasVoted) revert.add(id); else revert.delete(id);
      setVoted(revert);
      lsSet(VOTED_KEY, [...revert]);
      flash("Could not save that upvote right now.");
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (getUsed() >= DAILY_LIMIT) { flash("Daily limit reached. Try again tomorrow."); return; }
    const name = handle.trim().slice(0, 60);
    const question = msg.trim().slice(0, 280);
    if (name.length < 2 || question.length < 8) { flash("Handle + at least a sentence, please."); return; }
    const q: AmaQ = { id: uuid(), name, question, answer: "", answered: false, dismissed: false, votes: 0, createdAt: nowISO(), answeredAt: "" };
    const queue = lsGet<AmaQ[]>(QUEUE_KEY, []);
    queue.push(q);
    lsSet(QUEUE_KEY, queue);
    try { localStorage.setItem(todayKey(), String(getUsed() + 1)); } catch { /* */ }
    setUsed(getUsed());
    setMsg("");
    flash("Question sent — routed to Telegram and the queue.", true);
    void flushQueue();
  }

  async function ownerDeletePublic(id: string) {
    if (!id || !window.confirm("Delete this question permanently?")) return;
    try {
      const token = await refreshTokenIfNeeded();
      await jfetch(docUrl(id), { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      setItems((prev) => (prev || []).filter((q) => q.id !== id));
    } catch (e) {
      console.error("Delete failed", e);
      flash("Could not delete: " + ((e as Error).message || "unknown error"));
    }
  }

  return (
    <section id="ask" className="relative overflow-hidden border-t border-line py-24 md:py-32">
      <div className="grid-lines pointer-events-none absolute inset-0 opacity-40 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_40%,black,transparent)]" aria-hidden />
      <div className="glow-breathe pointer-events-none absolute left-1/2 top-1/2 h-[480px] w-[760px] max-w-none -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/[0.06] blur-[130px]" aria-hidden />

      <div className="relative mx-auto max-w-7xl px-5 sm:px-8">
        <SectionHead
          index="08"
          kicker="ask · anything"
          title={<>Ask the <span className="text-lime">builder.</span></>}
          note="Real questions, real answers — drop one below and it lands in the queue (Telegram + email), then gets answered here. Upvote the good ones."
        />

        <div className="grid items-start gap-4 lg:grid-cols-[0.92fr_1.08fr]">
          {/* left — the answered log */}
          <Reveal variant="left">
            <div className="border border-line bg-ink-850/90 backdrop-blur-sm">
              <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-3.5 sm:px-7">
                <span className="font-mono text-[10.5px] uppercase tracking-[0.22em] text-fog-dim">ama.log — answered</span>
                <span className="ml-auto flex items-center gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-fog-dim">used {Math.min(used, DAILY_LIMIT)}/{DAILY_LIMIT} today</span>
                  <button type="button" onClick={() => { setRefreshing(true); void loadPublic().finally(() => setRefreshing(false)); }}
                    aria-label="Refresh answered questions" title="Refresh"
                    className="flex h-8 w-8 items-center justify-center border border-line text-fog transition-colors hover:border-lime/50 hover:text-lime">
                    <RefreshCw className={cn("h-3.5 w-3.5", refreshing && "animate-spin")} />
                  </button>
                  <button type="button" onClick={() => setOwnerOpen(true)}
                    aria-label="Owner login" title="Owner login"
                    className="flex h-8 w-8 items-center justify-center border border-line text-fog transition-colors hover:border-lime/50 hover:text-lime">
                    <ShieldCheck className="h-3.5 w-3.5" />
                  </button>
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-3 sm:px-7">
                {SORTS.map((s) => (
                  <button key={s.key} type="button" onClick={() => changeSort(s.key)}
                    className={cn("border px-3.5 py-1.5 font-mono text-[10.5px] uppercase tracking-[0.14em] transition-all",
                      sort === s.key ? "border-lime/60 bg-lime/10 text-lime" : "border-line text-fog hover:border-lime/40 hover:text-snow")}>
                    {s.label}
                  </button>
                ))}
                {totalPages > 1 && (
                  <span className="ml-auto flex gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => (
                      <button key={i} type="button" onClick={() => setPage(i + 1)}
                        className={cn("h-7 w-7 border font-mono text-[10.5px] transition-all",
                          safePage === i + 1 ? "border-lime bg-lime text-ink-900 font-bold" : "border-line text-fog hover:border-lime/40 hover:text-snow")}>
                        {i + 1}
                      </button>
                    ))}
                  </span>
                )}
              </div>

              <div className="divide-y divide-line">
                {items === null ? (
                  <p className="px-5 py-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-fog-dim" role="status">loading questions…</p>
                ) : loadError ? (
                  <p className="px-5 py-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-coral">could not load answered questions — check firestore rules</p>
                ) : pageItems.length === 0 ? (
                  <p className="px-5 py-10 text-center font-mono text-[11px] uppercase tracking-[0.18em] text-fog-dim">no answered questions yet. be the first menace.</p>
                ) : (
                  pageItems.map((q) => (
                    <AmaItem key={q.id} q={q} owner={isOwner} voted={voted.has(q.id)} onVote={(id) => void onVote(id)} onDelete={(id) => void ownerDeletePublic(id)} />
                  ))
                )}
              </div>
            </div>
          </Reveal>

          {/* right — the form */}
          <Reveal variant="right" delay={120}>
            <div className="border border-line bg-ink-850/90 p-7 backdrop-blur-sm sm:p-8">
              <p className="font-mono text-[10px] uppercase tracking-[0.26em] text-fog-dim">$ new question --from you</p>
              <label htmlFor="ama-handle" className="mt-5 block font-mono text-[10.5px] uppercase tracking-[0.22em] text-fog-dim">your handle</label>
              <input id="ama-handle" value={handle} onChange={(e) => { setHandle(e.target.value); setFormErr(""); setSent(false); }} placeholder="@you" maxLength={60} autoComplete="off"
                className="mt-2 w-full border border-line bg-ink-800 px-4 py-3 font-mono text-[13px] text-snow placeholder:text-fog-dim transition-colors focus:border-lime/60 focus:outline-none" />
              <label htmlFor="ama-msg" className="mt-5 block font-mono text-[10.5px] uppercase tracking-[0.22em] text-fog-dim">the question</label>
              <textarea id="ama-msg" value={msg} onChange={(e) => { setMsg(e.target.value); setFormErr(""); setSent(false); }} placeholder="Why does my vendor partition hate me?" rows={4} maxLength={280}
                className="mt-2 w-full resize-none border border-line bg-ink-800 px-4 py-3 font-mono text-[13px] text-snow placeholder:text-fog-dim transition-colors focus:border-lime/60 focus:outline-none" />
              <div className="mt-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.14em] text-fog-dim">
                <span>{msg.length}/280</span>
                <span>queue → telegram + email</span>
              </div>

              {formErr && <p className="mt-3 font-mono text-[11px] text-coral" role="alert">▲ {formErr}</p>}
              {sent && !formErr && (
                <p className="mt-3 flex items-center gap-2 font-mono text-[11px] text-mint" role="status">
                  <span className="inline-block h-1.5 w-1.5 rounded-full bg-mint" aria-hidden /> question routed — expect an answer here soon
                </p>
              )}

              <button type="button" onClick={(e) => void submit(e as unknown as FormEvent)}
                className="group mt-6 inline-flex skew-x-[-6deg] items-center gap-2.5 bg-lime px-7 py-3.5 font-mono text-[12.5px] font-bold uppercase tracking-[0.14em] text-ink-900 transition-all duration-300 hover:bg-lime-deep [&>*]:skew-x-[6deg]">
                <span className="inline-flex items-center gap-2.5">
                  Transmit
                  <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden>
                    <path d="M4 12 12 4M6 4h6v6" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </button>
              <p className="mt-4 font-mono text-[10px] uppercase tracking-[0.16em] text-fog-dim">
                live delivery via telegram webhook · {DAILY_LIMIT}/day rate limit · upvotes stored locally
              </p>
            </div>
          </Reveal>
        </div>
      </div>

      {ownerOpen && <OwnerModal onClose={() => setOwnerOpen(false)} onPublicChanged={() => void loadPublic(true)} />}
    </section>
  );
}
