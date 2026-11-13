/* ---------- Navigation ---------- */

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Work", href: "#work" },
  { label: "About", href: "#about" },
  { label: "Play", href: "#play" },
  { label: "Ask", href: "#ask" },
];

/* ---------- Hero ---------- */

export const HERO = {
  kicker: "v3rsi0n · India",
  pill: "LunarisOS 3.12 · Zephyr",
  lines: ["I build custom ROMs,", "apps and, sometimes,", "root"] as const,
  emphasis: "modules",
  age: "18",
  gender: "M",
  flag: "🇮🇳",
  country: "India",
  ctaPrimary: "Get LunarisOS 3.12",
  ctaSecondary: "Ask me anything",
};

/* ---------- FIG. 1 partitions ---------- */

export const PARTITIONS = [
  { key: "boot", label: "BOOT", note: "kernel + ramdisk · where Magisk patches in" },
  { key: "system", label: "SYSTEM", note: "the OS image · read-only, overlaid by modules" },
  { key: "vendor", label: "VENDOR", note: "blobs + HALs · different on every device" },
  { key: "userdata", label: "USERDATA", note: "your apps and data · back this up first" },
] as const;

export type PartitionKey = (typeof PARTITIONS)[number]["key"];

/* ---------- Work ---------- */

export type RomLink = { label: string; url: string; primary?: boolean };

export const ROM_POST = {
  title: "LunarisOS 3.12",
  codename: "Zephyr",
  variant: "GMS Variant",
  date: "2026-09-27",
  dateLabel: "27 September 2026",
  maintainer: "@v3rsi0n",
  maintainerUrl: "https://t.me/v3rsi0n",
  thumbnail: "work/lunaris-3.12.jpg",
  thumbnailWidth: 1672,
  thumbnailHeight: 941,
  thumbnailAlt: "LunarisOS AOSP banner: v3rsi0n, QPR 02, Stable · Secure · Refined",
  /** Links with an empty url are not shown. */
  links: [
    { label: "Download (Telegram)", url: "https://t.me/RealmeGTNeo3discussion/153674", primary: true },
    { label: "Support", url: "https://t.me/RealmeGTNeo3discussion" },
    { label: "Gofile", url: "" },
    { label: "Screenshots", url: "" },
    { label: "SusFS", url: "" },
    { label: "Source changelog", url: "" },
  ] as RomLink[],
  changelog: [
    "About Device Info updated",
    "Added Viper4FX",
    "FP Flashbang fixed",
    "Some optimisations, a few useless apps removed and battery optimisations added",
  ],
  tip: "To fix the transition lag: Settings → Singularity → User Interface → System animation style, then pick any of the 4 styles except the default.",
  notesLead: "Read the notes. Don't blame me afterwards.",
  notes: [
    "The ROM can be flashed from any Zephyr build. Coming from vanilla Lunaris with a local install, it will bootloop: clean flash only. Coming from a GMS-variant Lunaris, a local install works.",
    "If flashing from a port, flash the 10R stock ROM first.",
  ],
  warning: "When flashing from 10R stock, delete preloader_raw.img. Flashing from GT stock or old AOSP will break audio.",
};

export const APP = {
  name: "ArchiveTune",
  repo: "4nx3b/ArchiveTune",
  sector: "Android · Kotlin",
  title: "The cutest Material 3 Expressive music player on Android",
  desc: "Local files and YouTube Music in one queue, wrapped in M3 Expressive motion, with a parser core, a lyrics library and a Rhino-powered deobfuscator split into their own engines.",
  tags: ["Kotlin", "YouTube Music", "Local files", "Material 3"],
  link: "https://github.com/4nx3b/ArchiveTune",
  linkLabel: "View the repo",
};

/* ---------- About ---------- */

export const ABOUT = {
  facts: { age: "18", gender: "M", flag: "🇮🇳", country: "India", line: "Custom ROMs, apps and, sometimes, root modules." },
  interests: [
    { title: "Anime", desc: "Tracked on AniList, every episode logged." },
    { title: "Story games", desc: "Story games over competitive FPS. I'm bad at those and I've made peace with it." },
    { title: "Music", desc: "Anything my ears like, mostly J-pop, EDM and white girl music." },
  ],
  devices: [
    { role: "Primary", device: "Realme GT Neo 3 (8/128)", detail: "RMX3561 · lisaa" },
    { role: "Secondary", device: "Samsung Galaxy J7 Prime", detail: "G610F" },
    { role: "Laptop", device: "Lenovo IdeaPad 320", detail: "4 GB RAM, 1 TB HDD, i3-6006U, Intel HD 520", aside: "it tries its best" },
  ] as { role: string; device: string; detail: string; aside?: string }[],
  gamesLead: "Played daily, or close to it",
  games: ["Crystal of Atlan", "Punishing: Gray Raven", "Racing Master SEA", "Delta Force Mobile (Global)", "MiSide"],
};

