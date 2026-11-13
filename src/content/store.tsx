import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { ABOUT, ANIME, APP, FIREBASE, GAMES, HERO, MUSIC, NAV_LINKS, PARTITIONS, PLAYLISTS, QUIZ, ROM_POST, SOCIALS } from "../lib/data";
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
  version: 2,
  brand: { name: "v3rsi0n", logotype: "V3RSI0N" },
  nav: {
    links: NAV_LINKS.map((link) => ({ ...link })),
    cta: "Ask me",
  },
  hero: {
    kicker: HERO.kicker,
    pill: HERO.pill,
    line1: HERO.lines[0] as string,
    line2: HERO.lines[1] as string,
    line3: HERO.lines[2] as string,
    emphasis: HERO.emphasis,
    age: HERO.age,
    gender: HERO.gender,
    flag: HERO.flag,
    country: HERO.country,
    ctaPrimary: HERO.ctaPrimary,
    ctaSecondary: HERO.ctaSecondary,
    portrait: "art/hero-portrait-900.webp",
    portraitAlt: "Anime illustration: a blue-haired bassist sitting on a laundromat bench beside her bass",
    stickerOne: "Flash it, don’t fear it",
    stickerTwo: "v3rsi0n / ROM.LOG",
    benchKicker: "Bench",
    benchTitle: "Take a stock device apart, one partition at a time.",
    benchDescription: "Pick a partition to see what lives there, or flash the whole stack.",
    figureCaption: "Fig. 1 — Partition stack, exploded",
    figureAlt: "Figure 1: an exploded isometric phone with userdata, vendor, system, and boot partitions",
    partitions: PARTITIONS.map((partition) => ({ ...partition })),
  },
  work: {
    sectionLabel: "Work",
    titleLine1: "One ROM, one app,",
    titleLine2: "both",
    titleEmphasis: "shipped",
  },
  rom: {
    title: ROM_POST.title,
    codename: ROM_POST.codename,
    variant: ROM_POST.variant,
    date: ROM_POST.date,
    dateLabel: ROM_POST.dateLabel,
    releasedLabel: "Released",
    maintainerLabel: "Maintainer",
    changelogLabel: "Changelog",
    tipLabel: "Tip",
    notesLabel: "Notes",
    warningLabel: "Warning",
    maintainer: ROM_POST.maintainer,
    maintainerUrl: ROM_POST.maintainerUrl,
    thumbnail: ROM_POST.thumbnail,
    thumbnailAlt: ROM_POST.thumbnailAlt,
    links: ROM_POST.links.map((l) => ({ label: l.label, url: l.url, primary: !!l.primary })),
    changelog: [...ROM_POST.changelog],
    tip: ROM_POST.tip,
    notesLead: ROM_POST.notesLead,
    notes: [...ROM_POST.notes],
    warning: ROM_POST.warning,
  },
  app: {
    name: APP.name,
    repo: APP.repo,
    sector: APP.sector,
    title: APP.title,
    desc: APP.desc,
    tags: [...APP.tags],
    link: APP.link,
    linkLabel: APP.linkLabel,
  },
  about: {
    sectionLabel: "About",
    titleLead: "The person behind",
    titleMiddle: "the",
    titleEmphasis: "builds",
    shortTitle: "The short version.",
    deviceRoleLabel: "Role",
    deviceNameLabel: "Device",
    deviceDetailLabel: "Detail",
    intoLabel: "Into",
    devicesLabel: "Devices",
    gamesLabel: "Games",
    playTitle: "The playground.",
    playDescription: "Four canvas games in a modal, nothing at stake. High scores stay in your browser. Escape closes any of them.",
    animeTitle: "Logged on AniList.",
    animePrompt: `anilist stats --user ${ANIME.handle}`,
    animeGet: "The full watch list, scored.",
    anilistHandle: ANIME.handle,
    anilistLinkLabel: `${ANIME.handle} on AniList`,
    anilistUrl: ANIME.url,
    musicTitle: "Mostly J-pop and EDM.",
    musicPrompt: `last.fm now --user ${MUSIC.handle}`,
    musicGet: "Scrobbles, top artists, the lot.",
    musicChecks: [
      ABOUT.interests[2].desc,
      "Five playlists: Japanese, English, Hindi, Phonk and a mix.",
      "Three tracks on rotation live in the header player.",
      "Scrobbled on Last.fm.",
    ],
    lastfmHandle: MUSIC.handle,
    lastfmLinkLabel: `${MUSIC.handle} on Last.fm`,
    lastfmUrl: MUSIC.url,
    musicPlaylistsLabel: "My YouTube Music playlists",
    tabLabels: ["Me", "Anime", "Music", "Play"],
    line: ABOUT.facts.line,
    age: ABOUT.facts.age,
    gender: ABOUT.facts.gender,
    flag: ABOUT.facts.flag,
    country: ABOUT.facts.country,
    interests: ABOUT.interests.map((i) => ({ title: i.title, desc: i.desc })),
    devices: ABOUT.devices.map((d) => ({ role: d.role, device: d.device, detail: d.detail, aside: d.aside ?? "" })),
    gamesLead: ABOUT.gamesLead,
    games: [...ABOUT.games],
  },
  play: {
    games: GAMES.map((game) => ({ ...game })),
    quiz: QUIZ.map((item) => ({ ...item, opts: [...item.opts], roasts: [...item.roasts] })),
    modalFooter: "ESC to eject · scores persist locally",
  },
  ask: {
    sectionLabel: "Ask",
    titleLead: "Ask me",
    titleEmphasis: "anything",
    lede: "Root, ROMs, anime, whatever. Questions land in Firestore and ping my Telegram; answers show up here once I’ve replied. Ten per visitor per day.",
    composerTitle: "New question",
    questionLabel: "Your question",
    questionPlaceholder: "Magisk or KernelSU for a fresh install?",
    nameLabel: "Name",
    nameOptional: "(optional)",
    namePlaceholder: "anon",
    sendLabel: "Send question",
    answeredLabel: "Answered",
    sortLabels: ["Top", "Recent", "Oldest"],
  },
  links: {
    sectionLabel: "Elsewhere",
    title: "Twelve channels, all of them read.",
    description: "Telegram is fastest for build support. Everything else is where the anime, music and side projects live.",
  },
  socials: SOCIALS.map((s) => ({ name: s.name, handle: s.handle, url: s.url })),
  music: {
    playlistImages: PLAYLISTS.map(() => ""),
    playlistImageAlts: PLAYLISTS.map((p) => `${p.label} YouTube Music playlist cover`),
    playlistLabels: PLAYLISTS.map(() => null as string | null),
    playlistTitles: PLAYLISTS.map(() => null as string | null),
    swipeInstruction: "Swipe the covers",
  },
  footer: {
    availability: "Open for collabs",
    line: "Versioned in public, tested on real hardware.",
    band: "art/footer-band-1280.webp",
    bandAlt: "Anime key visual: four bandmates carrying guitar cases across a sunlit crosswalk",
    bandKicker: "End of transmission",
    bandLine: "Thanks for scrolling. Go flash something.",
    telegramLabel: "Telegram",
    telegramUrl: "https://t.me/v3rsi0n",
    githubLabel: "GitHub",
    githubUrl: "https://github.com/4nx3b",
    signature: "v3rsi0n.",
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
export async function readPublished(fresh = false): Promise<PublicDoc | null> {
  try {
    const url = fresh ? `/api/site-content?t=${Date.now()}` : "/api/site-content";
    const r = await fetch(url, { cache: fresh ? "no-store" : "default", headers: { Accept: "application/json" } });
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

/** Owner write: the authenticated server endpoint is the only write path. */
async function writePublished(payload: unknown): Promise<string> {
  const token = await refreshTokenIfNeeded();
  let response: Response;
  try {
    response = await fetch("/api/site-content", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ json: JSON.stringify(payload) }),
    });
  } catch {
    throw new Error("Could not reach the publishing API. Check your connection and try again.");
  }

  const data = await response.json().catch(() => null);
  const detail = String(data?.error || "");
  if (!response.ok) {
    if (response.status === 401) throw new Error("Your owner session is no longer valid. Sign in again, then publish.");
    if (response.status === 404) throw new Error("The publishing API is missing from this deployment. Deploy the Vercel API functions, then try again.");
    if (response.status === 503 || /FIREBASE_SERVICE_ACCOUNT_KEY/i.test(detail)) {
      throw new Error("Publishing is not configured on Vercel. Add FIREBASE_SERVICE_ACCOUNT_KEY and redeploy the project.");
    }
    if (response.status === 403 || /PERMISSION_DENIED|permission denied/i.test(detail)) {
      throw new Error("The Vercel service account cannot write to this Firestore project. Check its Firestore IAM access and project ID.");
    }
    throw new Error(detail || `Publish failed (${response.status})`);
  }
  if (typeof data?.updatedAt !== "string") throw new Error("The publishing API returned an invalid response. Please try again.");
  return data.updatedAt;
}

