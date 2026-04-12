# Alchymizers Design System

Appalachian backcountry moonshine distillery, rendered as warm lo-fi pixel
art on an old-wood plank background. The visual target sits closer to
early-90s GBA / SNES RPG UI than anything modern. See
[awesome-design-systems](https://github.com/alexpate/awesome-design-systems)
for reference systems in adjacent aesthetics (Nintendo, Pico-8, itch.io
indie tooling).

This file defines the visual contract. `PHILOSOPHY.md` owns the gameplay
commitments; `DESIGN.md` owns what the game looks and feels like.

## Palette

The six colors below are load-bearing. Introducing a new hue requires a PR
update to this file *and* a named-variable entry in `styles.css`.

| Role              | Hex       | Name            | Usage                                    |
|-------------------|-----------|-----------------|------------------------------------------|
| Primary metal     | `#b87333` | Copper          | Still body, coil track, accents          |
| Grain accent      | `#f4c542` | Corn yellow     | Dollars, positive rewards                |
| Danger            | `#8b2a2a` | Charcoal red    | Bad mash, blowout warning, error states  |
| Nature            | `#2c6b2f` | Forest green    | Juniper, reputation, safe spaces         |
| Background night  | `#2d3a63` | Midnight blue   | Night scene, sky behind title            |
| Neutral mash      | `#e8e5dc` | Mash white      | Parchment cards, text panels             |

Extended supports (must derive from the above; no new primaries):

- `#6b3a1a` copper-dark (3-step darken of copper) — shadow, outline.
- `#2a1a10` ink — primary text on parchment.
- `#d8cfa8` aged parchment — secondary panel background.

## Typography

Pixel-game feel first, legibility second, Material Design never.

- **Display** — `Rye` or `Special Elite` for titles, card names, holler
  events. Weight: regular. Size: 32px title / 20px card.
- **Body** — `Bitter` or a system serif fallback. Size: 16px paragraph /
  14px tooltip. Line height 1.4.
- **Monospace (debug overlays)** — system mono, size 12px. Never in the
  game UI itself.

Web-fonts load via `<link>` in `index.html`; the game must degrade
gracefully to system serif if the CDN fails (see PHILOSOPHY.md — no
gameplay dependency on external asset loads).

## Spacing and Layout

- Base unit: 4px. All margins / paddings must be multiples of 4.
- Card corner radius: 0. Pixel-art aesthetic means no anti-aliased curves.
- Component padding: 8px small, 16px medium, 24px large.
- Touch target minimum: 44px — this game plays on phones.
- Screen widths to support: 360px phone portrait, 768px tablet, 1280px
  desktop. No design targets beyond 1920px — this is not a AAA launcher.

## Iconography

- All icons are pixel-art PNGs or Unicode glyphs with a retro fallback.
- Source icons live in `assets/ingredients/`, `assets/icons/`. New icons
  must match the existing 32x32 grid at 1x, 64x64 at 2x.
- Icon style: flat silhouette, 2-tone shading, outlined in `copper-dark`.
- Emoji fallbacks are acceptable for chips that lack pixel art; see
  `engine/rules.js` `INGREDIENTS[color].icon`.

## Component Primitives

- **Button** — copper border, parchment fill, ink text, 0 radius. Hover
  lightens fill; active inverts to copper-fill ink-text.
- **Card** (holler event, market stall) — parchment background, ink text,
  corner stamp motif, copper border 2px.
- **Chip** — ingredient token, circular 40px, color per ingredient, value
  number centered, icon above number.
- **Gauge** (proof, pressure) — horizontal track in copper, fill in
  ingredient color, ticks every 4 units, blowout threshold marker in
  charcoal red.
- **Modal** — parchment panel, 16px padding, copper border 4px, full-
  screen dimming overlay `rgba(45, 58, 99, 0.8)` (midnight blue).

## Dos and Donts

**Do**
- Use copper, corn, and parchment together liberally — it's the signature.
- Preserve pixel grid alignment on all art assets (no fractional scaling).
- Test at 360px phone width first; desktop layouts are derived from mobile.
- Show the current `.game-version` in a corner at all times — players
  need to know what patch they're on.

**Dont**
- No gradients except the parchment background. Flat colors everywhere else.
- No drop shadows beyond the 2-tone pixel outline convention.
- No modern Material icons, Tailwind chrome, or rounded-corner chips.
- No font weight variations beyond regular — bold must be a pixel font
  variant, not a CSS tweak.
- No game-state changes triggered from pure animation frames; animations
  are cosmetic only.
- No color outside the palette above. Extend this file first, then code.
