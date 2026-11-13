# therealreze.vercel.app — editorial field-notes system

A single-page portfolio for an Android root specialist and custom ROM
developer, laid out like a ROM developer's field notebook: warm drafting
paper, ink, one vermilion mark, §-numbered sections, figure captions and
margin notes.

> The visual system (tokens, type, layout patterns and motion) is modelled on
> [curialy.tech](https://curialy.tech/). All copy and artwork, including the
> FIG. 1 exploded-phone drawing, are original and written from this
> portfolio's own content.

## Tech stack

- React 19 + TypeScript, Vite 7, Tailwind CSS v4 (`@tailwindcss/vite`)
- `vite-plugin-singlefile`: the build inlines everything into one `index.html`
- `lucide-react` icons
- Vercel for hosting, `/api/*` serverless functions
- Firebase/Firestore for AMA questions, Telegram + Formspree notifications

```txt
src/
├─ index.css            # tokens (@theme), motion keyframes, reveal + reduced motion
├─ App.tsx              # skip link · Nav · main sections · Footer
├─ components/          # Hero, FigPhone, ToolStrip, Skills, Process, Work,
│                       # Now (+ Play games), Principles, Ask, Links, Footer, ui
├─ hooks/useInView.ts   # IntersectionObserver reveal, IST clock, count-up
└─ lib/data.ts          # all content + AMA/Firebase/radio config
```

`npm run dev` · `npm run build` · `npm run preview`

## Design system

| Token group | Values |
|---|---|
| Fonts | Instrument Serif (display, one italic vermilion word per headline) · Geist 300–700 (text/UI) · Geist Mono 400/500 (labels, chips, code) |
| Paper + ink | paper `#f3efe6` · paper-deep `#e9e3d5` · card `#f8f5ee` · ink `#14130f` · ink-soft `#3a372f` · graphite `#6f6a5d` · rule `#d8d0bf` / `#8a8475` |
| Accent | vermilion `#ff4a1c` (fills, always with ink text) · vermilion-ink `#b8300c` (text on paper) · wash `#fbe3d9` · moss `#4f7a3a` |
| Dark panel (§ 03) | panel `#1b1a15` / `#211f19` / `#141310` · text `#f3efe6` · ok `#9bd17b` · err `#ff8a6b` |
| Type scale | micro 10.5 · 12 · 13 · 14 · 16 body · lede 18–20 · title 24 · page clamp 30–40 · display clamp 36–60 · hero clamp 44–96 px |
| Radius / elevation | 4 / 8 / 10 / 14 / 18 px, pill · hard ink offset shadow `6px 6px 0 #14130f` on the init card and AMA composer only |
| Motion | `--dur-enter .56s` · `--dur-reveal .75s` · `--dur-hero .9s` · `--dur-figure 1.2s` · `--dur-swap .4s` · ease-out `cubic-bezier(.22,1,.36,1)` · 70 ms stagger |
| Layout | 1240px max width, 32px gutter (20px on phones) |

Motion: keyframes `rise`, `settle`, `draw`, `marquee`, `grow-y`, `grow-x`,
`spark`, `step-slide`, `caret-blink`. The one orchestrated moment is the
hero on load (headline lines rise 70 ms apart, FIG. 1 strokes draw, the init
card settles, all done by about 1.6 s). Elsewhere: `[data-reveal]` scroll
reveals (gated on `html.js`, so content shows without JS), the timeline
spine, and the tab swap. The marquee pauses on hover and focus. Under
`prefers-reduced-motion: reduce` everything is shown, strokes are drawn,
count-ups land on their final values and nothing moves.

Accessibility: skip link, one h1, header/main/footer landmarks, 2px
`:focus-visible` rings on paper and on the dark panel, labelled fields,
44px touch targets, no sideways scroll at 320px, and text contrast of
4.5:1 or better.

## Sections

| § | Section | Contents |
|---|---|---|
| 00 | Hero | headline, FIG. 1 exploded phone + partition stack, init card with Magisk/KernelSU toggle and copy command, margin note |
| — | Tool strip | tool marquee |
| 01 | Skills | sticky intro, five hairline rows (Core, Root, ROM, Tools, Dev) |
| 02 | Process | five-stage timeline with build logs |
| 03 | Work | dark panel: Lunaris OS build window, projects, live GitHub repo table (cached fallback) |
| 04 | Now & Play | tabs: Anime (AniList stats), Music (signal radio, no autoplay), Gaming, Play (Snake, Pong, Roast Quiz, Reaction Test) |
| 05 | Principles | count-up stats, pull quote, about, two principles |
| 06 | Ask | AMA composer + answered questions (Firestore, votes, owner console) |
| — | Links, Footer | 12 channels, site map, IST clock |

## API routes (serverless)

```txt
api/
├─ site-content.js       # public published-content/image reads; owner-authenticated writes
├─ telegram.js           # sends Telegram notification for new questions
├─ telegram-webhook.js   # Telegram bot reply-to-answer support
└─ ama-vote.js            # vote sync to Firestore (service account)
```

`functions/api/site-content.js` mirrors the published-content and image API for Cloudflare Pages.

Environment variables used by the API routes: `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, `FIREBASE_SERVICE_ACCOUNT_KEY` (+ optional
`FIREBASE_PROJECT_ID`). Vercel, Cloudflare Pages, and Wasmer all use the same
Firestore project (`therealreze-2a3bf`) as the source of truth for published
content and uploaded images. Vercel and Cloudflare use their `/api/site-content`
functions; static hosts without that function (including Wasmer) fall back to
owner-authenticated Firestore REST writes and public Firestore reads. Deploy
`firestore.rules` for those direct paths to work.

## Deployment on Vercel

1. Push to GitHub.
2. Import the repository on Vercel (framework preset: Vite; build `npm run build`, output `dist`).
3. Set the environment variables above.
4. Deploy. `/api/*` files become serverless functions automatically.

## Maintenance tips

- Components use the tokens in `src/index.css`; avoid literal colours and
  `transition: all`.
- Game implementations live in `src/components/Play.tsx`; each cleans up its
  loop when its modal closes.
- AMA keys in localStorage: `ama_owner_auth_v4`, `ama_pending_questions_v4`,
  `ama_voted_question_ids_v6`, `ama_public_sort_v6`.
- Test mobile Chrome after every change; check 320px for overflow.

## Cloudflare Pages

The site also deploys to Cloudflare Pages (`v3rsi0n.miuka.moe`). Cloudflare must serve the
**built** output, not the repo root — serving the root makes the browser load the source
`/src/main.tsx` as `application/octet-stream`, which leaves a blank page.

In the Cloudflare dashboard (Pages → project → Settings → Build):

| Setting | Value |
| --- | --- |
| Build command | `npm run build` |
| Build output directory | `dist` (also set in `wrangler.toml`) |
| Environment variable | `NODE_VERSION = 22.12.0` |

`functions/` holds Cloudflare Pages Functions for the routes that need a host API, including shared site content and images. Vercel ignores this folder and keeps using `/api`.

### If the live Cloudflare site looks old or blank

When `v3rsi0n.miuka.moe` still serves a tiny page that loads `/src/main.tsx` (stale anime
stats, blank playlist covers, `/api/*` returning HTML), Cloudflare is serving an **old
deployment** because newer builds are failing. Check, in order:

1. **Workers & Pages → project → Deployments**: the latest build must be green. If it is
   red, open it and copy the build log.
2. **Settings → Build**: command `npm run build`, output directory `dist`. Node comes from
   `.node-version` (22.12.0 — Vite 7 needs Node ≥ 20.19); or set `NODE_VERSION = 22.12.0`.
3. **Speed → Optimization → Rocket Loader: Off.** Every script also carries
   `data-cfasync="false"` so Rocket Loader skips them, but turning it off is safest.
4. Functions in `functions/` are picked up automatically; after a green build,
   `/api/yt-cover?id=…` answers with a 302 and `/api/yt-playlists` with JSON.

`public/_headers` is copied into `dist` and only read by Cloudflare. Routes implemented in
`functions/` work there; unmirrored API routes such as Telegram notifications still fall back to
cached or local behavior. Vercel deploys are unaffected by these files.

## Shared published content across the three hosts

The live document is `siteContent/live` in the shared Firebase project `therealreze-2a3bf`.
Build the same repository for `therealreze.vercel.app`, `v3rsi0n.wasmer.app`, and
`v3rsi0n.miuka.moe`; each host reads that same Firestore document rather than keeping its own
published copy. The content functions reject a `FIREBASE_PROJECT_ID` override that differs from
the client project, rather than silently creating separate copies. Vercel and Cloudflare use their
site-content functions. Wasmer is treated as a static host: when `/api/site-content` is absent,
the editor reads and writes Firestore directly with the signed-in owner token. Uploaded images use `siteImages/{id}` and have the same API /
direct-Firestore fallback. This direct path is gated by `firestore.rules`.

There is no Wasmer deployment manifest in this repository. Configure its project to build this
repository with `npm ci && npm run build` and serve the generated `dist` directory. Deploy the
Firestore rules below before relying on Wasmer reads, publishing, or image uploads. Keep the
Firebase project ID / web API key and the Vercel and Cloudflare service-account configuration
pointed at the same Firebase project. If the Firebase web API key has HTTP-referrer restrictions,
allow `therealreze.vercel.app`, `v3rsi0n.wasmer.app`, and `v3rsi0n.miuka.moe`.

Published content, uploaded images, and the owner profile are shared. Owner login sessions and
unpublished drafts remain browser-origin-local, so sign in separately on each domain and publish
the draft to make it live everywhere.

## Owner editor and page builder

Open the site menu (hamburger) and choose **Owner login**; the login entry is only in the sidebar.
After signing in, the same sidebar shows the owner profile icon. Choose **Set profile icon** or
**Change icon** to upload a PNG, JPEG, or WebP image; it is resized and saved in
`siteOwner/profile` so it appears on later logins and all three hosts.

From the sidebar, choose **Open page builder**. The workshop is owner-only and previews the
private draft behind its panel; visitors continue to see the last published version until you
choose **Publish to everyone**.

Use **Page order** to move, hide, restore, duplicate, or remove sections. **Start a new section**
offers a blank canvas, field-note, quote-band, and feature-grid templates. Compose custom sections
from headings, paragraphs, pull quotes, link buttons, optimized images, cards, callouts, lists,
metrics, existing ROM/app project tiles, dividers, and spacing blocks; reorder or remove individual
blocks in their settings. Every section can use an editorial, split, card-grid, or banner
composition; paper, ink, or vermilion surfaces; optional grid/dot/hatch textures; and reveal,
stagger, scroll-stack, drift, or still motion.
The **Design system** controls the site-wide font and motion presets, while the closing band/footer
can be hidden without deleting its content. The Ask section stays visible for its public question
feed and owner moderation console. Custom sections can add themselves to the navigation.

Uploaded builder images use the owner-authenticated media API or the Firestore fallback on static hosts;
they are compressed to WebP (maximum 1600px / 700 KB). **Edit mode** also keeps the inline text
and image tools available on the live page. Drafts are stored locally for the owner; the published
Firestore document is the shared source of truth, so publishing is required for all visitors to see
changes.

**Publish** saves to Firestore (`siteContent/live`), **Discard** drops the local draft, and **Reset**
clears all published overrides.

On Vercel and Cloudflare, `/api/site-content` reads and writes published content, uploaded images,
and the shared owner profile with the service account (`FIREBASE_SERVICE_ACCOUNT_KEY`, the same
variable `/api/ama-vote` uses). Writes are authenticated against the fixed owner Firebase account.
If the function is missing or cannot write, the site falls back to direct Firestore REST; profile
writes use a narrowly scoped owner-account rule, while site content and media keep the verified-owner
rule.

- **Vercel:** use the service-account environment variable configured for the project.
- **Cloudflare:** add `FIREBASE_SERVICE_ACCOUNT_KEY` under Workers & Pages → project →
  Settings → Variables and Secrets (same JSON value), then redeploy.
- **Wasmer:** no service-account function is required; direct Firestore publishing, image access,
  and the shared owner icon work after the rules below are deployed.

Deploy the rules (required for Wasmer direct reads/writes and any direct-Firestore fallback). They
also make shared owner profiles and images readable from static hosts and keep the AMA queue private
until answered. The CLI command publishes the rules and the composite index used by the public
answered-question query:

```sh
firebase deploy --project therealreze-2a3bf --only firestore:rules,firestore:indexes
```

Or paste `firestore.rules` in Firebase Console → **Firestore Database** → **Rules** and publish it, then create the `amaQuestions` composite index from `firestore.indexes.json` in the **Indexes** tab.

The Vercel and Cloudflare content APIs use their service account and do not rely on client rules for those API reads and writes. If an API returns `PERMISSION_DENIED`, grant its service account Firestore access and confirm `FIREBASE_PROJECT_ID` points at this same database. Wasmer and any direct-Firestore fallback still require the deployed rules. After Publish, the editor reports **"live for everyone"** only once the shared Firestore document can be read back; otherwise it reports the missing access or API setup.
