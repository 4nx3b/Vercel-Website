export type Tone = "orange" | "green";

/* ---------- Navigation ---------- */

export const NAV_LINKS: { label: string; href: string }[] = [
  { label: "Skills", href: "#skills" },
  { label: "Process", href: "#process" },
  { label: "Work", href: "#work" },
  { label: "Now", href: "#now" },
  { label: "Ask", href: "#ask" },
];

/* ---------- Ticker ---------- */

export const TICKER_ITEMS = [
  "status: open for collabs",
  "Lunaris OS 3.11 · Zephyr — stable",
  "rooted since day one",
  "IST · GMT+5:30",
  "zensxin on last.fm & anilist",
  "9 public repos · 40★ ArchiveTune",
  "magisk + kernelsu",
];

/* ---------- Hero ---------- */

export const HERO_STATS: { label: string; value: string; raw: number; delta: string; tone: Tone; spark: number[] }[] = [
  { label: "Skills Loaded", value: "12", raw: 12, delta: "5 CATS", tone: "green", spark: [4, 5, 5, 6, 7, 7, 8, 9, 10, 10, 11, 11, 12] },
  { label: "Public Repos", value: "9", raw: 9, delta: "40★ TOP", tone: "green", spark: [2, 3, 3, 4, 4, 5, 6, 6, 7, 8, 8, 9, 9] },
  { label: "Anime Watched", value: "586", raw: 586, delta: "▲ 31 THIS YR", tone: "orange", spark: [5, 6, 6, 7, 8, 8, 9, 10, 11, 12, 12, 13, 14] },
  { label: "Episodes Logged", value: "5,805", raw: 5805, delta: "▲ LIVE", tone: "orange", spark: [4, 5, 7, 6, 8, 9, 9, 11, 10, 12, 13, 14, 15] },
];

export const TERMINAL_LINES: { text: string; tone: "prompt" | "ok" | "warn" }[] = [
  { text: "$ init /system/bin/reze", tone: "prompt" },
  { text: "✔ mount super partition … ok", tone: "ok" },
  { text: "✔ verify boot image … ok", tone: "ok" },
  { text: "▲ inject magisk modules … 12 loaded", tone: "warn" },
  { text: "$ start signal", tone: "prompt" },
  { text: "▲ therealreze online — open for collabs", tone: "warn" },
];

export const HERO_CHIPS = ["Root Modules", "Custom ROM", "Magisk", "KernelSU"];

export const HERO_COPY =
  "Root modules. Custom ROMs. Pushing devices past what stock firmware ever permits — the hardware answers to you, not its manufacturer.";

export const TICKER_TOOLS = [
  "Magisk", "KernelSU", "AOSP", "LineageOS", "ADB", "Fastboot", "SELinux",
  "vendor blobs", "device trees", "Zephyr", "overlayfs", "init scripts",
];

/* ---------- About ---------- */

export const ABOUT_PARAS = [
  "I'm therealreze — an Android root specialist. I live at the intersection of low-level system code, kernel internals, and the philosophy that your hardware should answer to you, not its manufacturer.",
  "My work focuses on custom ROM development and root module building — Magisk and KernelSU modules that let you push a device past what stock firmware ever permits. If it involves a bootloader or a system partition, I'm on it.",
  "When I'm not writing modules or reading kernel patches, I'm deep in anime or exploring the quiet aesthetic of Japanese music. The same minimalism I look for there shows up in how I approach code.",
];

/* ---------- Skills ---------- */

export type Skill = { index: string; name: string; sub: string; cat: string; glyph: string };

