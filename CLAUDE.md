# Royaume Foot — project guide

A 3D princess football game for **6–7 year olds**, 100 % client-side, installable,
and served from `https://foot.bas.lu` (Dokploy + Traefik on the OVH VPS).

Design rationale and phase plan: [`docs/plan.md`](docs/plan.md).

## Commands

```bash
npm run dev        # http://localhost:5173/
npm run build      # tsc -b && vite build → dist/
npm run lint       # tsc -b --noEmit
npm test           # vitest, unit only
npm run test:e2e   # playwright, plays a real round
node scripts/generate-icons.mjs   # redraw the PWA icons; output is committed
node scripts/quality-bench.mjs    # contrast, tap targets, draw calls (needs a dev server)
```

**Do not edit files while the e2e suite is running.** Vite HMR reloads the page
and the app remounts on the menu mid-test; the failures look exactly like a real
regression (a screenshot of the menu where the pitch should be) and vanish on a
clean re-run.

This sandbox has no system fonts, so Playwright needs the hand-built library
prefix in `~/.cache/chromium-libs/racine` — `LD_LIBRARY_PATH`, `FONTCONFIG_PATH`
and `XDG_DATA_DIRS` pointed into it, plus `PLAYWRIGHT_CHROMIUM_PATH`. Without it
every text assertion fails as "hidden".

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
| `shoot` | score past the keeper | flick towards the goal | `game/aim.ts`, `game/scoring.ts` |
| `keep` | save the keeper's shots | drag her along the goal line | `game/keeperGame.ts` |
| `run` | sweep up stars | drag her across the lane | `game/runGame.ts` |
| `tower` | knock the towers down | flick towards the towers | `game/towerGame.ts` |

**Coupe du Royaume** is not a fifth mode: it is a frame around the four, in
`game/cup.ts` and `gameStore.cupLeg`. Each leg is an ordinary round; the cup only
decides what happens when one ends, and pays a bonus for finishing. `goHome()`
abandons it, which costs the bonus and keeps the stars the legs already banked.

**`shotsTaken` is not a round counter.** The runner never touches it — it ends on
a clock — so it reads 0 for that entire leg. Anything re-arming per round must
watch `roundOver` instead. Getting this wrong is what made the cup die at the end
of leg four: the guard in `PlayScreen` that stops stars being awarded twice was
re-armed on `shotsTaken`, which never changed across the run→tower boundary, so
the last leg could never finish.

The runner ends on a **clock**, not on a count of attempts, which is why
`gameStore.roundOver` is an explicit flag rather than `shotsTaken >= 5`. Its
stars are a pool of meshes that get moved and hidden, never mounted per spawn —
mounting React nodes twice a second would re-render the scene continuously.

Keeper mode is **telegraphed**: a target ring shows where the shot will land a
full second before the kick. That is the whole reason the mode is fair at this
age — reacting to a ball already in flight is a reflex test, and this is not
that. `ballPosAt()` is analytic precisely so the ball lands exactly where the
ring promised.

## The menu is a map

`ui/KingdomMap.tsx` is the mode picker: the four mini-games as four places on an
island, with the castle at the top and a dashed road between them. It replaced a
2×2 grid of buttons that differed only by label and emoji, which gave a child who
cannot read nothing to remember them by. **It is still one tap from the menu** —
the map is the picker, not a screen on the way to one, because the plan caps this
game's menus at two levels and a map you have to open first would be a third.

- **The road is the cup's route.** `PLACES` in `ui/mapPlaces.ts` is ordered by
  `CUP.legs`, so the dashed line explains the Coupe du Royaume without a word.
  `mapPlaces.test.ts` fails if the two orders drift apart.
- **The coordinates are data, and they are tested.** Medallion positions live in
  `mapPlaces.ts` in the map's own 360×320 space, which the SVG and the buttons
  share; the tests assert that no two 72px medallions touch, that no two name
  plates collide, and that everything stays inside the frame. Those collisions
  happen on a 320px phone, not on the screen you draw them on.
- **The badges are shared with the cup banner** (`MODE_BADGES`). A child who has
  seen 🥅🧤⭐🧱 on the cup button has been told which four places it visits, so the
  two rows must never disagree.
