import { TRACK, TRACK_MAX, INGREDIENTS, BLOWOUT_THRESHOLD, ingredientIconHtml } from '../engine/rules.js';

// Render the pressure gauge (blowout meter) as visual segments
export function renderPressure(segmentsEl, numberEl, statusEl, whiteTotal, threshold) {
  const t = threshold || BLOWOUT_THRESHOLD;
  const blown = whiteTotal > t;

  // Render segments
  segmentsEl.innerHTML = '';
  for (let i = 1; i <= t; i++) {
    const seg = document.createElement('div');
    seg.className = 'pressure-seg';

    if (blown) {
      seg.classList.add('blown');
    } else if (i <= whiteTotal) {
      if (whiteTotal <= Math.floor(t * 0.4)) seg.classList.add('filled-low');
      else if (whiteTotal <= Math.floor(t * 0.7)) seg.classList.add('filled-mid');
      else if (whiteTotal < t) seg.classList.add('filled-high');
      else seg.classList.add('filled-danger');
    } else {
      seg.classList.add('empty');
    }

    segmentsEl.appendChild(seg);
  }

  // Number display
  numberEl.textContent = `${whiteTotal} / ${t}`;
  numberEl.className = 'pressure-number';
  if (blown) numberEl.classList.add('blown');
  else if (whiteTotal >= t) numberEl.classList.add('danger');
  else if (whiteTotal >= Math.floor(t * 0.7)) numberEl.classList.add('critical');
  else if (whiteTotal >= Math.floor(t * 0.4)) numberEl.classList.add('warning');
  else numberEl.classList.add('safe');

  // Status text
  if (blown) {
    statusEl.textContent = '💥 BLOWN OUT!';
    statusEl.className = 'pressure-status blown';
  } else if (whiteTotal >= t) {
    statusEl.textContent = '🔴 Critical!';
    statusEl.className = 'pressure-status danger';
  } else if (whiteTotal >= Math.floor(t * 0.7)) {
    statusEl.textContent = '🟠 Dangerous';
    statusEl.className = 'pressure-status critical';
  } else if (whiteTotal >= Math.floor(t * 0.4)) {
    statusEl.textContent = '🟡 Rising';
    statusEl.className = 'pressure-status warning';
  } else {
    statusEl.textContent = '🟢 Stable';
    statusEl.className = 'pressure-status safe';
  }
}

// Render proof gauge (track position as a progress bar)
export function renderProofGauge(player) {
  const pos = player.position;
  const flame = player.flameStart;
  const pct = (pos / TRACK_MAX) * 100;
  const flamePct = (flame / TRACK_MAX) * 100;

  const fillEl = document.getElementById('proof-fill');
  const markerEl = document.getElementById('proof-marker');
  const flameEl = document.getElementById('proof-flame');
  const posEl = document.getElementById('proof-position');
  const rewardsEl = document.getElementById('proof-rewards');

  fillEl.style.width = `${pct}%`;
  markerEl.style.left = `calc(${pct}% - 7px)`;
  flameEl.style.left = `${flamePct}%`;
  posEl.textContent = `Position ${pos} / ${TRACK_MAX}`;

  // Render copper/flame markers on the proof bar
  renderTrackMarkers(document.getElementById('proof-bar-markers'), flame);

  // Count copper: only landing spot matters now, but show what's ahead
  const copperAhead = countCopperInRange(pos + 1, TRACK_MAX);
  const landedSpace = TRACK[pos] || TRACK[0];
  const copperOnSpot = landedSpace.special === 'copper' ? (landedSpace.copperValue || 1) : 0;

  // Show rewards at current position
  const space = TRACK[pos] || TRACK[0];
  let specialText = '';
  if (space.special === 'copper') specialText = ' 🔶+1';
  else if (space.special === 'flame') specialText = ' 🔥+1';

  rewardsEl.innerHTML = `
    <span class="reward-dollars">💵 $${space.coins}</span>
    <span class="reward-rep">🍶 ${space.vp}</span>
    ${specialText ? `<span style="color: var(--copper-light)">${specialText}</span>` : ''}
    <span class="reward-copper-count">${copperOnSpot > 0 ? `🔶 +${copperOnSpot} copper!` : ''}${copperAhead > 0 ? ` ${copperOnSpot > 0 ? '·' : '🔶'} ${copperAhead} ahead` : ''}</span>
  `;
}