export const SKILLS: Skill[] = [
  { index: "01", name: "Android Root & Bootloader", sub: "ADB, Fastboot, unlocking, partition management", cat: "CORE", glyph: "boot" },
  { index: "02", name: "Magisk Module Development", sub: "Module scripting, props, overlays, hooks", cat: "ROOT", glyph: "module" },
  { index: "03", name: "KernelSU Integration", sub: "Kernel-level root, module API, overlayfs", cat: "ROOT", glyph: "kernel" },
  { index: "04", name: "Custom ROM Development", sub: "AOSP, LineageOS, build system, device trees", cat: "ROM", glyph: "rom" },
  { index: "05", name: "ROM Porting & Adaptation", sub: "Device bring-up, HAL fixes, vendor blobs", cat: "ROM", glyph: "port" },
  { index: "06", name: "ADB / Fastboot", sub: "Debugging, flashing, sideloading, scripting", cat: "TOOLS", glyph: "adb" },
  { index: "07", name: "Linux & Bash Scripting", sub: "Shell scripts, system automation, cron, sed/awk", cat: "TOOLS", glyph: "bash" },
  { index: "08", name: "Android Security & SELinux", sub: "Policy writing, permissive modes, audit2allow", cat: "CORE", glyph: "selinux" },
  { index: "09", name: "Partition & Storage Management", sub: "Super, vendor, system, userdata, recovery", cat: "CORE", glyph: "partition" },
  { index: "10", name: "Open Source Development", sub: "GitHub, git, versioning, CI/CD basics", cat: "DEV", glyph: "git" },
  { index: "11", name: "Kernel Customisation", sub: "Config tuning, governors, I/O schedulers, patches", cat: "ROM", glyph: "cpu" },
  { index: "12", name: "Device Tree Maintenance", sub: "BoardConfig, overlays, fstab, init scripts", cat: "ROM", glyph: "tree" },
];

export const SKILL_CATS = ["ALL", "CORE", "ROOT", "ROM", "TOOLS", "DEV"];

