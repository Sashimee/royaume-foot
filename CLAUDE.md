# Royaume Foot — project guide

A 3D princess football game for **6–7 year olds**, 100 % client-side, deployed to
GitHub Pages at `https://sashimee.github.io/royaume-foot/`.

Design rationale and phase plan: [`docs/plan.md`](docs/plan.md).

## Commands

```bash
npm run dev        # http://localhost:5173/royaume-foot/
npm run build      # tsc -b && vite build → dist/
npm run lint       # tsc -b --noEmit
npm test           # vitest, unit only
npm run test:e2e   # playwright, plays a real round
```

## The audience is the architecture

Every rule below exists because a six-year-old is holding the tablet. Treat them
as constraints, not preferences.

1. **One gesture.** Flick towards the goal, nothing else. No dual controls, no
   press-and-hold, no timing window.
2. **Never text alone.** Every control carries an emoji or shape with the same
   meaning. Adding a UI string is fine; relying on it is not.
3. **No fail state.** `starsFor()` never returns 0. A missed shot bounces back
   and the keeper waves. Nothing may sound or look like a punishment — see the
   deliberately gentle `sfx.save()`.
4. **Nothing smaller than 64 px** for anything a child taps.
5. **The wardrobe is the reward loop.** Unlocks are star *thresholds*, never a
   spendable currency — "save up or spend now?" is a chore at this age.

## Layout

```
src/
├── game/      # pure rules — physics, aim, scoring, keeper. NEVER imports three.
├── three/     # scene graph + the match loop (Match.tsx owns the simulation)
├── ui/        # DOM overlay: HUD, wardrobe, result. Tailwind, not 3D.
├── store/     # zustand: gameStore (round) + saveStore (persisted)
├── audio/     # Web Audio synthesis, no files
├── data/      # roster (characters, balls), stadiums, mascots — all plain data
└── i18n/      # six flat key→string maps, English fallback, no interpolation
```

## Mini-games

`gameStore.mode` selects one; both share the HUD, the star economy and the
result screen.

| Mode | Verb | Control | Logic |
| --- | --- | --- | --- |
| `shoot` | score past the dragon | flick towards the goal | `game/aim.ts`, `game/scoring.ts` |
| `keep` | save the dragon's shots | drag her along the goal line | `game/keeperGame.ts` |
| `run` | sweep up stars | drag her across the lane | `game/runGame.ts` |

The runner ends on a **clock**, not on a count of attempts, which is why
`gameStore.roundOver` is an explicit flag rather than `shotsTaken >= 5`. Its
stars are a pool of meshes that get moved and hidden, never mounted per spawn —
mounting React nodes twice a second would re-render the scene continuously.

Keeper mode is **telegraphed**: a target ring shows where the shot will land a
full second before the kick. That is the whole reason the mode is fair at this
age — reacting to a ball already in flight is a reflex test, and this is not
that. `ballPosAt()` is analytic precisely so the ball lands exactly where the
ring promised.

## Playable characters

`data/roster.ts` holds a **discriminated union**: a `Princess` has hair and a
dress, a `Knight` has armour and a plume, and they share only a skin tone, a
name and an unlock threshold. Flattening them into one optional-field bag would
let a princess be given a plume.

- Draw one with `<Character>`, never `<Princess>`/`<Knight>` directly. Both
  mini-games, the menu and the wardrobe render it and never learn which kind
  they got — adding a third type is a branch in `Character.tsx` and nowhere else.
- Motion lives in `three/characterRig.ts` and is shared. Princesses and knights
  look nothing alike but move identically, and a copy of the animation per type
  would drift.
- **At least one of each kind must be free** (`unlockStars: 0`), asserted in
  `data/roster.test.ts`. Locking every knight tells a child who wants a knight
  that the game is not for them yet.
- Faces stay visible. The knight's helmet is an open cap on purpose: a closed
  visor is more accurate and completely wrong here, because a blank slit has no
  expression.
- `saveStore` persists `characterId` but still reads the old `princessId` field,
  so upgrading does not wipe a child's save.

