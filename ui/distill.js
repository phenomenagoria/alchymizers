// Distill phase UI module — the emotional core of the game
import { INGREDIENTS, BLOWOUT_THRESHOLD, TRACK, TRACK_MAX } from '../engine/rules.js';

// Animate a chip draw with suspense
export function animateChipDraw(chipRevealEl, chip, onComplete) {
  chipRevealEl.innerHTML = '';

  // Suspense placeholder
  const mystery = document.createElement('div');
  mystery.className = 'chip-mystery';
  mystery.textContent = '?';
  chipRevealEl.appendChild(mystery);

  // After suspense delay, reveal the chip
  setTimeout(() => {
    mystery.remove();

    const chipDiv = document.createElement('div');
    chipDiv.className = `chip ${chip.color} chip-reveal-anim`;

    const icon = document.createElement('span');
    icon.className = 'chip-icon';
    icon.textContent = INGREDIENTS[chip.color]?.icon || '?';
    chipDiv.appendChild(icon);

    const value = document.createElement('span');
    value.className = 'chip-value';
    value.textContent = chip.value;
    chipDiv.appendChild(value);

    const name = document.createElement('span');
    name.className = 'chip-name';
    name.textContent = INGREDIENTS[chip.color]?.name || '';
    chipDiv.appendChild(name);

    chipRevealEl.appendChild(chipDiv);

    if (onComplete) setTimeout(onComplete, 300);
  }, 350);
}

// Update the still pot liquid level visualization
export function updateStillLiquid(liquidEl, chipCount, maxVisible) {
  const pct = Math.min(100, (chipCount / (maxVisible || 10)) * 100);
  liquidEl.style.height = `${pct}%`;

  // Color shifts as pot fills
  if (pct > 80) {
    liquidEl.style.background = 'linear-gradient(to top, #8b4513, #d4944a, #f4a442)';
  } else if (pct > 50) {
    liquidEl.style.background = 'linear-gradient(to top, #8b4513, #d4944a)';
  } else {
    liquidEl.style.background = 'linear-gradient(to top, #5a3d28, #8b4513)';
  }
}

// Render the mini proof display for the distill overlay
export function renderDistillProof(proofEl, position, flameStart) {
  const space = TRACK[position] || TRACK[0];
  const pct = (position / TRACK_MAX) * 100;

  // Count copper spots ahead
  let copperAhead = 0;
  for (let i = position + 1; i <= TRACK_MAX; i++) {
    if (TRACK[i] && TRACK[i].special === 'copper') copperAhead++;
  }
  const copperOnSpot = space.special === 'copper' ? (space.copperValue || 1) : 0;

  // Build copper marker dots — larger for 2-copper spots
  let markerDots = '';
  for (const s of TRACK) {
    if (!s.special) continue;
    const leftPct = (s.pos / TRACK_MAX) * 100;
    const isBehind = s.pos < (flameStart || 0);
    const cls = s.special === 'copper' ? 'marker-copper' : 'marker-flame';
    const big = (s.copperValue && s.copperValue >= 2) ? ' marker-big' : '';
    const behind = isBehind ? ' marker-behind' : '';
    markerDots += `<div class="proof-track-marker ${cls}${big}${behind}" style="left:${leftPct}%" title="Pos ${s.pos}: +${s.copperValue || 1}🔶"></div>`;
  }

  let specialText = '';
  if (space.special === 'copper') specialText = ' 🔶+1';
  else if (space.special === 'flame') specialText = ' 🔥+1';

  proofEl.innerHTML = `
    <div class="distill-proof-bar">
      <div class="proof-bar-markers">${markerDots}</div>
      <div class="distill-proof-fill" style="width: ${pct}%"></div>
    </div>
    <div class="distill-proof-text">
      Position ${position} — 💵 $${space.coins} ⭐ ${space.vp}${specialText}
    </div>
    <div class="distill-proof-copper">
      ${copperOnSpot > 0 ? `🔶 +${copperOnSpot} copper if you bottle here!` : ''}${copperAhead > 0 ? ` ${copperOnSpot > 0 ? '·' : '🔶'} ${copperAhead} copper spot${copperAhead > 1 ? 's' : ''} ahead` : ''}
    </div>
  `;
}

// Render placed chips in the distill still
export function renderDistillChips(container, chips) {
  container.innerHTML = '';
  if (chips.length === 0) {
    container.innerHTML = '<span class="still-empty">Brew to draw ingredients...</span>';
    return;
  }

  chips.forEach((chip) => {
    const chipDiv = document.createElement('div');
    chipDiv.className = `chip ${chip.color}`;

    const icon = document.createElement('span');
    icon.className = 'chip-icon';
    icon.textContent = INGREDIENTS[chip.color]?.icon || '?';
    chipDiv.appendChild(icon);

    const value = document.createElement('span');
    value.className = 'chip-value';
    value.textContent = chip.value;
    chipDiv.appendChild(value);

    container.appendChild(chipDiv);
  });

  container.scrollLeft = container.scrollWidth;
}
