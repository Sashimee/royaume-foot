# 👑⚽ Royaume Foot

A 3D princess football game that runs **entirely in the browser**. No account, no
backend, nothing uploaded — the whole thing is static files on GitHub Pages.

**Play: https://sashimee.github.io/royaume-foot/**

Built for **6–7 year olds**, which drove every design decision:

- **One gesture.** Flick towards the goal. No buttons to hold, no timing window.
- **No reading required.** Every control carries an emoji or a shape that means
  the same thing. The words are for the grown-up nearby.
- **No fail state.** A missed shot bounces back and the keeper waves. A round
  always ends with at least one star.
- **The wardrobe is the reward**, not the score — six princesses, five balls,
  unlocked by playing, never bought with a currency.

Multilingual: 🇫🇷 🇬🇧 🇩🇪 🇪🇸 🇮🇹 🇵🇹

## Stack

| Concern | Choice |
| --- | --- |
| UI | React 19 + TypeScript |
| 3D | three.js + `@react-three/fiber` |
| Build | Vite 8 |
| Styling | Tailwind v4 |
| State | zustand (+ `localStorage` for progress) |
| Hosting | GitHub Pages |

**No binary assets.** Princesses, the dragon keeper and the castle are built from
primitives; grass, netting and ball skins are drawn with the 2D canvas API at
startup; sounds are synthesised with Web Audio. The repo ships text only.

## Commands

```bash
npm install
npm run dev        # http://localhost:5173/royaume-foot/
npm run build      # tsc -b && vite build → dist/
npm run lint       # type-check only
npm test           # unit tests (game rules, pure TS)
npm run test:e2e   # Playwright — plays a real round in a browser
```

## How it fits together

```
src/
├── game/     # pure rules: physics, aim, scoring, keeper. No three imports.
├── three/    # the scene: pitch, princess, keeper, ball, the match loop
├── ui/       # DOM overlay (HUD, wardrobe, result) — Tailwind, not 3D
├── store/    # zustand: round state + persisted save
├── audio/    # Web Audio synthesis
└── i18n/     # six flat translation maps
```

The rules in `src/game/` never import three, so they unit-test without a canvas
and the simulation can be reasoned about on its own.

`src/game/balance.test.ts` is a **difficulty harness, not a unit test**: it
sweeps every flick a child could plausibly produce and asserts the game stays
kind — no shot is ever lost sideways, 60–95 % of shots score, a perfect round
stays rare. Retuning `constants.ts` into a punishing game fails CI on purpose.
It is what caught a maximum shot angle that put two thirds of all flicks outside
the posts.

Design rationale and the phase plan: [`docs/plan.md`](docs/plan.md).

## Deployment

Every push to `main` runs lint + unit + e2e, then builds and deploys to Pages.

`base` in `vite.config.ts` **must match the repository name** (`/royaume-foot/`).
Rename the repo and you must change it there too, or every asset 404s.
