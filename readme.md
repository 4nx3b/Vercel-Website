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

## API routes (serverless, unchanged)

```txt
api/
├─ telegram.js           # sends Telegram notification for new questions
├─ telegram-webhook.js   # Telegram bot reply-to-answer support
└─ ama-vote.js           # vote sync to Firestore (service account)
```

Environment variables required by the API routes: `TELEGRAM_BOT_TOKEN`,
`TELEGRAM_CHAT_ID`, `FIREBASE_SERVICE_ACCOUNT_KEY` (+ optional
`FIREBASE_PROJECT_ID`).

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
| Environment variable | `NODE_VERSION = 20` |

`functions/` holds Cloudflare Pages Functions that mirror `/api/yt-playlists` and `/api/yt-cover`, so live playlist covers and counts work on Cloudflare too (Vercel ignores this folder and keeps using `/api`).

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

`public/_headers` is copied into `dist` and only read by Cloudflare. The `/api/*` routes are
Vercel functions, so on Cloudflare the playlist refresh and AMA notifications quietly fall back
to cached or local data. Vercel deploys are unaffected by these files.

## Owner editor

Sign in with the owner account (footer **Owner** link, or open `/#admin`). A toolbar appears at the
bottom: **Edit** turns on inline editing, **Publish** saves to Firestore (`siteContent/live`),
**Discard** drops the local draft, **Reset** clears all published overrides.

Published content is served to visitors by `/api/site-content`, which reads and writes with the
service account (`FIREBASE_SERVICE_ACCOUNT_KEY`, the same variable `/api/ama-vote` uses). Writes
are accepted only when the owner's sign-in token checks out at Google as the admin email.

- **Vercel:** the variable is already set for the AMA, so publishing is live for everyone.
- **Cloudflare:** add `FIREBASE_SERVICE_ACCOUNT_KEY` under Workers & Pages → project →
  Settings → Variables and Secrets (same JSON value), then redeploy.

Also deploy the rules (recommended; it lets the site read Firestore directly as a fallback):

1. Firebase console → **Firestore Database**
2. **Rules** tab
3. Paste the contents of `firestore.rules`
4. **Publish** (or run `firebase deploy --only firestore:rules`)

After Publish the sidebar says **"live for everyone"** only once an anonymous read returns the new
version; otherwise it tells you what is missing.
