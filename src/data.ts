import p01 from "./assets/reze/reze-01.jpg";
import p02 from "./assets/reze/reze-02.jpg";
import p03 from "./assets/reze/reze-03.jpg";
import p04 from "./assets/reze/reze-04.jpg";
import p05 from "./assets/reze/reze-05.jpg";
import p06 from "./assets/reze/reze-06.jpg";
import p07 from "./assets/reze/reze-07.jpg";
import p08 from "./assets/reze/reze-08.jpg";
import p09 from "./assets/reze/reze-09.jpg";
import p10 from "./assets/reze/reze-10.jpg";
import poster from "./assets/reze/lunaris-poster.jpg";

export const PHOTOS = [p01, p02, p03, p04, p05, p06, p07, p08, p09, p10];
export const LUNARIS_POSTER = poster;

export const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Skills", href: "#skills" },
  { label: "Work", href: "#work" },
  { label: "Process", href: "#process" },
  { label: "Proof", href: "#proof" },
  { label: "Play", href: "#play" },
];

export const TICKER_ITEMS = [
  "status: open for collabs",
  "Lunaris OS 3.11 · Zephyr — stable",
  "rooted since day one",
  "IST · GMT+5:30",
  "zensxin on last.fm & anilist",
  "9 public repos · 40★ ArchiveTune",
  "magisk + kernelsu",
];

export const HERO_STATS = [
  { value: 12, suffix: "", label: "skills loaded" },
  { value: 9, suffix: "", label: "public repos" },
  { value: 586, suffix: "", label: "anime watched" },
  { value: 5805, suffix: "", label: "episodes logged" },
];

export const TERMINAL_LINES = [
  "$ init /system/bin/reze",
  "✔ mount super partition … ok",
  "✔ verify boot image … ok",
  "▲ inject magisk modules … 12 loaded",
  "$ start signal",
  "▲ therealreze online — open for collabs",
];

export const HERO_CHIPS = ["Root Modules", "Custom ROM", "Magisk", "KernelSU"];

export const HERO_COPY =
  "Root modules. Custom ROMs. Pushing devices past what stock firmware ever permits — the hardware answers to you, not its manufacturer.";

export const TICKER_TOOLS = [
  "Magisk", "KernelSU", "AOSP", "LineageOS", "ADB", "Fastboot", "SELinux",
  "vendor blobs", "device trees", "Zephyr", "overlayfs", "init scripts",
];

export const ABOUT_PARAS = [
  "I'm therealreze — an Android root specialist. I live at the intersection of low-level system code, kernel internals, and the philosophy that your hardware should answer to you, not its manufacturer.",
  "My work focuses on custom ROM development and root module building — Magisk and KernelSU modules that let you push a device past what stock firmware ever permits. If it involves a bootloader or a system partition, I'm on it.",
  "When I'm not writing modules or reading kernel patches, I'm deep in anime or exploring the quiet aesthetic of Japanese music. The same minimalism I look for there shows up in how I approach code.",
];

export type Skill = { icon: string; name: string; sub: string; cat: string; image: string };
export const SKILLS: Skill[] = [
  { icon: "🤖", name: "Android Root & Bootloader", sub: "ADB, Fastboot, unlocking, partition management", cat: "CORE", image: p01 },
  { icon: "🧩", name: "Magisk Module Development", sub: "Module scripting, props, overlays, hooks", cat: "ROOT", image: p02 },
  { icon: "🔑", name: "KernelSU Integration", sub: "Kernel-level root, module API, overlayfs", cat: "ROOT", image: p03 },
  { icon: "💿", name: "Custom ROM Development", sub: "AOSP, LineageOS, build system, device trees", cat: "ROM", image: p04 },
  { icon: "🌙", name: "ROM Porting & Adaptation", sub: "Device bring-up, HAL fixes, vendor blobs", cat: "ROM", image: p05 },
  { icon: "⚙️", name: "ADB / Fastboot", sub: "Debugging, flashing, sideloading, scripting", cat: "TOOLS", image: p06 },
  { icon: "🐧", name: "Linux & Bash Scripting", sub: "Shell scripts, system automation, cron, sed/awk", cat: "TOOLS", image: p07 },
  { icon: "🛡️", name: "Android Security & SELinux", sub: "Policy writing, permissive modes, audit2allow", cat: "CORE", image: p08 },
  { icon: "💾", name: "Partition & Storage Management", sub: "Super, vendor, system, userdata, recovery", cat: "CORE", image: p09 },
  { icon: "📦", name: "Open Source Development", sub: "GitHub, git, versioning, CI/CD basics", cat: "DEV", image: p10 },
  { icon: "🔧", name: "Kernel Customisation", sub: "Config tuning, governors, I/O schedulers, patches", cat: "ROM", image: p02 },
  { icon: "📱", name: "Device Tree Maintenance", sub: "BoardConfig, overlays, fstab, init scripts", cat: "ROM", image: p05 },
];
export const SKILL_CATS = ["ALL", "CORE", "ROOT", "ROM", "TOOLS", "DEV"];

