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
export type BuiltinSectionId = "hero" | "work" | "ticker" | "about" | "ask" | "links";
export type SectionMotion = "reveal" | "stagger" | "stack" | "drift" | "none";
export type BuilderLayout = "editorial" | "split" | "cards" | "banner";
export type BuilderBackground = "paper" | "sunk" | "panel" | "accent";
export type BuilderTexture = "none" | "grid" | "dots" | "hatch";
export type BuilderBlockType = "heading" | "text" | "quote" | "button" | "image" | "card" | "callout" | "list" | "metric" | "project" | "divider" | "spacer";
export type BuilderBlock = {
  id: string;
  type: BuilderBlockType;
  text?: string;
  eyebrow?: string;
  title?: string;
  body?: string;
  label?: string;
  value?: string;
  href?: string;
  variant?: "ink" | "accent" | "outline";
  source?: "rom" | "app";
  src?: string;
  alt?: string;
  caption?: string;
  items?: string[];
  size?: "sm" | "md" | "lg";
};
export type BuiltinPageSection = {
  id: string;
  kind: "builtin";
  component: BuiltinSectionId;
  visible: boolean;
  motion: SectionMotion;
};
export type CustomPageSection = {
  id: string;
  kind: "custom";
  visible: boolean;
  label: string;
  title: string;
  description: string;
  showInNav: boolean;
  navLabel: string;
  layout: BuilderLayout;
  background: BuilderBackground;
  texture: BuilderTexture;
  motion: SectionMotion;
  blocks: BuilderBlock[];
};
export type PageSection = BuiltinPageSection | CustomPageSection;

export const DEFAULTS = {
  version: 3,
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
  design: {
    fontPreset: "editorial" as "editorial" | "bookish" | "grotesk" | "typewriter",
    motionPreset: "balanced" as "quiet" | "balanced" | "expressive",
  },
  layout: {
    footerVisible: true,
    sections: [
      { id: "hero", kind: "builtin", component: "hero", visible: true, motion: "reveal" },
      { id: "work", kind: "builtin", component: "work", visible: true, motion: "reveal" },
      { id: "ticker", kind: "builtin", component: "ticker", visible: true, motion: "none" },
      { id: "about", kind: "builtin", component: "about", visible: true, motion: "reveal" },
      { id: "ask", kind: "builtin", component: "ask", visible: true, motion: "reveal" },
      { id: "links", kind: "builtin", component: "links", visible: true, motion: "reveal" },
    ] as PageSection[],
  },
  blocks: { hero: [], work: [], about: [], ask: [], links: [], footer: [] } as Record<SectionId, Block[]>,
};

export type SiteContent = typeof DEFAULTS;

/** Preserve owner-edited quiz entries while appending newly released defaults. */
function ensureQuizBankDefaults(content: SiteContent): SiteContent {
  const current = Array.isArray(content.play?.quiz) ? content.play.quiz : [];
  const defaults = DEFAULTS.play.quiz;
  if (current.length >= defaults.length) return content;
  return {
    ...content,
    play: { ...content.play, quiz: [...current, ...defaults.slice(current.length)] },
  };
}

const CACHE_KEY = "site_content_v1";
const DRAFT_KEY = "site_content_draft_v1";
const OWNER_AVATAR_CACHE_KEY = "site_owner_profile_avatar_v1";
const DOC_URL = () =>
  `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents/siteContent/live`;
const OWNER_PROFILE_URL = () =>
  `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents/siteOwner/profile`;
const MAX_OWNER_AVATAR_CHARS = 220_000;

function isOwnerAvatar(value: unknown): value is string {
  return typeof value === "string" && value.length <= MAX_OWNER_AVATAR_CHARS &&
    (!value || /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/.test(value));
}

async function readOwnerAvatar(): Promise<string> {
  const response = await fetch(`${OWNER_PROFILE_URL()}?key=${encodeURIComponent(FIREBASE.apiKey)}`, {
    headers: { Accept: "application/json" },
    cache: "no-store",
  });
  if (response.status === 404) return "";
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Firestore denied the profile read. Deploy firestore.rules to enable the shared owner icon.");
    }
    throw new Error(data?.error?.message || `Profile read failed (${response.status})`);
  }
  const value = data?.fields?.avatar?.stringValue || "";
  return isOwnerAvatar(value) ? value : "";
}

async function writeOwnerAvatar(value: string, token: string): Promise<string> {
  const updatedAt = new Date().toISOString();
  const url = `${OWNER_PROFILE_URL()}?key=${encodeURIComponent(FIREBASE.apiKey)}&updateMask.fieldPaths=avatar&updateMask.fieldPaths=updatedAt`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ fields: { avatar: { stringValue: value }, updatedAt: { stringValue: updatedAt } } }),
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error("Firestore rejected the profile update. Deploy the siteOwner/profile rules and check the signed-in owner account.");
    }
    throw new Error(data?.error?.message || `Profile update failed (${response.status})`);
  }
  return updatedAt;
}

export function cachedOwnerAvatar(): string {
  const avatar = read<string>(OWNER_AVATAR_CACHE_KEY);
  return isOwnerAvatar(avatar) ? avatar : "";
}