// Render small markers on a proof bar for copper/flame positions
export function renderTrackMarkers(container, flameStart) {
  if (!container) return;
  container.innerHTML = '';
  for (const space of TRACK) {
    if (!space.special) continue;
    const leftPct = (space.pos / TRACK_MAX) * 100;
    const dot = document.createElement('div');
    dot.className = 'proof-track-marker';
    if (space.special === 'copper') {
      dot.classList.add('marker-copper');
      if (space.copperValue >= 2) dot.classList.add('marker-big');
      dot.title = `Pos ${space.pos}: 🔶 +${space.copperValue || 1} copper (bottle here)`;
    } else if (space.special === 'flame') {
      dot.classList.add('marker-flame');
      dot.title = `Pos ${space.pos}: 🔥 flame`;
    }
    // Dim markers behind flame start
    if (space.pos < flameStart) dot.classList.add('marker-behind');
    dot.style.left = `${leftPct}%`;
    container.appendChild(dot);
  }
}

// Count copper spots in a range [from, to] inclusive
export function countCopperInRange(from, to) {
  let count = 0;
  for (let i = Math.max(0, from); i <= Math.min(TRACK_MAX, to); i++) {
    if (TRACK[i] && TRACK[i].special === 'copper') count++;
  }
  return count;
}

// Render placed chips in the still
export function renderPlacedChips(container, chips) {
  container.innerHTML = '';
  if (chips.length === 0) {
    container.innerHTML = '<span class="still-empty">Draw ingredients from your stash...</span>';
    return;
  }

  chips.forEach((chip) => {
    const chipDiv = document.createElement('div');
    chipDiv.className = `chip ${chip.color}`;

    const icon = document.createElement('span');
    icon.className = 'chip-icon';
    icon.innerHTML = ingredientIconHtml(chip.color);
    chipDiv.appendChild(icon);

    const value = document.createElement('span');
    value.className = 'chip-value';
    value.textContent = chip.value;
    chipDiv.appendChild(value);

    const name = document.createElement('span');
    name.className = 'chip-name';
    name.textContent = INGREDIENTS[chip.color]?.name || '';
    chipDiv.appendChild(name);

    container.appendChild(chipDiv);
  });

  // Auto-scroll to show latest chip
  container.scrollLeft = container.scrollWidth;
}

// Update player stats display
export function updatePlayerStats(player) {
  document.getElementById('stat-dollars').textContent = `$${player.dollars}`;
  document.getElementById('stat-rep').textContent = player.reputation;
  document.getElementById('stat-copper').textContent = player.copper;
  document.getElementById('stat-bag').textContent = player.bag.length;
}

// Show holler card
export function showHollerCard(cardEl, card) {
  if (!card) {
    cardEl.classList.add('hidden');
    return;
  }
  cardEl.classList.remove('hidden');
  cardEl.querySelector('.holler-name').textContent = `📜 ${card.name}`;
  cardEl.querySelector('.holler-desc').textContent = card.desc;

  // Expandable mechanical description
  let mechEl = cardEl.querySelector('.holler-mechanical');
  if (!mechEl) {
    mechEl = document.createElement('details');
    mechEl.className = 'holler-mechanical';
    const summary = document.createElement('summary');
    summary.textContent = 'What it does';
    mechEl.appendChild(summary);
    const desc = document.createElement('div');
    desc.className = 'holler-mechanical-text';
    mechEl.appendChild(desc);
    cardEl.appendChild(mechEl);
  }
  if (card.mechanicalDesc) {
    mechEl.style.display = '';
    mechEl.querySelector('.holler-mechanical-text').textContent = card.mechanicalDesc;
  } else {
    mechEl.style.display = 'none';
  }
}

// Update round/phase display
export function updateRoundPhase(round, phase) {
  document.getElementById('round-display').textContent = `Round ${round} / 9`;
  document.getElementById('phase-display').textContent = phase;
}
