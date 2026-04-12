# Alchymizers — Project Notes for Claude

## Deployment Checklist
- **Always update the version number** in `index.html` (the `.game-version`
  element) before each GitHub Pages deploy.
- Deploy target: `phenomenagoria/alchymizers` on GitHub Pages from `main`.

## Commands
- `npx http-server .` — serve the game locally (no build step).
- `npm install` — install test tooling (post-onboarding).
- `npm test` — run vitest property + unit tests.
- `npm run test:mutation` — stryker incremental mutation testing.
- `npm run verify` — lint + test + mutation (CI gate).

## Architecture
- Vanilla JS with ES modules (no build step, no bundler).
- PeerJS for P2P WebRTC multiplayer (star topology, host relays).
- Deterministic seeded PRNG (Mulberry32) for multiplayer sync.
- Screens-based navigation: title, lobby, game, market, endgame, howto,
  blowout, distill.

## Key Files
- `app.js` — central controller, screen management, event wiring.
- `engine/gameEngine.js` — game state, round logic, scoring, blowout, mulligan.
- `engine/rules.js` — TRACK, HOLLER_CARDS, INGREDIENTS, constants.
- `engine/rng.js` — deterministic RNG (Mulberry32), deriveSeed, shuffle.
- `ui/board.js` — proof gauge, pressure, holler cards, track markers.
- `ui/distill.js` — distill overlay animations and rendering.
- `network/peer.js` — PeerJS connection management.
- `network/messages.js` — message/action type constants.

## Code Standards
- `engine/` must be pure: no DOM, no network, no `Math.random()`.
- Every random draw goes through `createRng(seed)` — breaks P2P sync otherwise.
- Named exports only. ES module syntax throughout.
- Keep `engine/*` serializable — game state must round-trip through JSON.

## Game Mechanics
- Copper earned only by **bottling ON** a prime-numbered spot (not passing
  through). Copper values: 1 for primes < 17, 2 for primes >= 17.
- Copper spend (2 copper each): Upgrade Still (+1 flame start) or Rabbit's
  Foot (mulligan).
- Mulligan: undo last draw, return chip to bag, reshuffle bag, redraw next
  brew.
- DISTILL phase is async in multiplayer — draws are local, sync results via
  `DISTILL_COMPLETE`.
- Blowout choice: keep dollars (proceed to market) OR keep reputation (skip
  market).

## Agent Instructions
- Read `PHILOSOPHY.md`, `DESIGN.md`, and `IMPLEMENTATION.md` before
  starting work on any issue.
- Treeline pipeline: planner → builder → reviewer → integrator. Plans land
  in `.treeline/plans/`; agent memory lives in `.treeline/memory/`.
- Never commit to `main`. Work on a feature branch tied to an issue; open
  a PR for merge review.
- Never introduce `Math.random()` into gameplay code — it breaks P2P sync.
- Never remove the version bump rule. The `.game-version` element is the
  only patch signal players see.
