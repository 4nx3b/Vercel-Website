import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ABOUT, APP, FIREBASE, HERO, ROM_POST, SOCIALS } from "../lib/data";
import { OWNER_EVENT, isOwner, jfetch, refreshTokenIfNeeded } from "../lib/owner";

/* ------------------------------------------------------------------ *
 * Editable site content.
 *
 * Visitors see `deepMerge(DEFAULTS, published)`, where `published` comes from
 * the Firestore doc siteContent/live (field `json`, a JSON string) and is
 * cached in localStorage so the page renders at once. The signed-in owner
 * edits a draft (persisted locally) and publishes it with their token.
 * ------------------------------------------------------------------ */

export type Block = { id: string; type: "text" | "image"; text?: string; src?: string; alt?: string };
export type SectionId = "hero" | "work" | "about" | "ask" | "links" | "footer";

export const DEFAULTS = {
  version: 1,
  hero: {
    kicker: HERO.kicker,
    pill: HERO.pill,
    line1: HERO.lines[0] as string,
    line2: HERO.lines[1] as string,
    line3: HERO.lines[2] as string,
    emphasis: HERO.emphasis,
    age: HERO.age,
    gender: HERO.gender,
    ctaPrimary: HERO.ctaPrimary,
    ctaSecondary: HERO.ctaSecondary,
    portrait: "art/hero-portrait-900.webp",
    portraitAlt: "Anime illustration: a blue-haired bassist sitting on a laundromat bench beside her bass",
  },
  rom: {
    title: ROM_POST.title,
    codename: ROM_POST.codename,
    variant: ROM_POST.variant,
    dateLabel: ROM_POST.dateLabel,
    maintainer: ROM_POST.maintainer,
    thumbnail: ROM_POST.thumbnail,
    thumbnailAlt: ROM_POST.thumbnailAlt,
    links: ROM_POST.links.map((l) => ({ label: l.label, url: l.url, primary: !!l.primary })),
    changelog: [...ROM_POST.changelog],
    tip: ROM_POST.tip,
    notesLead: ROM_POST.notesLead,
    notes: [...ROM_POST.notes],
    warning: ROM_POST.warning,
  },
  app: { title: APP.title, desc: APP.desc, tags: [...APP.tags] },
  about: {
    line: ABOUT.facts.line,
    interests: ABOUT.interests.map((i) => ({ title: i.title, desc: i.desc })),
    devices: ABOUT.devices.map((d) => ({ role: d.role, device: d.device, detail: d.detail, aside: d.aside ?? "" })),
    gamesLead: ABOUT.gamesLead,
    games: [...ABOUT.games],
  },
  socials: SOCIALS.map((s) => ({ name: s.name, handle: s.handle, url: s.url })),
  footer: {
    line: "Versioned in public, tested on real hardware.",
    band: "art/footer-band-1280.webp",
    bandAlt: "Anime key visual: four bandmates carrying guitar cases across a sunlit crosswalk",
    bandKicker: "End of transmission",
    bandLine: "Thanks for scrolling. Go flash something.",
  },
  blocks: { hero: [], work: [], about: [], ask: [], links: [], footer: [] } as Record<SectionId, Block[]>,
};

export type SiteContent = typeof DEFAULTS;

const CACHE_KEY = "site_content_v1";
const DRAFT_KEY = "site_content_draft_v1";
const DOC_URL = () =>
  `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents/siteContent/live`;

/* ---------------- helpers ---------------- */

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

function isObj(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

/** Objects merge key by key; arrays and scalars from `over` replace `base`. */
export function deepMerge<T>(base: T, over: unknown): T {
  if (!isObj(base) || !isObj(over)) return (over === undefined ? base : (over as T)) ?? base;
  const out: Record<string, unknown> = { ...(base as Record<string, unknown>) };
  for (const [k, v] of Object.entries(over)) {
    if (v === undefined) continue;
    const b = (base as Record<string, unknown>)[k];
    out[k] = isObj(b) && isObj(v) ? deepMerge(b, v) : Array.isArray(v) ? v : typeof v === typeof b || b === undefined ? v : b;
  }
  return out as T;
}

export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o == null ? undefined : (o as Record<string, unknown>)[k]), obj);
}