export const LUNARIS = {
  name: "Lunaris OS 3.11",
  variant: "Zephyr · GApps Variant",
  build: "26th June 2026",
  desc: "A clean, performance-tuned custom ROM built for daily driving. Lunaris OS 3.11 (Zephyr) ships with GApps pre-integrated — a smooth stock-adjacent experience with meaningful under-the-hood enhancements: battery optimizations, kernel tweaks, and a refined UI that stays out of your way.",
  devices: ["Realme GT Neo 3", "OnePlus 10R"],
  download: "https://github.com/4nx3b/Zephyr",
  support: "https://t.me/therealreze",
};

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
  { name: "Vercel-Website", desc: "This portfolio — SIGNAL design system, static site, serverless APIs.", lang: "JavaScript", stars: 0, forks: 1, fork: false, updated: "2026-09-17", url: "https://github.com/4nx3b/Vercel-Website" },
  { name: "core", desc: "Custom audio and YouTube parser engine for ArchiveTune.", lang: "Kotlin", stars: 0, forks: 0, fork: true, updated: "2026-09-16", url: "https://github.com/4nx3b/core" },
  { name: "4nx3b", desc: "Stuff about me — profile repository.", lang: "Python", stars: 2, forks: 0, fork: false, updated: "2026-09-18", url: "https://github.com/4nx3b/4nx3b" },
  { name: "NuvioMobile", desc: "Unofficial Nuvio Mobile repository.", lang: "Kotlin", stars: 0, forks: 0, fork: true, updated: "2026-09-12", url: "https://github.com/4nx3b/NuvioMobile" },
  { name: "lyrics", desc: "Lyrics library for ArchiveTune.", lang: "Kotlin", stars: 0, forks: 0, fork: true, updated: "2026-08-30", url: "https://github.com/4nx3b/lyrics" },
  { name: "morideobfuscator", desc: "Internal deobfuscator engine powered by Rhino, for ArchiveTune.", lang: "Kotlin", stars: 0, forks: 0, fork: true, updated: "2026-08-23", url: "https://github.com/4nx3b/morideobfuscator" },
  { name: "OpenHouse", desc: "Open house — experiments in the open.", lang: "JavaScript", stars: 0, forks: 0, fork: false, updated: "2026-07-23", url: "https://github.com/4nx3b/OpenHouse" },
  { name: "Zephyr", desc: "Build system behind Lunaris OS 3.11 Zephyr.", lang: "Makefile", stars: 0, forks: 0, fork: true, updated: "2026-07-09", url: "https://github.com/4nx3b/Zephyr" },
];

export type Project = {
  index: string;
  version: string;
  client: string;
  sector: string;
  title: string;
  desc: string;
  metrics: { value: string; label: string }[];
  tags: string[];
  image: string;
  accent: "lime" | "mint" | "skyy" | "coral";
  link: string;
  linkLabel: string;
};

export const PROJECTS: Project[] = [
  {
    index: "01",
    version: "v3.11 · stable",
    client: "Lunaris OS",
    sector: "Custom ROM",
    title: "A daily-driver ROM that stays out of your way",
    desc: "Zephyr ships with GApps pre-integrated and a stock-adjacent feel — battery optimizations, kernel tweaks and a refined UI on top. Built for the Realme GT Neo 3 and OnePlus 10R, versioned in public since the first flash.",
    metrics: [
      { value: "2", label: "supported devices" },
      { value: "GApps", label: "pre-integrated" },
      { value: "26.06", label: "2026 build date" },
    ],
    tags: ["AOSP", "Zephyr", "Kernel tweaks", "Device trees"],
    image: poster,
    accent: "lime",
    link: "https://github.com/4nx3b/Zephyr",
    linkLabel: "Download — read support first",
  },
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
    image: p02,
    accent: "mint",
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
    image: p07,
    accent: "skyy",
    link: "https://github.com/4nx3b/4nx3b",
    linkLabel: "Say hi on the profile",
  },
  {
    index: "04",
    version: "v3.0 · live",
    client: "Vercel-Website",
    sector: "Portfolio",
    title: "A personal site built like a system, not a page",
    desc: "17 isolated init modules, serverless APIs, Firestore AMA, theming and a playground — fault-isolated so one failing module never breaks the page. The codebase this very design borrows from.",
    metrics: [
      { value: "17", label: "isolated modules" },
      { value: "09", label: "numbered sections" },
      { value: "1", label: "signal, many outputs" },
    ],
    tags: ["JavaScript", "Vercel", "Serverless", "SIGNAL system"],
    image: p09,
    accent: "coral",
    link: "https://github.com/4nx3b/Vercel-Website",
    linkLabel: "Read the source",
  },
];

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

export const PROOF_STATS = {
  anime: 586,
  episodes: 5805,
  minutes: 144204,
  mean: 87.8,
};