function explainPublishError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/PERMISSION_DENIED|permission denied|403/i.test(message)) {
    return "The Vercel service account cannot write to this Firestore project. Check its Firestore IAM access and project ID.";
  }
  return message || "Couldn’t publish. Please try again.";
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
      if (o) {
        setDraft((current) => current ?? read<SiteContent>(DRAFT_KEY));
      } else {
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
  // Merge cached drafts over current defaults as the editor schema evolves.
  const content = useMemo(() => (draft ? deepMerge(base, draft) : base), [base, draft]);

  const set = useCallback(
    (path: string, value: unknown) => {
      setDraft((d) => {
        const next = setPath(d ? deepMerge(base, d) : base, path, value);
        write(DRAFT_KEY, next);
        return next;
      });
      setStatus({ kind: "idle" });
    },
    [base]
  );

  /** Write, then confirm what a public visitor can read through the API. */
  const save = useCallback(async (payload: unknown): Promise<Status> => {
    const at = await writePublished(payload);
    setPublishedAt(at);
    const check = await readPublished(true);
    if (check && check.updatedAt === at) return { kind: "saved", msg: "Published — live for everyone" };
    return { kind: "warn", msg: "Saved to Firestore, but the public endpoint could not confirm it yet. Refresh to verify." };
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
    } catch (error) {
      setStatus({ kind: "error", msg: explainPublishError(error) });
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
    } catch (error) {
      setStatus({ kind: "error", msg: explainPublishError(error) });
    }
  }, [save]);

  const setEditing = useCallback((v: boolean) => setEditingState(v && isOwner()), []);

  const value = useMemo<Ctx>(
    () => ({ content, owner, editing: editing && owner, dirty: !!draft, status, setEditing, set, publish, discard, reset, publishedAt }),
    [content, owner, editing, draft, status, setEditing, set, publish, discard, reset, publishedAt]
  );

  return <ContentCtx.Provider value={value}>{children}</ContentCtx.Provider>;
}
