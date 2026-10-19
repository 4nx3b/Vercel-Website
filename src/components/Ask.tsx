import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { cn } from "../utils/cn";
import {
  ADMIN_EMAIL, AMA_COLLECTION, AMA_KEYS, FIREBASE, FORMSPREE_ENDPOINT, SEED_QUESTIONS,
} from "../lib/data";
import { CheckIcon, CloseIcon, RefreshIcon } from "./icons";
import { MonoTag, SectionHead, StatusDot } from "./ui";
import { Reveal } from "./Reveal";

/* ══════════════════════════════════════════════════════════════════════
   ASK / AMA — ported 1:1 from the previous build:
   Firestore REST · anonymous public auth · /api/ama-vote with direct
   PATCH fallback · /api/telegram notify · Formspree email fallback ·
   10/day rate limit · owner login with answer / edit / dismiss / delete.
   localStorage keys unchanged, so existing sessions + votes carry over.
   ══════════════════════════════════════════════════════════════════════ */

type AmaQ = {
  id: string; name: string; question: string; answer: string;
  answered: boolean; dismissed: boolean; votes: number;
  createdAt: string; answeredAt: string;
};
type Owner = { email: string; idToken: string; refreshToken: string; expiresAt: number };
type Pending = AmaQ & { telegramNotified?: boolean; emailNotified?: boolean };

const base = () => `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents`;
const docUrl = (id: string) => `${base()}/${AMA_COLLECTION}/${encodeURIComponent(id)}`;
const colUrl = () => `${base()}/${AMA_COLLECTION}`;
const queryUrl = () => `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents:runQuery`;

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
function timeAgo(iso: string | number) {
  const t = typeof iso === "number" ? iso : new Date(iso || Date.now()).getTime();
  const d = Math.max(0, Date.now() - t);
  const m = Math.floor(d / 60000), h = Math.floor(m / 60), day = Math.floor(h / 24);
  return day ? day + "d ago" : h ? h + "h ago" : m ? m + "m ago" : "now";
}
function lsGet<T>(key: string, fallback: T): T {
  try { const v = localStorage.getItem(key); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; }
}
function lsSet(key: string, v: unknown) { try { localStorage.setItem(key, JSON.stringify(v)); } catch { /* private mode */ } }
function lsDel(key: string) { try { localStorage.removeItem(key); } catch { /* */ } }

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
  } };
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

/* ---------- auth ---------- */
const ownerAuth = (): Owner | null => lsGet<Owner | null>(AMA_KEYS.ownerAuth, null);
const setOwnerAuth = (a: Owner | null) => (a ? lsSet(AMA_KEYS.ownerAuth, a) : lsDel(AMA_KEYS.ownerAuth));

async function publicToken(): Promise<string> {
  const stored = lsGet<{ idToken: string; refreshToken: string; expiresAt: number } | null>(AMA_KEYS.publicAuth, null);
  if (stored?.idToken && stored.expiresAt && Date.now() < stored.expiresAt - 60000) return stored.idToken;
  const data = await jfetch("https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=" + FIREBASE.apiKey, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ returnSecureToken: true }),
  });
  const next = { idToken: data.idToken, refreshToken: data.refreshToken, expiresAt: Date.now() + Number(data.expiresIn || 3600) * 1000 };
  lsSet(AMA_KEYS.publicAuth, next);
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

async function authHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  try {
    const a = ownerAuth();
    if (a?.idToken && a.email === ADMIN_EMAIL) headers.Authorization = "Bearer " + (await refreshTokenIfNeeded());
    else headers.Authorization = "Bearer " + (await publicToken());
  } catch { /* anonymous */ }
  return headers;
}