export const PROOF_CARDS = [
  {
    icon: "branch",
    title: "Versioned in public",
    desc: "Every ROM build, module and engine lives on GitHub — named, dated, and reproducible from source.",
  },
  {
    icon: "bolt",
    title: "OTA-surviving by design",
    desc: "Modules and hooks are written to survive updates, because a mod that dies on patch Tuesday was never finished.",
  },
  {
    icon: "shield",
    title: "SELinux-aware, always",
    desc: "Permissive mode is a debug tool, not a shipping config. Policies get written; shortcuts get documented.",
  },
  {
    icon: "layers",
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

export const QUOTES: { text: string; author: string; rotate: number }[] = [
  { text: "Want to run away with me?", author: "Reze", rotate: -2 },
  { text: "I also never went to school.", author: "Reze", rotate: 1.5 },
  { text: "Even if my heart is fake, my feelings are real.", author: "Reze", rotate: -1 },
  { text: "Maybe a normal life was the real dream.", author: "Reze Arc", rotate: 2 },
  { text: "Spring will be here soon.", author: "Your Lie in April", rotate: -1.5 },
  { text: "Was I able to live inside someone’s heart?", author: "Your Lie in April", rotate: 1 },
];

export const INTERESTS = [
  { icon: "⛩", title: "Anime", desc: "The same precision that goes into a great anime arc goes into good engineering. Methodical, intentional, atmospheric." },
  { icon: "🎮", title: "Gaming", desc: "Games that reward mastery of systems — the same instinct that pulls me toward kernel internals and modded hardware." },
  { icon: "🎵", title: "Japanese Music", desc: "City pop, lo-fi, and everything in between. Texture and restraint as a form of expression — music that breathes." },
];

export type Game = { id: string; icon: string; name: string; desc: string; playable: boolean };
export const GAMES: Game[] = [
  { id: "snake", icon: "♞", name: "Snake", desc: "Classic game. High chance of self-sabotage.", playable: true },
  { id: "pong", icon: "◉", name: "Ping Pong", desc: "You vs an AI paddle. First to 5 wins.", playable: true },
  { id: "quiz", icon: "▱", name: "Roast Quiz", desc: "A personality test but every answer is a personal attack.", playable: true },
  { id: "flappy", icon: "⌁", name: "Flappy", desc: "Infuriating physics. Avoid the pipes.", playable: false },
  { id: "mines", icon: "⚑", name: "Minesweeper", desc: "Classic logic. Avoid the mines.", playable: false },
  { id: "reaction", icon: "◌", name: "Reaction Test", desc: "Click when it turns green.", playable: true },
  { id: "dodge", icon: "⌖", name: "Dodge", desc: "Survive against angry geometry.", playable: false },
];

export const QUIZ = [
  { q: "Pick a debugging style.", opts: ["Logs everywhere", "Read docs", "Blame vendor"], roasts: ["Chaotic but effective.", "Rare discipline.", "Valid, sadly."] },
  { q: "Your debugging style?", opts: ["Scientific", "Panic console logs", "Blame vendor blobs"], roasts: ["Responsible. Suspicious.", "A classic gremlin.", "Correct, honestly."] },
  { q: "Pick a superpower.", opts: ["Fastboot never fails", "Infinite battery", "No merge conflicts"], roasts: ["Impossible dream.", "Rooted monk energy.", "Too powerful."] },
];

export type Social = { name: string; handle: string; url: string; icon: string };
export const SOCIALS: Social[] = [
  { name: "GitHub", handle: "@4nx3b", url: "https://github.com/4nx3b", icon: "github" },
  { name: "Telegram", handle: "@therealreze", url: "https://t.me/therealreze", icon: "telegram" },
  { name: "Instagram", handle: "@4nx3b", url: "https://instagram.com/4nx3b", icon: "instagram" },
  { name: "Discord", handle: "therealreze", url: "https://discord.com/users/1128166734604537949", icon: "discord" },
  { name: "YouTube Music", handle: "channel", url: "https://music.youtube.com/channel/UCzCt_fdj0vtv6U3bpVrHNzA", icon: "youtube" },
  { name: "Last.fm", handle: "zensxin", url: "https://www.last.fm/user/zensxin", icon: "lastfm" },
  { name: "AniList", handle: "zensxin", url: "https://anilist.co/user/zensxin/", icon: "anilist" },
  { name: "Snapchat", handle: "@zensxin", url: "https://www.snapchat.com/@zensxin", icon: "snapchat" },
  { name: "Pinterest", handle: "zensxin", url: "https://www.pinterest.com/zensxin/", icon: "pinterest" },
  { name: "Facebook", handle: "therealreze", url: "https://www.facebook.com/therealreze", icon: "facebook" },
  { name: "Trakt", handle: "zensxin", url: "https://trakt.tv/users/zensxin", icon: "trakt" },
  { name: "Email", handle: "say hello", url: "https://therealreze.vercel.app/#ask", icon: "mail" },
];

export const LIVE_SITE = "https://therealreze.vercel.app";