export const MUSIC = {
  handle: "zensxin",
  url: "https://www.last.fm/user/zensxin",
  now: { track: "in the pool", artist: "kensuke ushio", vol: 85 },
  genres: ["city pop", "lo-fi", "ambient", "jazz fusion", "OST"],
};

export const ANIME = {
  handle: "zensxin",
  url: "https://anilist.co/user/zensxin/",
  count: 595,
  episodes: 5903,
  minutes: 146538,
  mean: 87.7,
};

/* ---------- Play ---------- */

export type Game = { id: string; icon: "snake" | "pong" | "quiz" | "reaction"; name: string; desc: string; playable: boolean };

export const GAMES: Game[] = [
  { id: "snake", icon: "snake", name: "Snake", desc: "Classic game. High chance of self-sabotage.", playable: true },
  { id: "pong", icon: "pong", name: "Ping Pong", desc: "You vs an AI paddle. First to 5 wins.", playable: true },
  { id: "quiz", icon: "quiz", name: "Roast Quiz", desc: "A 10-question personality remix drawn from a 17-question bank. Every answer gets roasted.", playable: true },
  { id: "reaction", icon: "reaction", name: "Reaction Test", desc: "Click when it turns green.", playable: true },
];

export const QUIZ = [
  {
    q: "A ROM build fails at 2 a.m. What’s your first move?",
    opts: ["Read the first real error", "Clean the whole tree and rerun", "Blame the vendor blobs", "Open a snack before opening logs"],
    roasts: ["An engineer. Who let you in?", "You solved it by deleting the evidence.", "The blobs have retained counsel.", "Debugging on a full stomach—suspiciously wise."],
  },
  {
    q: "Choose your daily-driver setup.",
    opts: ["Stable stock with a few tweaks", "Custom ROM, nightly builds", "Two phones: one for experiments", "Whatever booted this morning"],
    roasts: ["So you enjoy uneventful battery life.", "You call bugs ‘community features’.", "One device is the patient; the other is the surgeon.", "Your uptime is a cliff-hanger."],
  },
  {
    q: "An OTA appears five minutes before you leave. You…",
    opts: ["Read the changelog first", "Install now—what could happen?", "Postpone until it becomes ancient history", "Take screenshots, then forget"],
    roasts: ["You have read a changelog before. Rare form.", "You packed a charger, right?", "That notification has a family now.", "A meticulous archive of unfinished intentions."],
  },
  {
    q: "What lives in your terminal history?",
    opts: ["Useful aliases and notes", "One command copied forty times", "Mostly `cd` and `ls`", "An accidental `rm` I still fear"],
    roasts: ["A terminal with adult supervision.", "Paste-driven development: a classic.", "You are exploring, one directory at a time.", "The command line remembers. It always remembers."],
  },
  {
    q: "The phone bootloops after a module install. First move?",
    opts: ["Boot safe mode and disable it", "Flash the same ZIP again", "Wipe everything, including hope", "Ask the group without sharing logs"],
    roasts: ["A calm, reversible decision. Suspicious.", "The definition of ‘try turning it off and on’.", "Your data would like a word.", "The support channel has seen this movie."],
  },
  {
    q: "How do you test a new build?",
    opts: ["Checklist on spare hardware", "Daily driver—YOLO", "Ask one friend to be brave", "Wait for someone online to try it"],
    roasts: ["Quality assurance has entered the chat.", "Your warranty just left it.", "Friendship is the real test suite.", "You call this ‘crowdsourced confidence’."],
  },
  {
    q: "Pick a backup strategy.",
    opts: ["Recent copy stored off-device", "A backup from the last major update", "Screenshots of my settings", "Trust the universe"],
    roasts: ["The cloud is not your only personality trait.", "Vintage backup. Fine year, questionable freshness.", "An archival masterpiece of the wrong data.", "The universe has a very slow restore process."],
  },
  {
    q: "Which changelog line gets your attention first?",
    opts: ["Security patches and fixes", "Performance improvements", "Known issues: none", "Changed a thing, trust me"],
    roasts: ["You read the important bit. The important bit reads you.", "A benchmark enthusiast has been detected.", "You believe in miracles—and clean installs.", "Minimalism has gone too far."],
  },
  {
    q: "A clean compile suddenly takes forever. You…",
    opts: ["Inspect the task that stalled", "Delete caches, then delete more", "Assume it’s indexing forever", "Open a second terminal to stare at it"],
    roasts: ["Observability! In this economy?", "The cache was innocent. Probably.", "‘Gradle is thinking’ is not a diagnosis.", "Two terminals, twice the suspense."],
  },
  {
    q: "What’s your approach to root modules?",
    opts: ["One at a time, with notes", "Install every green checkmark", "Keep the ones I forgot I installed", "My modules have modules"],
    roasts: ["A controlled experiment. We’re taking notes.", "The checkbox is not a compatibility report.", "Archaeology, but the ruins are your boot image.", "You have achieved module-ception."],
  },
  {
    q: "Choose a commit message.",
    opts: ["fix: handle the null device", "stuff", "final-final-2", "works on my machine"],
    roasts: ["Future-you sends a polite thank-you.", "A detailed account of absolutely nothing.", "There are at least three sequels coming.", "The CI server would like to reproduce that claim."],
  },
  {
    q: "A random root guide promises a one-click fix. You…",
    opts: ["Check the device and post date", "Run every command with sudo", "Read comments, then guess", "Bookmark it for 2031"],
    roasts: ["You check compatibility before consequences. Nice.", "Admin privileges: because suspense needed a sequel.", "Peer review by vibes. Bold methodology.", "A long-term research project with no milestones."],
  },
  {
    q: "Someone asks for help but shares no logs. You…",
    opts: ["Ask for model, build, and logs", "Send one patient reply", "Guess from vibes", "Pretend screenshots are logs"],
    roasts: ["A support engineer in their natural habitat.", "Your patience deserves its own changelog.", "The diagnostic protocol is ‘hmm’.", "Pixelated evidence has entered the case file."],
  },
  {
    q: "Your build is ready. How do you announce it?",
    opts: ["Clear notes and install steps", "One screenshot and a dream", "Say ‘stable’ and vanish", "Post at 3 a.m. with no context"],
    roasts: ["Release notes: the unsung hero of release day.", "Marketing has discovered the screenshot button.", "Confidence: high. Support availability: mysterious.", "Your users are asleep; your build is not."],
  },
  {
    q: "You have thirty minutes free. What happens?",
    opts: ["Review a pull request", "Flash something on the spare phone", "Watch one episode (three later)", "Open a wiki and lose the evening"],
    roasts: ["You came here to be productive. Suspiciously.", "The spare phone is never actually spared.", "A short episode has flexible definitions.", "The wiki rabbit hole has no fastboot mode."],
  },
  {
    q: "Pick your anime protagonist energy.",
    opts: ["Quiet strategist with a backup plan", "Overpowered but on 3% battery", "Side character with the better playlist", "Skips the intro but knows every word"],
    roasts: ["The plot twist is that your backups work.", "Final-boss energy, low-power mode.", "The soundtrack is carrying the whole arc.", "You have memorized the skip button’s timing."],
  },
  {
    q: "Your shuffle plays at maximum volume. What’s next?",
    opts: ["A J-pop opening theme", "An EDM drop mid-log review", "Phonk during a clean flash", "A ballad that makes Gradle emotional"],
    roasts: ["Your terminal now has an opening sequence.", "Build failed? Drop the beat, not the session.", "The progress bar is doing a tiny drift.", "Even the dependency graph feels something."],
  },
];