export async function loadOwnerAvatar(): Promise<string> {
  const avatar = await readOwnerAvatar();
  write(OWNER_AVATAR_CACHE_KEY, avatar);
  return avatar;
}

export async function saveOwnerAvatar(avatar: string): Promise<void> {
  if (!isOwnerAvatar(avatar)) throw new Error("Choose a PNG, JPEG, or WebP image that is smaller than 220 KB after resizing.");
  const token = await refreshTokenIfNeeded();
  await writeOwnerAvatar(avatar, token);
  write(OWNER_AVATAR_CACHE_KEY, avatar);
}

const SITE_IMAGE_DATA_URL = /^data:image\/(?:webp|png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;
export async function loadSiteImageData(id: string): Promise<string> {
  if (!/^[\w-]{4,80}$/.test(id)) throw new Error("Invalid published image ID.");
  const url = `https://firestore.googleapis.com/v1/projects/${FIREBASE.projectId}/databases/(default)/documents/siteImages/${encodeURIComponent(id)}?key=${encodeURIComponent(FIREBASE.apiKey)}`;
  const doc = await jfetch(url, { cache: "force-cache" });
  const value = doc?.fields?.data?.stringValue;
  if (typeof value !== "string" || value.length > 1_000_000 || !SITE_IMAGE_DATA_URL.test(value)) {
    throw new Error("Published image is missing or invalid.");
  }
  return value;
}

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
    const doc = await jfetch(`${DOC_URL()}?key=${encodeURIComponent(FIREBASE.apiKey)}`, { cache: "no-store" });
    const raw = doc?.fields?.json?.stringValue;
    if (typeof raw === "string") return { json: JSON.parse(raw) as Json, updatedAt: doc?.fields?.updatedAt?.stringValue ?? null, via: "firestore" };
  } catch {
    /* rules not deployed, or offline */
  }
  return null;
}

/**
 * Prefer the host's authenticated publishing API, then fall back to Firestore
 * for static hosts such as Wasmer that have no serverless API route. The
 * direct path is still owner-gated by firestore.rules and shares siteContent/live.
 */
async function writePublished(payload: unknown): Promise<string> {
  const token = await refreshTokenIfNeeded();
  const json = JSON.stringify(payload);
  let response: Response | null = null;
  let data: any = null;
  try {
    response = await fetch("/api/site-content", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: "Bearer " + token },
      body: JSON.stringify({ json }),
    });
    data = await response.json().catch(() => null);
  } catch {
    // A static host or preview may not have an /api route. Try the shared Firestore document.
  }

  if (response?.ok && typeof data?.updatedAt === "string") return data.updatedAt;
  if (response?.status === 401) throw new Error("Your owner session is no longer valid. Sign in again, then publish.");

  const apiMissing = !response || response.status === 404 || response.status === 405 || response.status === 503 || response.status >= 500 ||
    !(response.headers.get("content-type") || "").includes("json") || (response.ok && typeof data?.updatedAt !== "string");
  if (apiMissing || response?.status === 403) {
    if (new TextEncoder().encode(json).length > 900_000) {
      throw new Error("Published content is too large for the direct Firestore fallback. Remove some large text or images and try again.");
    }
    const updatedAt = new Date().toISOString();
    const url = `${DOC_URL()}?key=${encodeURIComponent(FIREBASE.apiKey)}&updateMask.fieldPaths=json&updateMask.fieldPaths=updatedAt`;
    let directResponse: Response;
    try {
      directResponse = await fetch(url, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ fields: { json: { stringValue: json }, updatedAt: { stringValue: updatedAt } } }),
      });
    } catch {
      throw new Error("Could not reach the publishing API or Firestore. Check your connection and try again.");
    }
    const directData = await directResponse.json().catch(() => null);
    if (directResponse.ok) return updatedAt;
    if (directResponse.status === 401) throw new Error("Your owner session is no longer valid. Sign in again, then publish.");
    if (directResponse.status === 403) {
      throw new Error("Firestore denied direct publishing. Deploy firestore.rules and confirm the signed-in owner account is verified.");
    }
    throw new Error(directData?.error?.message || `Firestore publish failed (${directResponse.status})`);
  }

  const detail = String(data?.error || "");
  if (response?.status === 400 || response?.status === 413) {
    throw new Error(detail || "The published content is invalid or too large.");
  }
  throw new Error(detail || `Publish failed (${response?.status ?? "unknown"})`);
}

function explainPublishError(error: unknown) {
  const message = error instanceof Error ? error.message : "";
  if (/Firestore denied direct publishing/i.test(message)) return message;
  if (/PERMISSION_DENIED|permission denied|403/i.test(message)) {
    return "The publishing service cannot write to this Firestore project. Check its Firestore rules and owner permissions.";
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

  const base = useMemo(() => ensureQuizBankDefaults(deepMerge(DEFAULTS, published)), [published]);
  // Merge cached drafts over current defaults as the editor schema evolves.
  const content = useMemo(() => ensureQuizBankDefaults(draft ? deepMerge(base, draft) : base), [base, draft]);

  const set = useCallback(
    (path: string, value: unknown) => {
      setDraft((d) => {
        const current = ensureQuizBankDefaults(d ? deepMerge(base, d) : base);
        const next = setPath(current, path, value);
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
