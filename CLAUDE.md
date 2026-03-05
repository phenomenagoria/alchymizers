# Alchymizers — Project Notes for Claude

## Deployment Checklist
- **Always update the version number** in `index.html` (the `.game-version` element, currently `v0.4.0`) before each GitHub Pages deploy
- Deploy target: `phenomenagoria/alchymizers` on GitHub Pages from `main` branch

## Architecture
- Vanilla JS with ES modules (no build step)
- PeerJS for P2P WebRTC multiplayer (star topology, host relays)
- Deterministic seeded PRNG (Mulberry32) for multiplayer sync
- Screens-based navigation: title, lobby, game, market, endgame, howto, blowout, distill

## Key Files
- `app.js` — Central controller, screen management, event wiring
- `engine/gameEngine.js` — Game state, round logic, scoring, blowout, mulligan
- `engine/rules.js` — TRACK array, HOLLER_CARDS, INGREDIENTS, constants
- `engine/rng.js` — Deterministic RNG (Mulberry32), deriveSeed, shuffle
- `ui/board.js` — Proof gauge, pressure, holler cards, track markers
- `ui/distill.js` — Distill overlay animations and rendering
- `network/peer.js` — PeerJS connection management
- `network/messages.js` — Message/action type constants

## Game Mechanics
- Copper earned only by **bottling ON** a prime-numbered spot (not passing through)
- Copper values: 1 for primes < 17, 2 for primes >= 17
- Copper spend options (2 copper each): Upgrade Still (+1 flame start) or Rabbit's Foot (Mulligan)
- Mulligan: undo last draw, return chip to bag, reshuffle bag, redraw next brew
- DISTILL phase is async in multiplayer — draws are local, sync results via DISTILL_COMPLETE
- Blowout choice: keep dollars (proceed to market) OR keep reputation (skip market)