/* ---------- Ask ---------- */

export type SeedQuestion = { id: string; text: string; author: string; votes: number; ts: number; seeded?: boolean };

export const SEED_QUESTIONS: SeedQuestion[] = [
  {
    id: "seed-1",
    text: "Daily driver or test bench — which device gets the experimental builds first?",
    author: "anon",
    votes: 12,
    ts: 1751328000000,
    seeded: true,
  },
  {
    id: "seed-2",
    text: "Magisk or KernelSU for a fresh install in 2026? Pick one.",
    author: "anon",
    votes: 9,
    ts: 1752537600000,
    seeded: true,
  },
  {
    id: "seed-3",
    text: "What's the hardest device you've ever ported a ROM to, and why?",
    author: "anon",
    votes: 7,
    ts: 1753747200000,
    seeded: true,
  },
];

/* ---------- Links ---------- */

export type Social = { name: string; handle: string; url: string };

export const SOCIALS: Social[] = [
  { name: "GitHub", handle: "@4nx3b", url: "https://github.com/4nx3b" },
  { name: "Telegram", handle: "@v3rsi0n", url: "https://t.me/v3rsi0n" },
  { name: "Instagram", handle: "@extrr4ction", url: "https://www.instagram.com/extrr4ction" },
  { name: "Discord", handle: "v3rsi0n", url: "https://discord.com/users/1128166734604537949" },
  { name: "YouTube Music", handle: "channel", url: "https://music.youtube.com/channel/UCzCt_fdj0vtv6U3bpVrHNzA" },
  { name: "Last.fm", handle: "zensxin", url: "https://www.last.fm/user/zensxin" },
  { name: "AniList", handle: "zensxin", url: "https://anilist.co/user/zensxin/" },
  { name: "Snapchat", handle: "@zensxin", url: "https://www.snapchat.com/@zensxin" },
  { name: "Pinterest", handle: "zensxin", url: "https://www.pinterest.com/zensxin/" },
  { name: "Facebook", handle: "v3rsi0n", url: "https://www.facebook.com/therealreze" },
  { name: "Trakt", handle: "zensxin", url: "https://trakt.tv/users/zensxin" },
  { name: "Email", handle: "say hello", url: "#ask" },
];


