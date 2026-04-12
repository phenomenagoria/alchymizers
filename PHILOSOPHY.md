# Alchymizers Philosophy

## Mission

A P2P multiplayer browser board game about backcountry moonshine distillers.
Push-your-luck bag-building drawn from *Quacks of Quedlinburg* and reskinned
into the Appalachian bootleg aesthetic. Runs entirely in the browser, deploys
from `main` to GitHub Pages, and needs no server, no account, no install.

## Principles

- **Determinism is sacred.** Every gameplay random draw goes through the
  Mulberry32 PRNG in `engine/rng.js`, seeded per player and per round.
  `Math.random()` is banned in `engine/` and `ui/` for game state — using
  it breaks P2P sync.
- **Engine is pure.** `engine/gameEngine.js`, `engine/rules.js`, and
  `engine/rng.js` must not import from `ui/`, `network/`, or DOM globals.
  The engine state is serializable and reproducible from `(seed, actions)`.
- **No build step.** Vanilla JavaScript, ES modules, `<script type="module">`
  loaded from `index.html`. A build pipeline is a feature request, not a
  default. Treat Treeline's npm tooling as test-only; it must never become
  a production dependency.
- **Pixel aesthetic over modern chrome.** The visual target is an Appalachian
  moonshine distillery rendered as warm, lo-fi pixel art — copper, corn,
  charcoal, forest green on an old-wood plank background. Modern Material /
  Tailwind-style UI is explicitly off-brand.
- **P2P, not client/server.** PeerJS star topology: one host relays. No
  central server, no account system, no persistent storage beyond the
  browser session. Anything that requires a backend is out of scope.
- **Short rounds, fast game.** A full 9-round game should finish in ~45
  minutes. Any mechanic that stretches round time beyond ~5 minutes of
  active play is suspect.

## Non-Negotiables

- **`Math.random()` is banned for gameplay state in `engine/*` and `ui/*`.**
  Any PR that introduces it in gameplay paths must be rejected. Use
  `createRng(seed)` from `engine/rng.js`. Non-gameplay cosmetic animations
  (night-scene twinkle) are the only exception, and only if they do not
  feed back into game state.
- **Never break P2P sync.** Adding gameplay state requires routing it
  through the message protocol in `network/messages.js`, not through
  direct DOM manipulation. Test with two browser tabs before shipping.
- **Version bumps on every deploy.** The `.game-version` element in
  `index.html` must be updated before every GitHub Pages deploy. This is
  the only reliable signal players have that a patch landed.
- **No gameplay dependency on `assets/` loading success.** The game must
  remain playable if an asset 404s. Fall back to icons or text.
- **Deployment branch is `main`.** The `treeline/scaffold` branch does
  not deploy. Onboarding does not turn the daemon on — that is a
  separate decision.
