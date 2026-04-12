# Alchymizers Implementation

## Status

Active. Playable end-to-end from the `treeline/scaffold` branch (and from
`main`). Current deployed version is pinned via the `.game-version` element
in `index.html`.

## Modules

### `engine/` — pure game logic (no DOM, no network)

- `engine/rng.js` (47 lines) — Mulberry32 PRNG. `createRng(seed)` returns
  `{ next, nextInt, shuffle, drawFrom }`. `deriveSeed(base, ...vals)` hashes
  a base seed with extra inputs for per-player streams.
- `engine/rules.js` (322 lines) — `TRACK` (34-space proof coil),
  `INGREDIENTS` (white/orange/green/red/blue/yellow/purple chip definitions),
  `HOLLER_CARDS` (18 event cards), constants (`TOTAL_ROUNDS = 9`,
  `BLOWOUT_THRESHOLD = 7`, `MAX_BUYS_PER_ROUND = 2`, `COPPER_PER_FLAME = 2`),
  `getIngredientCost()`, `getShopItems()`, `createStartingBag()`.
- `engine/gameEngine.js` (754 lines) — `PHASES` enum, `createGame`, round
  flow (`ROUND_START → DISTILL → SCORING → MARKET → CLEANUP → ENDGAME`),
  chip-draw resolution, blowout handling, mulligan, copper spend.

### `ui/` — DOM rendering (imports `engine/` and `network/messages.js` only)

- `ui/board.js` (206 lines) — proof gauge, pressure meter, holler card,
  track markers.
- `ui/brewmaster.js` (276 lines) — brewmaster character and distill overlay.
- `ui/distill.js` (125 lines) — distill phase animations.
- `ui/pixelScene.js` (242 lines) — pixel-art background scene.
- `ui/nightScene.js` (102 lines) — animated night-sky scene for title / lobby.
- `ui/leaderboard.js` (33 lines) — score display.
- `ui/chat.js` (38 lines) — in-game chat overlay.

### `network/` — PeerJS P2P

- `network/peer.js` (300 lines) — PeerJS connection management, star-topology
  host relay, message routing.
- `network/messages.js` (41 lines) — message and action type constants.

### Root

- `app.js` (916 lines) — central controller, screen lifecycle
  (title/lobby/game/market/endgame/howto/blowout/distill), event wiring,
  host/client glue.
- `index.html` — single-page shell, asset preload, `.game-version` element.
- `styles.css` — global styles, Appalachian pixel palette.
- `architecture_proposal.md`, `general_design.md`, `hosting.md`, `theme.md`
  — pre-existing design docs (kept; not authoritative — see PHILOSOPHY.md
  and DESIGN.md).

## Commands

```bash
# Serve locally (any static server; no build step):
npx http-server .        # or python3 -m http.server

# After Treeline onboarding lands:
npm install              # installs vitest, stryker, fast-check
npm test                 # runs vitest property + unit tests
npm run lint             # tsc --noEmit (no-op until TS is introduced)
npm run test:mutation    # stryker incremental mutation testing
npm run verify           # lint + test + mutation
```

## Test Count

Before Treeline onboarding: 0 (no test tooling existed).
After onboarding: 3 starter property tests in `tests/engine/` covering
Mulberry32 determinism, track-position bounds, and ingredient cost
invariants. Run with `npm test`.

## Known Broken

- **Stryker typescript-checker is incompatible with vanilla JS.** The
  default `stryker.conf.mjs` shipped by the overlay references
  `checkers: ['typescript']` and `tsconfigFile: 'tsconfig.json'`. This
  project has neither TypeScript nor a tsconfig. The onboarding PR strips
  the `checkers` entry and widens `mutate` to include `engine/**/*.js` and
  `ui/**/*.js` — no TS expected.
- **No existing lint pipeline.** `npm run lint` is wired to `tsc --noEmit`
  which is a no-op here. Leaving it in place so the Treeline CI contract
  is satisfied; a follow-up issue will swap it for ESLint once a vanilla-JS
  config is written.
- **CI `mutation.yml` workflow assumes TypeScript sources.** Until the
  stryker config is JS-friendly, the mutation CI job may fail on `main`.
  Documented here rather than fixed on the scaffold branch so the first
  onboarding PR stays focused on overlay + documentation, not on rewriting
  CI against a non-TS codebase.

Each "Known Broken" item has a follow-up issue filed on the repo (see the
issues loaded by `scripts/load-issues-alchymizers.sh`).