function setPath<T>(obj: T, path: string, value: unknown): T {
  const keys = path.split(".");
  const clone = (v: unknown): any => (Array.isArray(v) ? [...v] : isObj(v) ? { ...v } : {});
  const root = clone(obj);
  let cur = root;
  keys.forEach((k, i) => {
    if (i === keys.length - 1) cur[k] = value;
    else {
      cur[k] = clone(cur[k]);
      cur = cur[k];
    }
  });
  return root;
}

function read<T>(key: string): T | null {
  try {
    const v = localStorage.getItem(key);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
function write(key: string, v: unknown) {
  try {
    if (v == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(v));
  } catch {
    /* private mode */
  }
}

/* ---------------- public read / owner write ---------------- */

type PublicDoc = { json: Json; updatedAt: string | null; via: "api" | "firestore" };

/**
 * What visitors see. /api/site-content reads with the service account, so it
 * works even before the siteContent rules are deployed (anonymous direct
 * reads get 403 until then). Falls back to a direct Firestore read.
 */
export async function readPublished(): Promise<PublicDoc | null> {
  try {
    const r = await fetch(`/api/site-content?t=${Date.now()}`, { cache: "no-store", headers: { Accept: "application/json" } });
    if (r.ok && (r.headers.get("content-type") || "").includes("json")) {
      const d = await r.json();
      if (typeof d?.json === "string") return { json: JSON.parse(d.json) as Json, updatedAt: d.updatedAt ?? null, via: "api" };
    }
  } catch {
    /* no API here (preview) */
  }
  try {
    const doc = await jfetch(DOC_URL());
    const raw = doc?.fields?.json?.stringValue;
    if (typeof raw === "string") return { json: JSON.parse(raw) as Json, updatedAt: doc?.fields?.updatedAt?.stringValue ?? null, via: "firestore" };
  } catch {
    /* rules not deployed, or offline */
  }
  return null;
}

/** Owner write: server endpoint (verifies the token at Google), else direct PATCH. Returns updatedAt. */
async function writePublished(payload: unknown): Promise<string> {
  const token = await refreshTokenIfNeeded();
  const text = JSON.stringify(payload);
  try {
    const r = await fetch("/api/site-content", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ json: text }),
    });
    const ct = r.headers.get("content-type") || "";
    if (ct.includes("json")) {
      const d = await r.json();
      if (r.ok && d?.updatedAt) return d.updatedAt as string;
      if (r.status !== 404 && r.status !== 503) throw new Error(d?.error || `Publish failed (${r.status})`);
    }
  } catch (e) {
    if (!/Failed to fetch|NetworkError|Load failed/i.test((e as Error).message)) throw e;
  }
  const now = new Date().toISOString();
  await jfetch(`${DOC_URL()}?updateMask.fieldPaths=json&updateMask.fieldPaths=updatedAt`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
    body: JSON.stringify({ fields: { json: { stringValue: text }, updatedAt: { stringValue: now } } }),
  });
  return now;
}

/* ---------------- context ---------------- */

export type Status = { kind: "idle" | "saving" | "saved" | "warn" | "error"; msg?: string };

type Ctx = {
  content: SiteContent;
  owner: boolean;
  editing: boolean;
  dirty: boolean;
  status: Status;
  setEditing: (v: boolean) => void;
  set: (path: string, value: unknown) => void;
  publish: () => Promise<void>;
  discard: () => void;
  reset: () => Promise<void>;
  publishedAt: string | null;
};

const ContentCtx = createContext<Ctx | null>(null);

export function useContent() {
  const c = useContext(ContentCtx);
  if (!c) throw new Error("useContent outside ContentProvider");
  return c;
}