- Names sit on **opaque** plates: each one lies over a different terrain — grass,
  sand, snow — so a translucent chip would have a different contrast under each.
- The art is a plain SVG with `preserveAspectRatio="none"`, and the container
  holds the viewBox's ratio, so the drawing and the buttons agree at any width.
  Anything filled up to the coastline eats the inner half of the sand stroke, so
  the outline is drawn a second time over the regions.

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

## The worn item

`data/accessories.ts` is one slot, not one per body part — every extra slot is
another decision between a child and the pitch. The item carries its own
`mount` (`head` or `back`) and `three/Accessory.tsx` draws it; the character
places the anchor, because a princess and a knight are not the same height.

- **An accessory replaces what the character already wears at that mount** —
  the princess's crown, the knight's plume, the knight's cape. One rule for
  both kinds, and nothing is ever added to the `Princess | Knight` union, so a
  princess still cannot be given a plume.
- **It is a third section of the 👑 tab, not a sixth tab.** Six tabs across a
  320 px phone are 41 px each, under rule 4.
- Cards show **the emoji only**, like the balls: an item name is not a proper
  noun, and an untranslated string in six locales is worse than no name.
- Nothing here animates. The body underneath is already moving on the shared
  rig, and a second loop is one more thing to have to gate behind
  `reducedMotion`.
- The same screenshot rule as the keepers applies, and has already earned its
  keep twice: a dark inner sector on the dragon wing read as a *hole*, and the
  tiara's star pointed at the goal — away from the camera for the whole game.

## Keepers

`data/keepers.ts` plus one component per species, dispatched by
`three/Keeper.tsx` — the same shape as the playable roster, and for the same
reason. The keeper used to be one hard-coded dragon, which made him the only
face in goal in `shoot` and the only striker in `keep`.

- Draw one with `<Keeper>`, never `<Dragon>`/`<Unicorn>`/`<Griffin>`/`<Yeti>`.
  Neither mini-game knows which species it got.
- Shared idle motion lives in `three/keeperRig.ts`, shared face parts in
  `three/KeeperParts.tsx`. The face is shared on purpose: those eyes are what
  make the keeper read as a friend rather than an obstacle, and rule 3 leans on
  them. A species drawing its own would eventually draw a meaner one.
- **Silhouettes must differ**, not just palettes: the dragon is a vertical lump
  with wings, the unicorn a horizontal barrel with a tall neck, the griffin has
  the one hard angular shape on the pitch (the beak), the yeti has arms held
  wide. At twenty-five units away that is all a child can actually tell apart.
- Every species is modelled facing **+z**, towards the camera. Keeping mode
  turns the whole group round rather than each species knowing which way it plays.
- **A flat limb must lie in the XY plane**, facing the camera. `keeperRig` beats
  the side limbs about z, so anything turned to face sideways both vanishes from
  the front and flaps the wrong way. The dragon's wing membranes were rotated
  `Math.PI / 2` about y for two releases: they rendered as two thin blades and
  he read as a green cow holding knives.
- **Judge a keeper from a screenshot, never from the source.** Every failure
  here has been a shape that was reasonable in code and wrong on screen — a
  belly panel a hair smaller than the body sphere sits *inside* it and is simply
  not there. Look at the wardrobe turntable **and** the view from the penalty
  spot; a model tuned only close up collapses into a smudge in goal.

## What a playtest changed

A child has played this and loves it — the tuning holds. What it exposed was
the *wardrobe*, not the game:

- a long scrolling column gave no sign there was more below the fold, so items
  down there may as well not have existed. Anything scrollable uses
  `ScrollArea`, which fades its bottom edge and floats a nudge arrow while
  there is more to see.
- princesses and knights in one grid read as one undifferentiated pile; they
  are separate sections now, behind tabs with the balls, pitches, mascots and
  keepers.

Starting over sits at the foot of the **last** tab, deliberately away from a
child's casual path through the wardrobe. Moving the last tab moves it.

