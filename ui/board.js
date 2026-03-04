import { TRACK, TRACK_MAX, INGREDIENTS, COLOR_HEX, BLOWOUT_THRESHOLD } from '../engine/rules.js';

// Render the copper coil track
export function renderTrack(container, playerPosition, flameStart, threshold) {
  container.innerHTML = '';
  const effectiveThreshold = threshold || BLOWOUT_THRESHOLD;

  // Render track in rows of 7 (snaking path like a copper coil)
  const rowSize = 7;
  const rows = [];
  for (let i = 0; i < TRACK.length; i += rowSize) {
    rows.push(TRACK.slice(i, i + rowSize));
  }

  // Reverse even rows for snake pattern
  rows.forEach((row, rowIdx) => {
    if (rowIdx % 2 === 1) row.reverse();
  });

  // Render each row
  rows.forEach((row) => {
    const rowDiv = document.createElement('div');
    rowDiv.style.display = 'flex';
    rowDiv.style.gap = '3px';
    rowDiv.style.justifyContent = 'center';

    row.forEach(space => {
      const spaceDiv = document.createElement('div');
      spaceDiv.className = 'track-space';

      if (space.pos === playerPosition) {
        spaceDiv.classList.add('current');
      } else if (space.pos < playerPosition && space.pos >= flameStart) {
        spaceDiv.classList.add('passed');
      }

      if (space.pos === flameStart) {
        spaceDiv.classList.add('flame-start');
      }

      // Position number
      const posSpan = document.createElement('span');
      posSpan.className = 'space-pos';
      posSpan.textContent = space.pos;
      spaceDiv.appendChild(posSpan);

      // Coins
      if (space.coins > 0) {
        const coinSpan = document.createElement('span');
        coinSpan.className = 'space-coins';
        coinSpan.textContent = `$${space.coins}`;
        spaceDiv.appendChild(coinSpan);
      }

      // VP
      if (space.vp > 0) {
        const vpSpan = document.createElement('span');
        vpSpan.className = 'space-vp';
        vpSpan.textContent = `★${space.vp}`;
        spaceDiv.appendChild(vpSpan);
      }

      // Special icon
      if (space.special) {
        const specialSpan = document.createElement('span');
        specialSpan.className = 'space-special';
        if (space.special === 'copper') specialSpan.textContent = '🔶';
        else if (space.special === 'flame') specialSpan.textContent = '🔥';
        spaceDiv.appendChild(specialSpan);
      }

      rowDiv.appendChild(spaceDiv);
    });

    container.appendChild(rowDiv);
  });
}

// Render placed chips in the still
export function renderPlacedChips(container, chips) {
  container.innerHTML = '';
  if (chips.length === 0) {
    container.innerHTML = '<span style="color: var(--text-dim); font-size: 0.8rem;">No chips placed yet...</span>';
    return;
  }

  chips.forEach((chip, idx) => {
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
}

// Update the blowout meter
export function updateBlowoutMeter(fillEl, valueEl, whiteTotal, threshold) {
  const effectiveThreshold = threshold || BLOWOUT_THRESHOLD;
  const pct = Math.min(100, (whiteTotal / effectiveThreshold) * 100);

  fillEl.style.width = `${pct}%`;
  fillEl.className = 'blowout-fill';

  if (whiteTotal > effectiveThreshold) {
    fillEl.classList.add('blown');
    fillEl.style.width = '100%';
  } else if (pct >= 75) {
    fillEl.classList.add('danger');
  } else if (pct >= 50) {
    fillEl.classList.add('warning');
  }

  valueEl.textContent = `${whiteTotal} / ${effectiveThreshold}`;
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
}

// Update round/phase display
export function updateRoundPhase(round, phase) {
  document.getElementById('round-display').textContent = `Round ${round} / 9`;
  document.getElementById('phase-display').textContent = phase;
}