## Stadiums

`data/stadiums.ts` is **a palette and nothing else**. The pitch, castle and
stands are the same geometry everywhere; a stadium swaps colours. That is why a
new place to play costs one entry and no new meshes, and why the star economy
can hand out something that changes how the game *looks* rather than adding
another thing to manage.

Anything colour-tinted has to be threaded through, not hard-coded — the grass
texture cache is keyed on its colours (a key of just "grass" hands the beach the
prairie's stripes), and the blob shadow takes a tint, because a green shadow on
snow reads as a sticker.

## Mascots

`data/mascots.ts` is company and nothing else — a mascot never touches the
rules. It trails the player with a lag rather than sitting at a fixed offset: a
pet welded to the character reads as a prop, one that catches up reads as alive.
It clamps itself to `visibleHalfWidthAt(z)`, because following a player who is
themselves near the edge of frame walks the pet straight out of shot.

## Rules that are load-bearing

- **`src/game/*` must never import three.** That separation is what lets the
  whole rule set be unit-tested without a canvas, and it is how the difficulty
  harness works at all.
- **`src/game/balance.test.ts` is a difficulty harness, not a unit test.** It
  sweeps the full space of plausible flicks and asserts the game stays *kind*.
  If you retune `constants.ts` and it fails, the game got mean — fix the tuning,
  do not relax the test. It already caught a max shot angle that put two thirds
  of all flicks outside the posts.
- **Never re-render per frame.** The match loop writes straight to the scene
  graph through refs inside `useFrame`. React state is for discrete events only
  (a shot was judged, the round ended).
- **Never drive a three.js property from both JSX and the frame loop.** R3F
  re-applies its declared props on every re-render and will stamp out imperative
  writes. The keeper-mode telegraph ring is hidden by scaling to zero, not by a
  `visible` prop, for exactly this reason; it also uses `depthTest={false}` so a
  shot aimed at the centre cannot hide the marker behind the princess.
- **Don't clamp `dt` tightly.** `Match.tsx` caps frame delta at 0.25 s, not at
  `1/20` — a small ceiling makes everything below that frame rate run in *slow
  motion* instead of dropping frames. `stepBall` sub-steps internally, so a
  large `dt` is still accurate.
- **Perf budget:** no shadow maps (blob shadows instead), `dpr` capped at 2,
  crowd in one `InstancedMesh`, toon/lambert materials only. Target is a school
  Chromebook at 60 fps.
- **Check what is actually on screen before placing anything.** The camera
  frustum is fitted to the goal *at the goal line*, so an object nearer the
  camera has proportionally less room: `visibleHalfWidthAt(z)` in
  `game/constants.ts` gives the real limit. This has now bitten three times —
  the keeper-mode shooter was clipped off the side, the runner's lane was wider
  than the frame so the runner could sprint out of shot entirely, and the
  mascot followed them out. All three are asserted in tests. **Anything you
  place or move sideways must be checked against it.**
- **Portrait framing.** The vertical field of view is over twice the horizontal
  one on a phone. `Scene.tsx` derives fov from the horizontal angle the goal
  needs; the castle exists to fill the band above the goal with something other
  than empty sky. Widening the side margin buys a lot of empty sky — be careful.
- **`base` in `vite.config.ts` must equal the repo name.** It feeds every asset
  URL on Pages.
- Hooks must stay **above any early return** in components that read async data
  (the `useImage`-style trap): a hook after `if (!x) return null` changes the
  hook count when the data resolves and crashes the whole stage.

## Git workflow

- **`main` = production.** Every push deploys, so `main` stays green.
- Feature branches off `main`, Conventional Commits (`feat:`, `fix:`, `chore:`…).
- **Never push or merge without the user's explicit go-ahead**, unless they have
  clearly granted autonomy for that piece of work.

## History

The first implementation lived as a sub-app inside the `Pic-collage` repo
(`game/`, served from `/Pic-collage/game/`) and was extracted here. That is why
the plan doc discusses a shared-repo layout: the reasoning is kept, the decision
was reversed.