Ball textures are drawn at 512, not 256 — the ball fills a good part of a phone
screen at the penalty spot — and motifs stay in the middle band of the image,
because a sphere squeezes anything near the top or bottom edge into a smear.

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
- **Write scene transforms from state, never accumulate them onto the mesh.**
  `mesh.rotation.z += …` in a frame loop outlives whatever reset the state: the
  tower blocks kept the tilt they fell with, so a rebuilt tower was stacked out
  of crooked boxes. The block's tumble is a number in `TowerState` now, and the
  scene assigns it.
- **`App.tsx` routes screens with an exhaustive `switch`.** It was a list of
  `&&`s and it silently lost one — `trophy` was never added, so winning the cup
  unmounted everything and left a child on a blank page. The `never` in the
  default case makes that a compile error.
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
  Chromebook at 60 fps. The plan's number is **under 40 draw calls** and the
  game is **over it** — 149 in `shoot` and 134 in `keep`. It was 140 / 125
  after instancing the castle's decor (down from 157); the dragon rebuild put
  nine back, knowingly. The characters and keepers are the cost: dozens of
  primitives each, inside groups that animate, so they cannot be merged without
  redoing the rigs. Measure with `scripts/quality-bench.mjs` before touching it,
  and do not "optimise" this on a machine with no GPU — the benefit is
  unmeasurable there and the risk is a visible regression.
- **Repeated identical decor gets instanced**, not mapped into N meshes. The
  `Repeated` helper in `Pitch.tsx` is there for it.
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
- **`base` in `vite.config.ts` is `/`**, and the PWA manifest's `start_url` and
  `scope` read it. The game has a domain to itself now; it was `/royaume-foot/`
  while GitHub Pages served it from a path named after the repository. If it ever
  moves back under a path, all three move together or the installed app scopes
  itself to the wrong place.
- **`sw.js` must never be cached.** `nginx.conf` says so explicitly. A held
  service worker pins a child on the version they first installed and no amount
  of redeploying reaches them.
- Hooks must stay **above any early return** in components that read async data
  (the `useImage`-style trap): a hook after `if (!x) return null` changes the
  hook count when the data resolves and crashes the whole stage.
- **`prefers-reduced-motion` reaches the 3D scene too**, through
  `three/reducedMotion.ts`. `src/index.css` covers the DOM; anything new that
  loops forever in `useFrame` has to check the hook as well. **Gameplay motion
  stays** — a ball that does not fly is not a gentler game, it is a broken one.
  What stops is what is there for charm: idle breathing, wing beats, the
  mascot's hop, the crowd, the wardrobe turntable.
- **Contrast is measured off rendered pixels, never calculated from CSS.** This
  UI is gradients, translucent plates and a 3D scene showing through the HUD, so
  a colour-pair calculation is fiction. A label whose plate is translucent has a
  different contrast at the top of a screen than at the bottom — that is exactly
  how the locked-item price ended up at 1.05:1. **Labels that must be readable
  get an opaque plate.**

## Deployment

Dokploy on `dok.seil.pro` builds the image from this repository and Traefik
routes `foot.bas.lu` to it. `compose.deploy.yaml` is the stack; the Dockerfile
runs the typecheck and the unit tests, so a red rule set cannot become a running
container. The e2e suite runs in CI instead, because it needs a browser the
production image deliberately does not carry.

Deployment state is readable without the dashboard, from Dokploy's
`deployment.allByCompose` endpoint on `dok.seil.pro` (composeId
`1Bz4NZxjO8ytd7FLgLUBE`, API key in `~/.config/dokploy/seil.token`). Its
`compose.one` endpoint returns the stack's env vars — never print it whole.

**A push to `main` deploys.** `autoDeploy` is on, so Dokploy's GitHub webhook
opens a build within seconds of the push; the Deploy button is only needed when
the webhook stays quiet. This line used to claim the opposite — pushing the
kingdom-map merge (437c9c5) started a deployment on its own.

## Git workflow

- **`main` = production**, and stays green.
- Feature branches off `main`, Conventional Commits (`feat:`, `fix:`, `chore:`…).
- **Never push or merge without the user's explicit go-ahead**, unless they have
  clearly granted autonomy for that piece of work.

## History

The first implementation lived as a sub-app inside the `Pic-collage` repo
(`game/`, served from `/Pic-collage/game/`) and was extracted here. That is why
the plan doc discusses a shared-repo layout: the reasoning is kept, the decision
was reversed.