export const CAT_TONE: Record<string, Tone | "neutral"> = {
  CORE: "orange",
  ROOT: "orange",
  ROM: "green",
  TOOLS: "green",
  DEV: "neutral",
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

export const LUNARIS = {
  name: "Lunaris OS 3.11",
  variant: "Zephyr · GApps Variant",
  build: "26th June 2026",
  desc: "A clean, performance-tuned custom ROM built for daily driving. Lunaris OS 3.11 (Zephyr) ships with GApps pre-integrated — a smooth stock-adjacent experience with meaningful under-the-hood enhancements: battery optimizations, kernel tweaks, and a refined UI that stays out of your way.",
  devices: ["Realme GT Neo 3", "OnePlus 10R"],
  download: "https://github.com/4nx3b/Zephyr",
  support: "https://t.me/therealreze",
};

export type Project = {
  index: string;
  version: string;
  client: string;
  sector: string;
  title: string;
  desc: string;
  metrics: { value: string; label: string }[];
  tags: string[];
  link: string;
  linkLabel: string;
};

export const PROJECTS: Project[] = [
  {
    index: "02",
    version: "v2.x · active",
    client: "ArchiveTune",
    sector: "Android · Kotlin",
    title: "The cutest Material 3 Expressive music player on Android",
    desc: "Local files and YouTube Music in one queue, wrapped in M3 Expressive motion. 40 stars and counting — with a parser core, lyrics library and a Rhino-powered deobfuscator split into their own engines.",
    metrics: [
      { value: "40★", label: "on GitHub" },
      { value: "3", label: "engine sub-repos" },
      { value: "M3", label: "Expressive UI" },
    ],
    tags: ["Kotlin", "YouTube Music", "Local files", "Material 3"],
    link: "https://github.com/4nx3b/ArchiveTune",
    linkLabel: "View the repo",
  },
  {
    index: "03",
    version: "v1.0 · profile",
    client: "4nx3b / OpenHouse",
    sector: "Open source",
    title: "Profile, experiments, and the open house door",
    desc: "The README repo people land on, plus OpenHouse — the sandbox where half-finished ideas live in the open until they earn a name. Small, honest, frequently pushed.",
    metrics: [
      { value: "2★", label: "profile repo" },
      { value: "2", label: "languages" },
      { value: "∞", label: "small experiments" },
    ],
    tags: ["Python", "JavaScript", "README", "Experiments"],
    link: "https://github.com/4nx3b/4nx3b",
    linkLabel: "Say hi on the profile",
  },
  {
    index: "04",
    version: "v3.0 · live",
    client: "Vercel-Website",
    sector: "Portfolio",
    title: "A personal site built like a system, not a page",
    desc: "Fault-isolated init modules, serverless APIs, an AMA with persistence, theming and a playground — one failing module never breaks the page. The codebase this very rebuild reports to.",
    metrics: [
      { value: "17", label: "isolated modules" },
      { value: "09", label: "numbered sections" },
      { value: "1", label: "signal, many outputs" },
    ],
    tags: ["TypeScript", "Vercel", "Serverless", "Design systems"],
    link: "https://github.com/4nx3b/Vercel-Website",
    linkLabel: "Read the source",
  },
];

export type Repo = {
  name: string;
  desc: string;
  lang: string;
  stars: number;
  forks: number;
  fork: boolean;
  updated: string;
  url: string;
};

export const REPOS: Repo[] = [
  { name: "ArchiveTune", desc: "The cutest Material 3 Expressive music player with local file and YouTube Music support for Android.", lang: "Kotlin", stars: 40, forks: 5, fork: true, updated: "2026-09-18", url: "https://github.com/4nx3b/ArchiveTune" },
  { name: "Vercel-Website", desc: "This portfolio — a site built like a system, not a page.", lang: "TypeScript", stars: 0, forks: 1, fork: false, updated: "2026-09-17", url: "https://github.com/4nx3b/Vercel-Website" },
  { name: "core", desc: "Custom audio and YouTube parser engine for ArchiveTune.", lang: "Kotlin", stars: 0, forks: 0, fork: true, updated: "2026-09-16", url: "https://github.com/4nx3b/core" },
  { name: "4nx3b", desc: "Stuff about me — profile repository.", lang: "Python", stars: 2, forks: 0, fork: false, updated: "2026-09-18", url: "https://github.com/4nx3b/4nx3b" },
  { name: "NuvioMobile", desc: "Unofficial Nuvio Mobile repository.", lang: "Kotlin", stars: 0, forks: 0, fork: true, updated: "2026-09-12", url: "https://github.com/4nx3b/NuvioMobile" },
  { name: "lyrics", desc: "Lyrics library for ArchiveTune.", lang: "Kotlin", stars: 0, forks: 0, fork: true, updated: "2026-08-30", url: "https://github.com/4nx3b/lyrics" },
  { name: "morideobfuscator", desc: "Internal deobfuscator engine powered by Rhino, for ArchiveTune.", lang: "Kotlin", stars: 0, forks: 0, fork: true, updated: "2026-08-23", url: "https://github.com/4nx3b/morideobfuscator" },
  { name: "OpenHouse", desc: "Open house — experiments in the open.", lang: "JavaScript", stars: 0, forks: 0, fork: false, updated: "2026-07-23", url: "https://github.com/4nx3b/OpenHouse" },
  { name: "Zephyr", desc: "Build system behind Lunaris OS 3.11 Zephyr.", lang: "Makefile", stars: 0, forks: 0, fork: true, updated: "2026-07-09", url: "https://github.com/4nx3b/Zephyr" },
];

/* ---------- Process ---------- */

export type Step = {
  version: string;
  phase: string;
  title: string;
  desc: string;
  log: { marker: "+" | "~" | "→"; text: string }[];
};

export const PROCESS_STEPS: Step[] = [
  {
    version: "v0.0.1",
    phase: "Stage 01",
    title: "Unlock & Backup",
    desc: "OEM unlock, bootloader flags, and a full nandroid before anything gets touched. A bricked device teaches nothing — a backed-up one teaches everything.",
    log: [
      { marker: "+", text: "added: OEM unlock + bootloader flags verified" },
      { marker: "+", text: "added: full partition backup, checksummed" },
      { marker: "→", text: "shipped: a device that can always come back" },
    ],
  },
  {
    version: "v0.1.0",
    phase: "Stage 02",
    title: "Flash & Port",
    desc: "Custom recovery in, vendor blobs reconciled, HALs coaxed into cooperating. Porting is 20% building and 80% reading someone else's boot log.",
    log: [
      { marker: "+", text: "added: custom recovery + fastboot pipeline" },
      { marker: "~", text: "improved: vendor blobs & HAL bring-up" },
      { marker: "→", text: "shipped: first clean boot on target hardware" },
    ],
  },
  {
    version: "v0.5.0",
    phase: "Stage 03",
    title: "Root & Harden",
    desc: "Magisk or KernelSU, SELinux policies written properly, module hooks that survive an OTA. Root is a responsibility, not a trophy.",
    log: [
      { marker: "+", text: "added: Magisk / KernelSU with sane defaults" },
      { marker: "+", text: "added: SELinux policies, audit2allow where needed" },
      { marker: "~", text: "improved: module hooks survive OTA updates" },
    ],
  },
  {
    version: "v1.0.0",
    phase: "Stage 04",
    title: "Daily Drive",
    desc: "Kernel governors tuned, battery curves flattened, UI stripped to what matters. The benchmark is a week of real use, not a screenshot.",
    log: [
      { marker: "~", text: "improved: governor tuning + I/O schedulers" },
      { marker: "~", text: "improved: battery curve across a full week" },
      { marker: "→", text: "shipped: stable enough to forget it's modded" },
    ],
  },
  {
    version: "v1.x → ∞",
    phase: "Ongoing",
    title: "Iterate & Share",
    desc: "Patches merged upstream, ports adapted to new devices, modules released with install logs. Every device that boots my work is a commit message.",
    log: [
      { marker: "+", text: "added: patches sent upstream where they belong" },
      { marker: "+", text: "added: community builds with tested install logs" },
      { marker: "→", text: "shipped: the next version, named and dated" },
    ],
  },
];

/* ---------- Proof ---------- */

export const PROOF_STATS = {
  anime: 586,
  episodes: 5805,
  minutes: 144204,
  mean: 87.8,
};

export const PROOF_CARDS: { glyph: string; title: string; desc: string }[] = [
  {
    glyph: "branch",
    title: "Versioned in public",
    desc: "Every ROM build, module and engine lives on GitHub — named, dated, and reproducible from source.",
  },
  {
    glyph: "bolt",
    title: "OTA-surviving by design",
    desc: "Modules and hooks are written to survive updates, because a mod that dies on patch Tuesday was never finished.",
  },
  {
    glyph: "shield",
    title: "SELinux-aware, always",
    desc: "Permissive mode is a debug tool, not a shipping config. Policies get written; shortcuts get documented.",
  },
  {
    glyph: "layers",
    title: "Minimalism as method",
    desc: "The same restraint I look for in Japanese music shapes the code: fewer layers, fewer excuses.",
  },
];

export const MUSIC = {
  handle: "zensxin",
  url: "https://www.last.fm/user/zensxin",
  now: { track: "in the pool", artist: "kensuke ushio", vol: 85 },
  genres: ["city pop", "lo-fi", "ambient", "jazz fusion", "OST"],
};

export const ANIME = {
  handle: "zensxin",
  url: "https://anilist.co/user/zensxin/",
  count: 586,
  episodes: 5805,
  minutes: 144204,
  mean: 87.8,
};

/* ---------- Now ---------- */

export const QUOTES: { text: string; author: string }[] = [
  { text: "Want to run away with me?", author: "Reze" },
  { text: "I also never went to school.", author: "Reze" },
  { text: "Even if my heart is fake, my feelings are real.", author: "Reze" },
  { text: "Maybe a normal life was the real dream.", author: "Reze Arc" },
  { text: "Spring will be here soon.", author: "Your Lie in April" },
  { text: "Was I able to live inside someone's heart?", author: "Your Lie in April" },
];

export const INTERESTS: { glyph: string; title: string; desc: string }[] = [
  {
    glyph: "torii",
    title: "Anime",
    desc: "The same precision that goes into a great anime arc goes into good engineering. Methodical, intentional, atmospheric.",
  },
  {
    glyph: "gamepad",
    title: "Gaming",
    desc: "Games that reward mastery of systems — the same instinct that pulls me toward kernel internals and modded hardware.",
  },
  {
    glyph: "note",
    title: "Japanese Music",
    desc: "City pop, lo-fi, and everything in between. Texture and restraint as a form of expression — music that breathes.",
  },
];

/* ---------- Play ---------- */

export type Game = { id: string; icon: "snake" | "pong" | "quiz" | "flappy" | "mines" | "reaction" | "dodge"; name: string; desc: string; playable: boolean };

export const GAMES: Game[] = [
  { id: "snake", icon: "snake", name: "Snake", desc: "Classic game. High chance of self-sabotage.", playable: true },
  { id: "pong", icon: "pong", name: "Ping Pong", desc: "You vs an AI paddle. First to 5 wins.", playable: true },
  { id: "quiz", icon: "quiz", name: "Roast Quiz", desc: "A personality test but every answer is a personal attack.", playable: true },
  { id: "flappy", icon: "flappy", name: "Flappy", desc: "Infuriating physics. Avoid the pipes.", playable: false },
  { id: "mines", icon: "mines", name: "Minesweeper", desc: "Classic logic. Avoid the mines.", playable: false },
  { id: "reaction", icon: "reaction", name: "Reaction Test", desc: "Click when it turns green.", playable: true },
  { id: "dodge", icon: "dodge", name: "Dodge", desc: "Survive against angry geometry.", playable: false },
];

export const QUIZ = [
  { q: "Pick a debugging style.", opts: ["Logs everywhere", "Read docs", "Blame vendor"], roasts: ["Chaotic but effective.", "Rare discipline.", "Valid, sadly."] },
  { q: "Your debugging style?", opts: ["Scientific", "Panic console logs", "Blame vendor blobs"], roasts: ["Responsible. Suspicious.", "A classic gremlin.", "Correct, honestly."] },
  { q: "Pick a superpower.", opts: ["Fastboot never fails", "Infinite battery", "No merge conflicts"], roasts: ["Impossible dream.", "Rooted monk energy.", "Too powerful."] },
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
  { name: "Telegram", handle: "@therealreze", url: "https://t.me/therealreze" },
  { name: "Instagram", handle: "@4nx3b", url: "https://instagram.com/4nx3b" },
  { name: "Discord", handle: "therealreze", url: "https://discord.com/users/1128166734604537949" },
  { name: "YouTube Music", handle: "channel", url: "https://music.youtube.com/channel/UCzCt_fdj0vtv6U3bpVrHNzA" },
  { name: "Last.fm", handle: "zensxin", url: "https://www.last.fm/user/zensxin" },
  { name: "AniList", handle: "zensxin", url: "https://anilist.co/user/zensxin/" },
  { name: "Snapchat", handle: "@zensxin", url: "https://www.snapchat.com/@zensxin" },
  { name: "Pinterest", handle: "zensxin", url: "https://www.pinterest.com/zensxin/" },
  { name: "Facebook", handle: "therealreze", url: "https://www.facebook.com/therealreze" },
  { name: "Trakt", handle: "zensxin", url: "https://trakt.tv/users/zensxin" },
  { name: "Email", handle: "say hello", url: "#ask" },
];

export const LIVE_SITE = "https://therealreze.vercel.app";

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

/* ---------- Signal radio (real audio streams) ---------- */

export const RADIO_TRACKS = [
  { id: "01", title: "in the pool", artist: "kensuke ushio", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3" },
  { id: "02", title: "night drive", artist: "signal radio", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-8.mp3" },
  { id: "03", title: "zephyr loop", artist: "signal radio", src: "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3" },
];