/* ---------- notify + queue ---------- */
async function writeQuestion(q: AmaQ) {
  await jfetch(docUrl(q.id), { method: "PATCH", headers: await authHeaders(), body: JSON.stringify(toFields(q)) });
}
function notifyTelegram(q: AmaQ) {
  return fetch("/api/telegram", {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ name: q.name, question: q.question, id: q.id, createdAt: q.createdAt }),
  }).then((res) => { if (!res.ok) throw new Error("Telegram HTTP " + res.status); return res; });
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
    let queue = lsGet<Pending[]>(AMA_KEYS.queue, []);
    if (!queue.length) return;
    const seen = new Set<string>();
    queue = queue.filter((item) => { if (!item?.id || seen.has(item.id)) return false; seen.add(item.id); return true; });
    const remaining: Pending[] = [];
    for (const item of queue) {
      const next = { ...item };
      let keepQueued = false;
      if (!next.telegramNotified) {
        next.telegramNotified = true;
        lsSet(AMA_KEYS.queue, queue.map((x) => (x.id === next.id ? next : x)));
        try { await notifyTelegram(next); } catch { next.telegramNotified = false; keepQueued = true; }
      }
      if (!next.emailNotified) {
        try { await notifyFormspree(next); next.emailNotified = true; } catch { /* retry later */ }
      }
      try { await writeQuestion(next); } catch { keepQueued = true; }
      if (keepQueued) remaining.push(next);
    }
    lsSet(AMA_KEYS.queue, remaining);
  } finally {
    flushInProgress = false;
  }
}

async function syncVote(id: string, delta: number, optimistic: number): Promise<number> {
  try {
    const res = await fetch("/api/ama-vote", {
      method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ id, delta }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || typeof data?.votes === "undefined") throw new Error(data?.error || "Vote API HTTP " + res.status);
    return Number(data.votes || 0);
  } catch {
    await jfetch(docUrl(id) + "?updateMask.fieldPaths=votes", {
      method: "PATCH", headers: await authHeaders(), body: JSON.stringify({ fields: { votes: { integerValue: String(optimistic) } } }),
    });
    return optimistic;
  }
}

/* ---------- sorting + pagination ---------- */
type Sort = "top" | "recent" | "oldest";
const SORTS: { key: Sort; label: string }[] = [
  { key: "top", label: "Top" },
  { key: "recent", label: "Recent" },
  { key: "oldest", label: "Oldest" },
];
const stamp = (q: AmaQ) => new Date(q.answeredAt || q.createdAt || 0).getTime();
function sortItems(items: AmaQ[], sort: Sort) {
  const arr = [...items];
  if (sort === "oldest") arr.sort((a, b) => stamp(a) - stamp(b));
  else if (sort === "recent") arr.sort((a, b) => stamp(b) - stamp(a));
  else arr.sort((a, b) => Number(b.votes || 0) - Number(a.votes || 0) || stamp(b) - stamp(a));
  return arr;
}
const todayKey = () => "ama_count_" + new Date().toISOString().slice(0, 10);
const getUsed = () => { try { return Number(localStorage.getItem(todayKey()) || "0"); } catch { return 0; } }

/* ================= Owner console ================= */