/* ---------- AMA backend (ported from the previous build, keys preserved) ---------- */

export const FIREBASE = {
  apiKey: "AIzaSyCUG-oxLlGWKulnV8E0PwSEmr_s0EyCRUk",
  projectId: "therealreze-2a3bf",
};
export const ADMIN_EMAIL = "asaxxhiii@gmail.com";
export const FORMSPREE_ENDPOINT = "https://formspree.io/f/mwvdqnyn";
export const AMA_COLLECTION = "amaQuestions";
export const AMA_KEYS = {
  ownerAuth: "ama_owner_auth_v4",
  publicAuth: "ama_public_anon_auth_v4",
  queue: "ama_pending_questions_v4",
  voted: "ama_voted_question_ids_v6",
  sort: "ama_public_sort_v6",
};

/* ---------- Music: full songs via YouTube's official embed ---------- */

export type Track = { id: string; title: string; artist: string; file: string; artwork: string };

/** The mp3s live in /music on main. jsDelivr streams them with CORS + range support. */
const CDN = "https://cdn.jsdelivr.net/gh/4nx3b/Vercel-Website@main/music/";
const RAW = "https://raw.githubusercontent.com/4nx3b/Vercel-Website/main/music/";
export const audioSrc = (file: string) => CDN + encodeURIComponent(file);
export const audioSrcFallback = (file: string) => RAW + encodeURIComponent(file);

/** Full tracks, streamed from this repo. Swap a file name here to change a track. */
export const TRACKS: Track[] = [
  { id: "abgrund", title: "Abgrund", artist: "Elous\u2227.FZ", file: "elous\u2227.-fz - abgrund.mp3", artwork: "https://i1.sndcdn.com/artworks-44KBwQeyzBfIJFun-LorbIw-t500x500.jpg" },
  { id: "journey", title: "Journey To The Rainbows", artist: "Ardolf", file: "Journey To The Rainbows.mp3", artwork: "https://i1.sndcdn.com/artworks-cHEPOvbYHniCyvOj-xJaHUw-t500x500.jpg" },
  { id: "orthodox", title: "Orthodox", artist: "tokiwa", file: "Orthodox.mp3", artwork: "https://i1.sndcdn.com/artworks-000651636742-791u96-t500x500.jpg" },
];


export type Playlist = { id: string; label: string; title: string; thumbnail: string; itemCount: number | null; fallbackVideo: string };

/** Static fallbacks only. Custom covers are signed URLs that expire, so they are never
    stored here: /api/yt-cover resolves a fresh one, and these video frames (16:9, no bars)
    cover the case where no API is reachable. */
const frame = (v: string, size = "maxresdefault") => `https://i.ytimg.com/vi/${v}/${size}.jpg`;
export const PLAYLISTS: Playlist[] = [
  { id: "PL-fWIzgBd5AweOlOuudT-f9fqY1x-bR_O", label: "Japanese", title: "peak jpop", fallbackVideo: "tuZty35Fk7M", thumbnail: frame("tuZty35Fk7M", "mqdefault"), itemCount: 525 },
  { id: "PL-fWIzgBd5Az5euaBV1M5HElAKC8kzdYC", label: "English", title: "high nights \u2604\ufe0f\ud83d\udc7e", fallbackVideo: "8BiLurrzFRw", thumbnail: frame("8BiLurrzFRw"), itemCount: 688 },
  { id: "PL-fWIzgBd5AyeDYfArAo6ZEKl3xxeG7mc", label: "Hindi", title: "Lesss Vibee \ud83d\udcab", fallbackVideo: "HcOBSj_uSvM", thumbnail: frame("HcOBSj_uSvM"), itemCount: 93 },
  { id: "PL-fWIzgBd5AxneK5vQfmaQskYmuwbXZ_k", label: "Phonk", title: "phonk time \ud83d\udca5", fallbackVideo: "NT4eF9YsYnM", thumbnail: frame("NT4eF9YsYnM"), itemCount: 73 },
  { id: "PL-fWIzgBd5Aw0-x8aDOYMOZcoD6jmzPWs", label: "Mix", title: "mix", fallbackVideo: "QygzZXrHcdo", thumbnail: frame("QygzZXrHcdo"), itemCount: 27 },
];