/** [value, setter] for one path, e.g. useField<string>("hero.kicker"). */
export function useField<T = string>(path: string): [T, (v: T) => void] {
  const { content, set } = useContent();
  return [getPath(content, path) as T, (v: T) => set(path, v)];
}

export function ContentProvider({ children }: { children: ReactNode }) {
  const [published, setPublished] = useState<Json | null>(() => read<Json>(CACHE_KEY));
  const [draft, setDraft] = useState<SiteContent | null>(() => (isOwner() ? read<SiteContent>(DRAFT_KEY) : null));
  const [owner, setOwner] = useState(() => isOwner());
  const [editing, setEditingState] = useState(false);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [publishedAt, setPublishedAt] = useState<string | null>(null);
  const draftRef = useRef(draft);
  draftRef.current = draft;

  // Load what is published (public read)
  useEffect(() => {
    let alive = true;
    (async () => {
      const doc = await readPublished();
      if (!alive || !doc) return;
      setPublished(doc.json);
      setPublishedAt(doc.updatedAt);
      write(CACHE_KEY, doc.json);
    })();
    return () => {
      alive = false;
    };
  }, []);

  // Follow sign-in / sign-out from the owner console
  useEffect(() => {
    const sync = () => {
      const o = isOwner();
      setOwner(o);
      if (!o) {
        setEditingState(false);
        setDraft(null);
      }
    };
    window.addEventListener(OWNER_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(OWNER_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const base = useMemo(() => deepMerge(DEFAULTS, published), [published]);
  const content = draft ?? base;

  const set = useCallback(
    (path: string, value: unknown) => {
      setDraft((d) => {
        const next = setPath(d ?? base, path, value);
        write(DRAFT_KEY, next);
        return next;
      });
      setStatus({ kind: "idle" });
    },
    [base]
  );

  /** Write, then confirm what an anonymous visitor would read. */
  const save = useCallback(async (payload: unknown): Promise<Status> => {
    const at = await writePublished(payload);
    setPublishedAt(at);
    const check = await readPublished();
    if (check && check.updatedAt === at) return { kind: "saved", msg: "Published, live for everyone" };
    return { kind: "warn", msg: "Published, but visitors can't read it yet: deploy firestore.rules" };
  }, []);

  const publish = useCallback(async () => {
    const d = draftRef.current;
    if (!d) return;
    setStatus({ kind: "saving" });
    try {
      const result = await save(d);
      setPublished(d as unknown as Json);
      write(CACHE_KEY, d);
      write(DRAFT_KEY, null);
      setDraft(null);
      setStatus(result);
    } catch (e) {
      const m = (e as Error).message || "";
      setStatus({
        kind: "error",
        msg: /permission|PERMISSION_DENIED|403/i.test(m) ? "Permission denied: deploy firestore.rules first" : m || "Couldn't publish",
      });
    }
  }, [save]);

  const discard = useCallback(() => {
    write(DRAFT_KEY, null);
    setDraft(null);
    setStatus({ kind: "idle" });
  }, []);

  const reset = useCallback(async () => {
    setStatus({ kind: "saving" });
    try {
      const result = await save({});
      setPublished({});
      write(CACHE_KEY, {});
      write(DRAFT_KEY, null);
      setDraft(null);
      setStatus(result.kind === "saved" ? { kind: "saved", msg: "Reset to defaults" } : result);
    } catch (e) {
      setStatus({ kind: "error", msg: (e as Error).message || "Couldn't reset" });
    }
  }, [save]);

  const setEditing = useCallback((v: boolean) => setEditingState(v && isOwner()), []);

  const value = useMemo<Ctx>(
    () => ({ content, owner, editing: editing && owner, dirty: !!draft, status, setEditing, set, publish, discard, reset, publishedAt }),
    [content, owner, editing, draft, status, setEditing, set, publish, discard, reset, publishedAt]
  );

  return <ContentCtx.Provider value={value}>{children}</ContentCtx.Provider>;
}