function OwnerConsole({ onClose, onChanged }: { onClose: () => void; onChanged: () => void }) {
  const [auth, setAuth] = useState<Owner | null>(() => ownerAuth());
  const [email, setEmail] = useState("");
  const [pass, setPass] = useState("");
  const [status, setStatus] = useState("");
  const [err, setErr] = useState(false);
  const [busy, setBusy] = useState(false);
  const [items, setItems] = useState<AmaQ[] | null>(null);
  const [filter, setFilter] = useState<"unanswered" | "dismissed" | "answered">("unanswered");
  const [drafts, setDrafts] = useState<Record<string, string>>({});
  const [editing, setEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ id: string; kind: "dismiss" | "delete" } | null>(null);
  const isOwner = !!(auth?.idToken && auth.email === ADMIN_EMAIL);

  const state = (q: AmaQ) => (q.answered || (q.answer || "").trim() ? "answered" : q.dismissed ? "dismissed" : "unanswered");
  const counts = useMemo(() => {
    const c = { answered: 0, dismissed: 0, unanswered: 0 };
    (items || []).forEach((q) => { c[state(q) as keyof typeof c]++; });
    return c;
  }, [items]);
  const visible = useMemo(() => (items || []).filter((q) => state(q) === filter), [items, filter]);

  const load = useCallback(async () => {
    setStatus("Loading questions…"); setErr(false);
    try {
      const token = await refreshTokenIfNeeded();
      const data = await jfetch(colUrl() + "?pageSize=200", { headers: { Authorization: "Bearer " + token } });
      const list: AmaQ[] = (data.documents || []).map(fromDoc).filter((q: AmaQ) => q.question);
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setItems(list);
      setStatus(list.length ? `${list.length} question${list.length === 1 ? "" : "s"} loaded.` : "No questions in Firestore yet.");
      onChanged();
    } catch (e) {
      setStatus((e as Error).message || "Could not load questions.");
      setErr(true);
    }
  }, [onChanged]);

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
    } catch (e2) {
      setStatus((e2 as Error).message || "Login failed."); setErr(true);
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
      setEditing(null); setDrafts((d) => ({ ...d, [q.id]: "" }));
      setStatus("Answer saved."); setErr(false);
      onChanged();
    } catch (e2) { setStatus((e2 as Error).message || "Could not save answer."); setErr(true); }
    finally { setBusy(false); }
  }
  async function dismiss(q: AmaQ) {
    setBusy(true);
    try {
      const token = await refreshTokenIfNeeded();
      await jfetch(docUrl(q.id) + "?updateMask.fieldPaths=dismissed&updateMask.fieldPaths=answered", {
        method: "PATCH", headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
        body: JSON.stringify({ fields: { dismissed: { booleanValue: true }, answered: { booleanValue: false } } }),
      });
      setItems((prev) => (prev ? prev.map((x) => (x.id === q.id ? { ...x, dismissed: true, answered: false } : x)) : prev));
      setStatus("Question dismissed."); setErr(false);
    } catch (e2) { setStatus((e2 as Error).message || "Could not dismiss."); setErr(true); }
    finally { setBusy(false); setConfirm(null); }
  }
  async function remove(q: AmaQ) {
    setBusy(true);
    try {
      const token = await refreshTokenIfNeeded();
      await jfetch(docUrl(q.id), { method: "DELETE", headers: { Authorization: "Bearer " + token } });
      setItems((prev) => (prev || []).filter((x) => x.id !== q.id));
      setStatus("Question deleted."); setErr(false);
      onChanged();
    } catch (e2) { setStatus((e2 as Error).message || "Could not delete question."); setErr(true); }
    finally { setBusy(false); setConfirm(null); }
  }

  useEffect(() => { if (isOwner) void load(); }, [isOwner, load]);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-obsidian-canvas/85 p-0 backdrop-blur-md sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label="AMA owner console">
      <div className="flex max-h-[92vh] w-full max-w-2xl animate-frame-in flex-col rounded-t-lg border border-ash-stroke bg-panel sm:rounded-lg">
        <div className="flex items-center justify-between border-b border-carbon-lift bg-carbon-lift/40 px-5 py-4 sm:px-7">
          <div className="flex items-center gap-2.5">
            <StatusDot tone="orange" pulse />
            <MonoTag className="text-pale-stone"><span className="text-signal-orange">$</span> ama — owner console</MonoTag>
          </div>
          <div className="flex items-center gap-3">
            {isOwner && (
              <button onClick={() => { setOwnerAuth(null); setAuth(null); setItems(null); }} className="font-geist-mono text-caption uppercase tracking-[-0.02em] text-warm-granite transition-colors duration-150 hover:text-signal-orange">
                Logout
              </button>
            )}
            <button type="button" onClick={onClose} aria-label="Close owner console" className="text-warm-granite transition-colors duration-150 hover:text-chalk">
              <CloseIcon className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5 sm:px-7">
          {!isOwner ? (
            <form onSubmit={login} className="mx-auto flex max-w-sm flex-col gap-3 py-6">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="owner email"
                className="rounded-sm border border-carbon-lift bg-carbon-lift/30 px-4 py-3 font-geist-mono text-caption text-bone placeholder:text-graphite-mid focus:border-ash-stroke focus:outline-none" />
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} autoComplete="current-password" placeholder="password"
                className="rounded-sm border border-carbon-lift bg-carbon-lift/30 px-4 py-3 font-geist-mono text-caption text-bone placeholder:text-graphite-mid focus:border-ash-stroke focus:outline-none" />
              <button type="submit" disabled={busy}
                className="mt-1 inline-flex h-10 items-center justify-center rounded-sm bg-chalk px-6 font-geist text-body-sm text-obsidian-canvas transition-colors duration-150 hover:bg-bone disabled:opacity-50">
                {busy ? "…" : "Login"}
              </button>
              {status && <MonoTag className={cn("text-center", err ? "text-signal-orange" : "text-pale-stone")}>{status}</MonoTag>}
              <MonoTag className="text-center text-graphite-mid">reze only · answer / edit / dismiss / delete</MonoTag>
            </form>
          ) : (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {(["unanswered", "dismissed", "answered"] as const).map((k) => (
                  <button key={k} type="button" onClick={() => setFilter(k)}
                    className={cn(
                      "rounded-sm border px-3 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] transition-colors duration-150",
                      filter === k ? "border-signal-orange/60 bg-signal-orange/10 text-signal-orange" : "border-carbon-lift text-warm-granite hover:border-ash-stroke hover:text-bone"
                    )}>
                    {k} <span className="opacity-60 tabular">{counts[k]}</span>
                  </button>
                ))}
                <button type="button" onClick={() => void load()} aria-label="Refresh"
                  className="ml-auto flex h-8 w-8 items-center justify-center rounded-sm border border-carbon-lift text-warm-granite transition-colors duration-150 hover:border-ash-stroke hover:text-bone">
                  <RefreshIcon className="h-3.5 w-3.5" />
                </button>
              </div>

              {status && <MonoTag className={cn("mt-3 block", err ? "text-signal-orange" : "text-pale-stone")}>{status}</MonoTag>}

              <ul className="mt-4 space-y-4">
                {items === null && <li className="py-8 text-center"><MonoTag className="text-graphite-mid">decrypting wire…</MonoTag></li>}
                {items !== null && visible.length === 0 && (
                  <li className="py-8 text-center"><MonoTag className="text-graphite-mid">nothing in “{filter}”</MonoTag></li>
                )}
                {visible.map((q) => (
                  <li key={q.id} className="rounded-md border border-carbon-lift bg-carbon-lift/15 p-4">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                      <MonoTag className="text-pale-stone">from: {q.name}</MonoTag>
                      <MonoTag className="ml-auto text-graphite-mid tabular">▲ {q.votes} · {timeAgo(q.createdAt)}</MonoTag>
                    </div>
                    <p className="mt-2 break-words text-body-sm text-bone">{q.question}</p>
                    {q.answer && (
                      <p className="mt-1.5 break-words text-body-sm text-warm-granite">
                        <span className="mr-1.5 font-geist-mono text-[11px] text-metric-green">A</span>{q.answer}
                      </p>
                    )}

                    {/* Actions */}
                    <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-carbon-lift pt-3">
                      {filter !== "answered" && editing !== q.id && (
                        <button onClick={() => { setEditing(q.id); setDrafts((d) => ({ ...d, [q.id]: q.answer || "" })); }}
                          className="rounded-sm bg-carbon-lift px-3 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-bone transition-colors duration-150 hover:bg-graphite-mid">
                          {q.answer ? "Edit answer" : "Answer"}
                        </button>
                      )}
                      {confirm?.id === q.id ? (
                        <>
                          <MonoTag className="text-signal-orange">{confirm.kind === "delete" ? "delete for real?" : "dismiss?"}</MonoTag>
                          <button onClick={() => (confirm.kind === "delete" ? remove(q) : dismiss(q))} disabled={busy}
                            className="rounded-sm bg-signal-orange px-3 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-obsidian-canvas transition-colors duration-150 hover:bg-signal-orange/80">
                            yes
                          </button>
                          <button onClick={() => setConfirm(null)} className="rounded-sm border border-carbon-lift px-3 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-warm-granite hover:border-ash-stroke hover:text-bone">
                            no
                          </button>
                        </>
                      ) : (
                        <>
                          {filter !== "dismissed" && (
                            <button onClick={() => setConfirm({ id: q.id, kind: "dismiss" })}
                              className="rounded-sm border border-carbon-lift px-3 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-warm-granite transition-colors duration-150 hover:border-ash-stroke hover:text-bone">
                              dismiss
                            </button>
                          )}
                          <button onClick={() => setConfirm({ id: q.id, kind: "delete" })}
                            className="rounded-sm border border-signal-orange/40 px-3 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-signal-orange transition-colors duration-150 hover:bg-signal-orange/10">
                            del
                          </button>
                        </>
                      )}
                    </div>

                    {editing === q.id && (
                      <div className="mt-3 animate-log-in">
                        <textarea
                          value={drafts[q.id] ?? ""}
                          onChange={(e) => setDrafts((d) => ({ ...d, [q.id]: e.target.value }))}
                          rows={3} maxLength={1000} placeholder="Write the reply…"
                          className="w-full resize-none rounded-sm border border-carbon-lift bg-obsidian-canvas px-3 py-2.5 text-body-sm text-bone placeholder:text-graphite-mid focus:border-ash-stroke focus:outline-none"
                        />
                        <div className="mt-2 flex gap-2">
                          <button onClick={() => saveAnswer(q, drafts[q.id] ?? "")} disabled={busy}
                            className="rounded-sm bg-chalk px-3 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-obsidian-canvas transition-colors duration-150 hover:bg-bone disabled:opacity-50">
                            Save answer
                          </button>
                          <button onClick={() => setEditing(null)} className="rounded-sm border border-carbon-lift px-3 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-warm-granite hover:border-ash-stroke hover:text-bone">
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ================= Public section ================= */

export function Ask() {
  const [items, setItems] = useState<AmaQ[]>([]);
  const [pending, setPending] = useState<AmaQ[]>(() => lsGet<Pending[]>(AMA_KEYS.queue, []).map((q) => ({ ...q, answered: false, dismissed: false })));
  const [voted, setVoted] = useState<string[]>(() => lsGet<string[]>(AMA_KEYS.voted, []));
  const [sort, setSort] = useState<Sort>(() => lsGet<Sort>(AMA_KEYS.sort, "top"));
  const [name, setName] = useState("");
  const [text, setText] = useState("");
  const [status, setStatus] = useState<{ kind: "ok" | "err"; msg: string } | null>(null);
  const [page, setPage] = useState(1);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const PAGE = 4;

  const reload = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const data = await jfetch(queryUrl(), {
        method: "POST", headers,
        body: JSON.stringify({ structuredQuery: { from: [{ collectionId: AMA_COLLECTION }], orderBy: { field: { fieldPath: "createdAt" }, direction: "DESCENDING" }, limit: 100 } }),
      });
      const list = (Array.isArray(data) ? data : []).filter((d: any) => d.document).map((d: any) => fromDoc(d.document));
      setItems(list.filter((q: AmaQ) => q.question && q.answered && !q.dismissed));
    } catch {
      setItems(SEED_QUESTIONS.map((s) => ({
        id: s.id, name: s.author, question: s.text, answer: "", answered: true, dismissed: false,
        votes: s.votes, createdAt: new Date(s.ts).toISOString(), answeredAt: new Date(s.ts).toISOString(),
      })));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void reload(); void flushQueue(); }, [reload]);
  useEffect(() => { lsSet(AMA_KEYS.sort, sort); setPage(1); }, [sort]);
  useEffect(() => { lsSet(AMA_KEYS.voted, voted); }, [voted]);

  const sorted = useMemo(() => sortItems(items, sort), [items, sort]);
  const shown = sorted.slice(0, page * PAGE);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    const q = text.trim();
    if (!q) return;
    if (getUsed() >= 10) { setStatus({ kind: "err", msg: "Daily limit reached (10). Come back tomorrow." }); return; }
    const doc: Pending = {
      id: uuid(), name: name.trim() || "anon", question: q, answer: "", answered: false, dismissed: false,
      votes: 0, createdAt: nowISO(), answeredAt: "",
    };
    localStorage.setItem(todayKey(), String(getUsed() + 1));
    const queue = [...lsGet<Pending[]>(AMA_KEYS.queue, []), doc];
    lsSet(AMA_KEYS.queue, queue);
    setPending((p) => [doc, ...p]);
    setText("");
    setStatus({ kind: "ok", msg: "Transmitted — queued for the wire." });
    setTimeout(() => setStatus(null), 2200);
    void flushQueue().then(reload);
  };

  const vote = async (id: string, current: number) => {
    if (voted.includes(id)) return;
    setVoted((v) => [...v, id]);
    setItems((prev) => prev.map((q) => (q.id === id ? { ...q, votes: current + 1 } : q)));
    try { await syncVote(id, 1, current + 1); } catch { /* optimistic */ }
  };

  return (
    <section id="ask" className="mx-auto max-w-[1200px] px-6 pb-24 lg:pb-28">
      <SectionHead index="06" title="Ask" note="AMA · firestore wire" />

      <div className="mt-12 grid gap-12 lg:grid-cols-[1fr_1.25fr] lg:gap-16">
        {/* Transmit */}
        <div>
          <Reveal>
            <div className="flex items-start justify-between gap-4">
              <h2 className="font-geist text-heading-lg tracking-[-0.025em] text-bone">
                Ask me anything<span className="text-signal-orange">.</span>
              </h2>
              <button
                onClick={() => setOwnerOpen(true)}
                className="shrink-0 rounded-sm border border-carbon-lift px-3 py-2 font-geist-mono text-caption uppercase tracking-[-0.02em] text-warm-granite backdrop-blur-sm transition-colors duration-150 hover:border-ash-stroke hover:text-bone"
              >
                Owner
              </button>
            </div>
            <p className="mt-5 max-w-md text-body text-warm-granite">
              Root, ROMs, anime, anything. Questions hit Firestore and ping my Telegram — answers
              show up here once I've replied. 10 questions per visitor per day.
            </p>
          </Reveal>

          <Reveal delay={80}>
            <form onSubmit={submit} className="mt-8 flex flex-col gap-3">
              <label htmlFor="ama-name" className="sr-only">Name (optional)</label>
              <input
                id="ama-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={40}
                placeholder="name (optional)"
                className="h-10 rounded-sm border border-carbon-lift bg-carbon-lift/20 px-4 font-geist-mono text-caption text-bone placeholder:text-graphite-mid backdrop-blur-sm focus:border-ash-stroke focus:outline-none"
              />
              <label htmlFor="ama-text" className="sr-only">Your question</label>
              <textarea
                id="ama-text" value={text} onChange={(e) => setText(e.target.value)} rows={4} required maxLength={280}
                placeholder="Type the question… 280 chars, no mercy."
                className="w-full resize-none rounded-sm border border-carbon-lift bg-carbon-lift/20 p-4 text-body text-bone placeholder:text-graphite-mid backdrop-blur-sm transition-colors duration-150 focus:border-ash-stroke focus:outline-none"
              />
              <div className="flex items-center justify-between gap-4">
                <MonoTag className="text-graphite-mid tabular">{280 - text.length} left</MonoTag>
                <button type="submit"
                  className="inline-flex h-10 items-center gap-2 rounded-sm bg-carbon-lift px-4 font-geist text-body-sm text-bone transition-all duration-150 hover:bg-graphite-mid hover:text-chalk active:scale-[0.98]">
                  {status?.kind === "ok" ? (<><CheckIcon className="h-3.5 w-3.5 text-metric-green" />Transmitted</>) : "Transmit"}
                </button>
              </div>
              {status?.kind === "err" && <MonoTag className="text-signal-orange">{status.msg}</MonoTag>}
            </form>
          </Reveal>
        </div>

        {/* The wire */}
        <Reveal delay={120}>
          <div className="flex items-center justify-between border-t border-carbon-lift pt-5">
            <MonoTag className="text-pale-stone">The wire — {String(sorted.length + pending.length).padStart(2, "0")} signals</MonoTag>
            <div className="flex gap-2">
              {SORTS.map((s) => (
                <button key={s.key} onClick={() => setSort(s.key)}
                  className={cn(
                    "rounded-sm px-2.5 py-1.5 font-geist-mono text-caption uppercase tracking-[-0.02em] transition-colors duration-150",
                    sort === s.key ? "bg-chalk text-obsidian-canvas" : "border border-carbon-lift text-warm-granite hover:border-ash-stroke hover:text-bone"
                  )}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <ul className="mt-5">
            {loading && <li className="py-8 text-center"><MonoTag className="text-graphite-mid">tapping the wire…</MonoTag></li>}

            {pending.map((q) => (
              <li key={q.id} className="flex gap-5 border-b border-carbon-lift py-5 opacity-70">
                <span className="flex h-fit shrink-0 flex-col items-center gap-1 border border-carbon-lift px-3 py-2">
                  <span className="text-body-sm leading-none text-graphite-mid">▲</span>
                  <span className="font-geist-mono text-caption tabular text-graphite-m">{q.votes}</span>
                </span>
                <div>
                  <p className="text-body text-bone">{q.question}</p>
                  <div className="mt-2 flex items-center gap-2">
                    <StatusDot tone="orange" pulse />
                    <MonoTag className="text-signal-orange">queued — awaiting reply · {q.name}</MonoTag>
                  </div>
                </div>
              </li>
            ))}

            {!loading && shown.map((q) => {
              const isVoted = voted.includes(q.id);
              return (
                <li key={q.id} className="group flex gap-5 border-b border-carbon-lift py-5 transition-colors duration-150 hover:bg-carbon-lift/20">
                  <button
                    onClick={() => vote(q.id, q.votes)}
                    aria-label={`Upvote: ${q.question}`} aria-pressed={isVoted}
                    className={cn(
                      "flex h-fit shrink-0 flex-col items-center gap-1 border px-3 py-2 transition-all duration-150 active:scale-95",
                      isVoted ? "border-signal-orange/60 bg-signal-orange/10 text-signal-orange" : "border-carbon-lift text-warm-granite hover:border-ash-stroke hover:text-bone"
                    )}>
                    <span className="text-body-sm leading-none">▲</span>
                    <span className="font-geist-mono text-caption tabular">{q.votes}</span>
                  </button>
                  <div>
                    <p className="text-body text-bone">
                      <span className="mr-2 font-geist-mono text-[11px] text-graphite-mid">Q</span>{q.question}
                    </p>
                    {q.answer && (
                      <p className="mt-1.5 text-body-sm text-warm-granite">
                        <span className="mr-2 font-geist-mono text-[11px] text-metric-green">A</span>{q.answer}
                      </p>
                    )}
                    <MonoTag className="mt-2 block text-graphite-mid">{timeAgo(q.answeredAt || q.createdAt)} · {q.name}</MonoTag>
                  </div>
                </li>
              );
            })}

            {sorted.length > shown.length && (
              <li className="pt-5">
                <button onClick={() => setPage((p) => p + 1)}
                  className="rounded-sm border border-carbon-lift px-4 py-2.5 font-geist-mono text-caption uppercase tracking-[-0.02em] text-warm-granite transition-colors duration-150 hover:border-ash-stroke hover:text-bone">
                  Load more ({sorted.length - shown.length} older)
                </button>
              </li>
            )}
          </ul>
        </Reveal>
      </div>

      {ownerOpen && <OwnerConsole onClose={() => setOwnerOpen(false)} onChanged={reload} />}
    </section>
  );
}
