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
