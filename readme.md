# therealreze.vercel.app — SIGNAL design system

A single-page personal portfolio for an Android root specialist & custom ROM
developer. Complete UI rebuild (SIGNAL system): dark-first, technical-editorial
layout, acid-lime accent, mono data labels, numbered sections, mobile bottom
dock navigation.

## Tech stack

Simple static site — no build step, no framework:

- `index.html` — full page structure
- `style.css` — SIGNAL design system (tokens, components, responsive rules)
- `script.js` — modular UI + data layer (17 isolated init steps)
- `assets/img/` — optimized photos + ROM poster (lazy-loaded)
- Vercel for hosting, `/api/*` serverless functions
- Firebase/Firestore for AMA questions
- Optional Telegram/Formspree notifications

## Design system

| Token group | Values |
|---|---|
| Fonts | Space Grotesk (display) · Inter (body) · JetBrains Mono (data) |
| Dark colors | bg `#0a0b0d` · surface `#141519` · text `#f2f3f0` · accent `#c9f73a` |
| Light colors | bg `#f2f2ee` · surface `#ffffff` · accent-text `#5a7200` |
| Radius | 8 / 12 / 18 px, pill |
| Motion | 150 / 240 / 420 ms · `cubic-bezier(.22,1,.36,1)` |
| Layout | 1100px max width, numbered sections 00–09 |

Accessibility: semantic landmarks, `:focus-visible` rings, aria labels,
`prefers-reduced-motion` support, WCAG-passing contrast in both themes.

## Features

1. **Boot overlay** — fast terminal-style intro, tap to skip
2. **Hero** — live IST clock, status line, CTAs
3. **About** — photo strip (manual nav + dots + 7s auto-advance), live stats
4. **Skills** — 12 skills, 5 category tabs
5. **Work** — Lunaris OS featured card + live GitHub repos (filter + search)
6. **Music** — Last.fm dashboard (stats, top tracks/artists, recent with
   now-playing) + site music player (audio engine, seek, volume)
7. **Anime** — AniList integration (stats, status tabs, pagination)
8. **Now** — quote card, time-link card, interest cards
9. **Play** — 7 canvas games (Snake, Pong, Roast Quiz, Flappy, Minesweeper,
   Reaction, Dodge) in modal shells
10. **Ask** — AMA with Firestore persistence, upvotes, sorting, pagination,
    owner dashboard (answer/dismiss/delete), Telegram + Formspree notify
11. **Links** — 12 social links, credits, changelog modal
12. **Theming** — dark/light toggle, persisted

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
2. Import the repository on Vercel (framework preset: Other/static).
3. Set the environment variables above.
4. Deploy. `/api/*` files become serverless functions automatically.

## Maintenance tips

- All JS lives in isolated modules (`Theme`, `Boot`, … `AMA`); init is
  fault-isolated — one failing module never breaks the page.
- Keep game implementations inside the `Games` module; each returns a cleanup
  function that the modal close handler invokes.
- AMA keys in localStorage: `ama_owner_auth_v4`, `ama_pending_questions_v4`,
  `ama_voted_question_ids_v6`, `ama_public_sort_v6`.
- Test mobile Chrome after every change; check 320px for overflow.
