import {
  createGame, startGame as engineStartGame, drawChip, stopDrawing,
  buyIngredient, unbuyIngredient, finishBuying, spendCopper, buyMulligan, useMulligan,
  blowoutChoice, scoreRound, getLeaderboard, getWinner, getPlayerState, PHASES,
} from './engine/gameEngine.js';
import {
  TRACK, TRACK_MAX, BLOWOUT_THRESHOLD, INGREDIENTS, TOTAL_ROUNDS,
  getShopItems, MAX_BUYS_PER_ROUND, ingredientIconHtml,
} from './engine/rules.js';
import { renderPressure, renderProofGauge, renderPlacedChips, updatePlayerStats, showHollerCard, updateRoundPhase } from './ui/board.js';
import { renderLeaderboard } from './ui/leaderboard.js';
import { addChatMessage, addSystemMessage, updateGameLog } from './ui/chat.js';
import { createNetworkManager } from './network/peer.js';
import { ACTIONS } from './network/messages.js';
import { drawPixelScene } from './ui/pixelScene.js';
import { drawNightScene } from './ui/nightScene.js';
import { animateChipDraw, updateStillLiquid, renderDistillProof, renderDistillChips } from './ui/distill.js';
import { updateBrewmaster } from './ui/brewmaster.js';

// ===== App State =====
let game = null;
let myPlayerId = null;
let myName = '';
let networkMode = 'solo'; // 'solo', 'host', 'client'
let network = null;
let lobbyPlayers = []; // { id, name }

// ===== DOM Elements =====
const screens = {
  title: document.getElementById('screen-title'),
  lobby: document.getElementById('screen-lobby'),
  game: document.getElementById('screen-game'),
  market: document.getElementById('screen-market'),
  endgame: document.getElementById('screen-endgame'),
  howto: document.getElementById('screen-howto'),
  blowout: document.getElementById('screen-blowout'),
  distill: document.getElementById('screen-distill'),
};

const els = {
  playerName: document.getElementById('player-name'),
  joinPanel: document.getElementById('join-panel'),
  joinHostId: document.getElementById('join-host-id'),
  titleStatus: document.getElementById('title-status'),
  lobbyStatus: document.getElementById('lobby-status'),
  roomCode: document.getElementById('room-code'),
  hostPeerId: document.getElementById('host-peer-id'),
  lobbyPlayers: document.getElementById('lobby-players'),
  btnStartGame: document.getElementById('btn-start-game'),
  placedChips: document.getElementById('placed-chips'),
  pressureSegments: document.getElementById('pressure-segments'),
  pressureNumber: document.getElementById('pressure-number'),
  pressureStatus: document.getElementById('pressure-status'),
  hollerCard: document.getElementById('holler-card'),
  actionButtons: document.getElementById('action-buttons'),
  blowoutDollarsValue: document.getElementById('blowout-dollars-value'),
  blowoutRepValue: document.getElementById('blowout-rep-value'),
  copperOptions: document.getElementById('copper-options'),
  marketCopperCount: document.getElementById('market-copper-count'),
  leaderboard: document.getElementById('leaderboard'),
  chatMessages: document.getElementById('chat-messages'),
  chatInput: document.getElementById('chat-input'),
  gameLog: document.getElementById('game-log'),
  marketItems: document.getElementById('market-items'),
  marketDollars: document.getElementById('market-dollars'),
  marketBuyLimit: document.getElementById('market-buy-limit'),
  cartItems: document.getElementById('cart-items'),
  endgameWinner: document.getElementById('endgame-winner'),
  endgameScores: document.getElementById('endgame-scores'),
};

// ===== Screen Management =====
function showScreen(name) {
  for (const [key, el] of Object.entries(screens)) {
    el.classList.toggle('active', key === name);
  }
}

function showOverlay(name) {
  screens[name]?.classList.add('active');
}

function hideOverlay(name) {
  screens[name]?.classList.remove('active');
}

// ===== Title Screen =====
function getPlayerName() {
  return els.playerName.value.trim() || 'Distiller';
}

// Solo play
document.getElementById('btn-solo').addEventListener('click', () => {
  myName = getPlayerName();
  networkMode = 'solo';
  myPlayerId = 'solo_player';
  startSoloGame();
});

// Create room
document.getElementById('btn-create').addEventListener('click', async () => {
  myName = getPlayerName();
  networkMode = 'host';
  myPlayerId = 'host_player';

  setupNetwork();

  const code = generateRoomCode();
  try {
    await network.createRoom(code);
    els.roomCode.textContent = code;
    els.hostPeerId.textContent = code;

    lobbyPlayers = [{ id: myPlayerId, name: myName, isHost: true }];
    renderLobby();
    showScreen('lobby');
    els.btnStartGame.classList.remove('hidden');
  } catch (err) {
    els.titleStatus.textContent = `Failed to create room: ${err.message}`;
  }
});

// How to Play
document.getElementById('btn-howto').addEventListener('click', () => {
  showOverlay('howto');
});
document.getElementById('btn-howto-close').addEventListener('click', () => {
  hideOverlay('howto');
});

// Join room
document.getElementById('btn-join').addEventListener('click', () => {
  els.joinPanel.classList.toggle('hidden');
});

document.getElementById('btn-join-connect').addEventListener('click', async () => {
  myName = getPlayerName();
  networkMode = 'client';

  const code = els.joinHostId.value.trim().toUpperCase();
  if (!code) {
    els.titleStatus.textContent = 'Please enter the room code.';
    return;
  }

  setupNetwork();

  try {
    els.titleStatus.textContent = 'Connecting...';
    const welcome = await network.joinRoom(code, myName);
    myPlayerId = welcome.playerId;

    lobbyPlayers = [
      ...welcome.playerList,
      { id: myPlayerId, name: myName },
    ];
    els.roomCode.textContent = code;
    renderLobby();
    showScreen('lobby');
  } catch (err) {
    els.titleStatus.textContent = `Failed to join: ${err.message}`;
  }
});

// Copy room code
document.getElementById('btn-copy-id').addEventListener('click', () => {
  const code = els.roomCode.textContent;
  navigator.clipboard?.writeText(code).then(() => {
    els.lobbyStatus.textContent = 'Copied!';
    setTimeout(() => { els.lobbyStatus.textContent = ''; }, 2000);
  });
});

// Start game (host only)
els.btnStartGame.addEventListener('click', () => {
  if (networkMode !== 'host' && networkMode !== 'solo') return;

  const seed = Date.now();
  const playerInfos = lobbyPlayers.map(p => ({ id: p.id, name: p.name }));

  if (networkMode === 'host') {
    network.startGame({ seed, playerInfos });
  } else {
    initGame(seed, playerInfos);
  }
});

// ===== Network Setup =====
function setupNetwork() {
  network = createNetworkManager({
    onPlayerJoin(playerId, name) {
      lobbyPlayers.push({ id: playerId, name });
      renderLobby();
      addSystemMessage(els.chatMessages, `${name} joined the room.`);
    },
    onPlayerLeave(playerId) {
      lobbyPlayers = lobbyPlayers.filter(p => p.id !== playerId);
      renderLobby();
    },
    onAction(actionPayload) {
      handleNetworkAction(actionPayload);
    },
    onGameStart(data) {
      initGame(data.seed, data.playerInfos);
    },
    onChat(playerName, message) {
      addChatMessage(els.chatMessages, playerName, message);
    },
    onError(err) {
      console.error('Network error:', err);
    },
    onStatusChange(msg) {
      els.titleStatus.textContent = msg;
      els.lobbyStatus.textContent = msg;
    },
  });
}

function handleNetworkAction(payload) {
  if (!game) return;

  switch (payload.action) {
    case ACTIONS.DISTILL_COMPLETE:
      storeDistillResult(payload.playerId, payload.data);
      break;
    case ACTIONS.BUY:
      buyIngredient(game, payload.playerId, payload.data.color, payload.data.value);
      break;
    case ACTIONS.UNBUY:
      unbuyIngredient(game, payload.playerId, payload.data.color, payload.data.value);
      break;
    case ACTIONS.DONE_BUYING:
      finishBuying(game, payload.playerId);
      break;
    case ACTIONS.BLOWOUT_CHOICE:
      blowoutChoice(game, payload.playerId, payload.data.choice);
      break;
    case ACTIONS.SPEND_COPPER:
      spendCopper(game, payload.playerId);
      break;
    case ACTIONS.BUY_MULLIGAN:
      buyMulligan(game, payload.playerId);
      break;
    case ACTIONS.USE_MULLIGAN:
      useMulligan(game, payload.playerId);
      break;
  }

  updateUI();
}

// Store distill results from a remote player and check if all are done
function storeDistillResult(playerId, data) {
  const player = game.players[playerId];
  if (!player) return;

  // Apply the remote player's distill results
  player.pot = data.pot;
  player.position = data.position;
  player.whiteTotal = data.whiteTotal;
  player.blownOut = data.blownOut;
  player.stopped = !data.blownOut;
  player.bag = data.bag;

  // Check if all players are done distilling
  const allDone = game.playerOrder.every(pid => {
    const p = game.players[pid];
    return p.stopped || p.blownOut;
  });

  if (allDone) {
    scoreRound(game);
  }
}

// ===== Lobby =====
function renderLobby() {
  els.lobbyPlayers.innerHTML = '';
  lobbyPlayers.forEach(p => {
    const div = document.createElement('div');
    div.className = 'player-card';
    div.textContent = p.name;
    if (p.isHost) {
      const badge = document.createElement('span');
      badge.className = 'host-badge';
      badge.textContent = 'HOST';
      div.appendChild(badge);
    }
    els.lobbyPlayers.appendChild(div);
  });
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

// ===== Game Initialization =====
function startSoloGame() {
  lobbyPlayers = [{ id: myPlayerId, name: myName }];
  const seed = Date.now();
  const playerInfos = [{ id: myPlayerId, name: myName }];
  initGame(seed, playerInfos);
}

function initGame(seed, playerInfos) {
  game = createGame(seed, playerInfos);
  engineStartGame(game);

  showScreen('game');
  addSystemMessage(els.chatMessages, 'The distilling season begins!');
  if (networkMode !== 'solo') {
    const code = els.roomCode.textContent;
    if (code) {
      game.log.push(`Room code: ${code}`);
    }
  }
  updateUI();
}

// ===== Game UI Updates =====
function updateUI() {
  if (!game) return;

  const player = getPlayerState(game, myPlayerId);
  if (!player) return;

  // Round/phase
  updateRoundPhase(game.round, game.phase);

  // Holler card
  showHollerCard(els.hollerCard, game.currentHoller);

  // Player stats
  updatePlayerStats(player);

  // Pressure gauge (blowout meter)
  const threshold = BLOWOUT_THRESHOLD - (game.roundModifiers.thresholdReduction || 0);
  renderPressure(els.pressureSegments, els.pressureNumber, els.pressureStatus, player.whiteTotal, threshold);

  // Proof gauge (track position)
  renderProofGauge(player);

  // Placed chips
  renderPlacedChips(els.placedChips, player.pot);

  // Leaderboard
  const lb = getLeaderboard(game);
  renderLeaderboard(els.leaderboard, lb, myPlayerId);

  // Game log
  updateGameLog(els.gameLog, game.log);

  // Action buttons visibility
  updateActionButtons(player);

  // Phase-specific UI
  handlePhaseUI();

  // Refresh market if overlay is showing
  if (screens.market.classList.contains('active')) {
    refreshMarket();
  }

  // Refresh distill overlay if showing
  if (screens.distill.classList.contains('active')) {
    updateDistillOverlay();
  }
}

function updateActionButtons(player) {
  const canAct = game.phase === PHASES.DISTILL && !player.stopped && !player.blownOut;
  const drawBtn = document.getElementById('btn-draw');
  const stopBtn = document.getElementById('btn-stop');
  let backBtn = document.getElementById('btn-back-to-market');

  drawBtn.disabled = !canAct || player.bag.length === 0;
  stopBtn.disabled = !canAct;

  // Show draw/stop during DISTILL, "Back to Market" during MARKET if overlay closed
  const marketHidden = game.phase === PHASES.MARKET && !screens.market.classList.contains('active');

  if (game.phase === PHASES.DISTILL) {
    drawBtn.classList.remove('hidden');
    stopBtn.classList.remove('hidden');
    if (backBtn) backBtn.classList.add('hidden');
    els.actionButtons.classList.remove('hidden');
  } else if (marketHidden) {
    drawBtn.classList.add('hidden');
    stopBtn.classList.add('hidden');
    // Create back-to-market button if needed
    if (!backBtn) {
      backBtn = document.createElement('button');
      backBtn.id = 'btn-back-to-market';
      backBtn.className = 'btn btn-primary';
      backBtn.style.flex = '1';
      backBtn.textContent = 'Back to Market';
      backBtn.addEventListener('click', () => {
        showOverlay('market');
        refreshMarket();
      });
      els.actionButtons.appendChild(backBtn);
    }
    backBtn.classList.remove('hidden');
    els.actionButtons.classList.remove('hidden');
  } else {
    drawBtn.classList.remove('hidden');
    stopBtn.classList.remove('hidden');
    if (backBtn) backBtn.classList.add('hidden');
    els.actionButtons.classList.add('hidden');
  }

  // Copper options (show in market if player has 2+ copper)
  const showCopperOpts = player.copper >= 2 && game.phase === PHASES.MARKET;
  els.copperOptions.classList.toggle('hidden', !showCopperOpts);
}

let currentPhaseShown = null;

function handlePhaseUI() {
  const player = getPlayerState(game, myPlayerId);

  // Show blowout overlay if player needs to choose
  if (player && player._needsBlowoutChoice) {
    els.blowoutDollarsValue.textContent = `$${player._blowoutEarnedDollars || 0}`;
    els.blowoutRepValue.textContent = player._blowoutEarnedRep || 0;
    showOverlay('blowout');
    return; // Block other phase UI until choice is made
  } else {
    hideOverlay('blowout');
  }

  if (game.phase === PHASES.MARKET) {
    if (player && player._skipMarket) {
      // Player chose rep — skip market, auto-send done
      if (currentPhaseShown !== 'MARKET_SKIPPED') {
        currentPhaseShown = 'MARKET_SKIPPED';
        if (networkMode !== 'solo') {
          network.sendAction(myPlayerId, ACTIONS.DONE_BUYING);
        }
      }
    } else if (currentPhaseShown !== 'MARKET') {
      currentPhaseShown = 'MARKET';
      showMarket();
    }
  } else if (game.phase !== PHASES.MARKET) {
    hideOverlay('market');
  }

  if (game.phase === PHASES.ENDGAME && currentPhaseShown !== 'ENDGAME') {
    currentPhaseShown = 'ENDGAME';
    showEndgame();
  }

  if (game.phase === PHASES.DISTILL) {
    if (currentPhaseShown !== 'DISTILL') {
      currentPhaseShown = 'DISTILL';
      distillAnimating = false;
      document.getElementById('distill-chip-reveal').innerHTML = '';
      showOverlay('distill');
      updateDistillOverlay();
    }
  } else {
    hideOverlay('distill');
  }
}

// ===== Player Actions =====

// Draw button — always local (bags are pre-shuffled deterministically)
document.getElementById('btn-draw').addEventListener('click', () => {
  if (!game || game.phase !== PHASES.DISTILL) return;
  const player = getPlayerState(game, myPlayerId);
  if (!player || player.stopped || player.blownOut) return;

  drawChip(game, myPlayerId);
  updateUI();

  // Check if we're done after this draw (blew out or empty bag)
  checkLocalDistillDone();
});

// Stop button — always local
document.getElementById('btn-stop').addEventListener('click', () => {
  if (!game || game.phase !== PHASES.DISTILL) return;
  const player = getPlayerState(game, myPlayerId);
  if (!player || player.stopped || player.blownOut) return;

  stopDrawing(game, myPlayerId);
  updateUI();

  checkLocalDistillDone();
});

// After local player finishes distilling, send results to host for sync
function checkLocalDistillDone() {
  const player = getPlayerState(game, myPlayerId);
  if (!player || (!player.stopped && !player.blownOut)) return;
  if (player._distillSent) return;
  player._distillSent = true;

  if (networkMode === 'solo') {
    // Solo: check if phase should advance (it should, since only 1 player)
    return;
  }

  // Send our distill results to the host
  network.sendAction(myPlayerId, ACTIONS.DISTILL_COMPLETE, {
    pot: player.pot.map(c => ({ color: c.color, value: c.value })),
    position: player.position,
    whiteTotal: player.whiteTotal,
    blownOut: player.blownOut,
    bag: player.bag.map(c => ({ color: c.color, value: c.value })),
  });
}

// ===== Distill Overlay =====
let distillAnimating = false;

function updateDistillOverlay() {
  if (!game) return;
  const player = getPlayerState(game, myPlayerId);
  if (!player) return;

  const threshold = BLOWOUT_THRESHOLD - (game.roundModifiers.thresholdReduction || 0);

  // Round info and stats
  document.getElementById('distill-round').textContent = `Round ${game.round}`;
  document.getElementById('distill-bag-count').textContent = `🎒 ${player.bag.length}`;
  document.getElementById('distill-copper').textContent = `🔶 ${player.copper}`;
  document.getElementById('distill-regulars').textContent = `🍶 ${player.reputation}`;

  // Pressure gauge
  renderPressure(
    document.getElementById('distill-pressure-segments'),
    document.getElementById('distill-pressure-number'),
    document.getElementById('distill-pressure-status'),
    player.whiteTotal, threshold
  );

  // Still pot chips and liquid
  renderDistillChips(document.getElementById('distill-chips'), player.pot);
  updateStillLiquid(document.getElementById('distill-liquid'), player.pot.length, 12);

  // Proof
  renderDistillProof(document.getElementById('distill-proof'), player.position, player.flameStart);

  // Brewmaster
  updateBrewmaster(document.getElementById('brewmaster'), player, threshold);

  // Button states
  const canAct = !player.stopped && !player.blownOut;
  document.getElementById('btn-distill-draw').disabled = !canAct || player.bag.length === 0;
  document.getElementById('btn-distill-stop').disabled = !canAct;

  // Mulligan button
  const mulliganEl = document.getElementById('distill-mulligan');
  const canMulligan = player.hasMulligan && !player._mulliganUsed && player.pot.length > 0 && !player.stopped && !player.blownOut;
  mulliganEl.classList.toggle('hidden', !canMulligan);

  // Waiting message
  const waiting = document.getElementById('distill-waiting');
  if (player.stopped || player.blownOut) {
    waiting.classList.remove('hidden');
    document.getElementById('btn-distill-draw').classList.add('hidden');
    document.getElementById('btn-distill-stop').classList.add('hidden');
  } else {
    waiting.classList.add('hidden');
    document.getElementById('btn-distill-draw').classList.remove('hidden');
    document.getElementById('btn-distill-stop').classList.remove('hidden');
  }
}

// Use Mulligan button
document.getElementById('btn-use-mulligan').addEventListener('click', () => {
  if (!game || game.phase !== PHASES.DISTILL || distillAnimating) return;
  const player = getPlayerState(game, myPlayerId);
  if (!player || !player.hasMulligan || player._mulliganUsed) return;
  if (player.pot.length === 0 || player.stopped || player.blownOut) return;

  useMulligan(game, myPlayerId);
  document.getElementById('distill-chip-reveal').innerHTML = '';
  updateUI();
  updateDistillOverlay();
});

// Distill overlay Brew button
document.getElementById('btn-distill-draw').addEventListener('click', () => {
  if (!game || game.phase !== PHASES.DISTILL || distillAnimating) return;
  const player = getPlayerState(game, myPlayerId);
  if (!player || player.stopped || player.blownOut) return;

  distillAnimating = true;
  document.getElementById('btn-distill-draw').disabled = true;
  document.getElementById('btn-distill-stop').disabled = true;

  const result = drawChip(game, myPlayerId);

  if (result && result.chip) {
    // Animate the chip reveal
    animateChipDraw(
      document.getElementById('distill-chip-reveal'),
      result.chip,
      () => {
        // If blue chip triggered a bonus draw, animate that too
        if (result.blueChip && !result.blueChip.returned) {
          animateChipDraw(
            document.getElementById('distill-chip-reveal'),
            result.blueChip.chip,
            () => {
              distillAnimating = false;
              updateUI();
              updateDistillOverlay();
              checkLocalDistillDone();
            }
          );
        } else {
          distillAnimating = false;
          updateUI();
          updateDistillOverlay();
          checkLocalDistillDone();
        }
      }
    );
  } else {
    distillAnimating = false;
    updateUI();
    updateDistillOverlay();
    checkLocalDistillDone();
  }
});

// Distill overlay Bottle button
document.getElementById('btn-distill-stop').addEventListener('click', () => {
  if (!game || game.phase !== PHASES.DISTILL || distillAnimating) return;
  const player = getPlayerState(game, myPlayerId);
  if (!player || player.stopped || player.blownOut) return;

  stopDrawing(game, myPlayerId);
  updateUI();
  updateDistillOverlay();
  checkLocalDistillDone();
});

// Blowout choices
document.getElementById('btn-choose-dollars').addEventListener('click', () => {
  if (networkMode === 'solo') {
    blowoutChoice(game, myPlayerId, 'dollars');
    currentPhaseShown = null;
    hideOverlay('blowout');
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.BLOWOUT_CHOICE, { choice: 'dollars' });
    currentPhaseShown = null;
    hideOverlay('blowout');
    updateUI();
  }
});

document.getElementById('btn-choose-rep').addEventListener('click', () => {
  if (networkMode === 'solo') {
    blowoutChoice(game, myPlayerId, 'reputation');
    currentPhaseShown = null;
    hideOverlay('blowout');
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.BLOWOUT_CHOICE, { choice: 'reputation' });
    currentPhaseShown = null;
    hideOverlay('blowout');
    updateUI();
  }
});

// Spend copper to upgrade still
document.getElementById('btn-spend-copper').addEventListener('click', () => {
  if (networkMode === 'solo') {
    spendCopper(game, myPlayerId);
    refreshMarket();
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.SPEND_COPPER);
  }
});

// Buy Mulligan at market
document.getElementById('btn-buy-mulligan').addEventListener('click', () => {
  if (networkMode === 'solo') {
    buyMulligan(game, myPlayerId);
    refreshMarket();
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.BUY_MULLIGAN);
  }
});

// Chat
document.getElementById('btn-chat-send').addEventListener('click', sendChatMessage);
els.chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});

function sendChatMessage() {
  const msg = els.chatInput.value.trim();
  if (!msg) return;

  if (networkMode === 'solo') {
    addChatMessage(els.chatMessages, myName, msg);
  } else {
    network.sendChat(myName, msg);
  }
  els.chatInput.value = '';
}

// ===== Market =====

function showMarket() {
  const player = getPlayerState(game, myPlayerId);
  if (!player) return;

  els.marketBuyLimit.textContent = game.roundModifiers.buyLimit || MAX_BUYS_PER_ROUND;
  refreshMarket();
  showOverlay('market');
}

function refreshMarket() {
  const player = getPlayerState(game, myPlayerId);
  if (!player) return;

  const discount = game.roundModifiers.discount || 0;
  const maxBuys = game.roundModifiers.buyLimit || MAX_BUYS_PER_ROUND;

  els.marketDollars.textContent = `$${player.dollars}`;

  // Copper options (inside market overlay)
  const showCopperOpts = player.copper >= 2;
  els.copperOptions.classList.toggle('hidden', !showCopperOpts);
  els.marketCopperCount.textContent = player.copper;
  // Disable mulligan button if already has one
  document.getElementById('btn-buy-mulligan').disabled = player.hasMulligan;
  // Disable upgrade if not enough copper
  document.getElementById('btn-spend-copper').disabled = player.copper < 2;

  // Render shop items with data attributes for event delegation
  const items = getShopItems(discount);
  els.marketItems.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'market-item';

    const canBuy = player.dollars >= item.cost &&
                   player.boughtThisRound.length < maxBuys &&
                   !player.boughtThisRound.includes(`${item.color}:${item.value}`);

    if (!canBuy) div.classList.add('disabled');

    div.dataset.color = item.color;
    div.dataset.value = item.value;

    div.innerHTML = `
      <div class="mi-icon">${ingredientIconHtml(item.color)}</div>
      <div class="mi-name">${item.name}</div>
      <div class="mi-value">Value: ${item.value}</div>
      <div class="mi-cost">$${item.cost}</div>
      <div class="mi-desc">${INGREDIENTS[item.color].description}</div>
    `;

    els.marketItems.appendChild(div);
  });

  // Render cart
  els.cartItems.innerHTML = '';
  player.boughtThisRound.forEach(key => {
    const [color, valStr] = key.split(':');
    const div = document.createElement('div');
    div.className = 'cart-chip';
    div.dataset.unbuyColor = color;
    div.dataset.unbuyValue = valStr;
    div.innerHTML = `${ingredientIconHtml(color)} ${INGREDIENTS[color].name} (${valStr}) <span class="remove-btn">✕</span>`;
    div.style.cursor = 'pointer';
    els.cartItems.appendChild(div);
  });

  if (player.boughtThisRound.length === 0) {
    els.cartItems.innerHTML = '<span style="color: var(--text-dim);">Nothing yet... tap items above to buy</span>';
  }
}

// Event delegation: market item clicks
els.marketItems.addEventListener('click', (e) => {
  const item = e.target.closest('.market-item');
  if (!item || item.classList.contains('disabled')) return;
  const color = item.dataset.color;
  const value = Number(item.dataset.value);
  if (!color) return;

  if (networkMode === 'solo') {
    buyIngredient(game, myPlayerId, color, value);
    refreshMarket();
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.BUY, { color, value });
  }
});

// Event delegation: cart item clicks (unbuy)
els.cartItems.addEventListener('click', (e) => {
  const chip = e.target.closest('.cart-chip');
  if (!chip) return;
  const color = chip.dataset.unbuyColor;
  const value = Number(chip.dataset.unbuyValue);
  if (!color) return;

  if (networkMode === 'solo') {
    unbuyIngredient(game, myPlayerId, color, value);
    refreshMarket();
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.UNBUY, { color, value });
  }
});

// Market close button — just hides the overlay (does NOT finalize)
document.getElementById('btn-market-close').addEventListener('click', () => {
  hideOverlay('market');
});

// Done buying — finalizes purchases and advances the round
document.getElementById('btn-done-buying').addEventListener('click', () => {
  if (networkMode === 'solo') {
    finishBuying(game, myPlayerId);
    hideOverlay('market');
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.DONE_BUYING);
    hideOverlay('market');
  }
});

// ===== Endgame =====
function showEndgame() {
  const winner = getWinner(game);
  const lb = getLeaderboard(game);

  els.endgameWinner.innerHTML = '';
  if (winner) {
    els.endgameWinner.innerHTML = `
      <div class="winner-name">🏆 ${escapeHtml(winner.name)}</div>
      <div class="winner-score">
        ${winner.reputation} Regulars | $${winner.dollars} | ${winner.copper} Copper
      </div>
    `;
  }

  els.endgameScores.innerHTML = '';
  lb.forEach((entry, idx) => {
    const div = document.createElement('div');
    div.className = 'eg-entry';
    div.innerHTML = `
      <span class="eg-rank">#${idx + 1}</span>
      <span class="eg-name">${escapeHtml(entry.name)}</span>
      <span class="eg-rep">🍶 ${entry.reputation}</span>
    `;
    els.endgameScores.appendChild(div);
  });

  showScreen('endgame');
}

// Play again
document.getElementById('btn-play-again').addEventListener('click', () => {
  game = null;
  lobbyPlayers = [];
  currentPhaseShown = null;
  distillAnimating = false;
  if (network) {
    network.destroy();
    network = null;
  }
  showScreen('title');
});

// ===== Check URL for join link =====
function checkJoinLink() {
  const hash = window.location.hash;
  if (hash.includes('join?code=')) {
    const code = hash.split('code=')[1];
    if (code) {
      els.joinHostId.value = code.toUpperCase();
      els.joinPanel.classList.remove('hidden');
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

// ===== Init =====
checkJoinLink();

// Draw pixel art scene on title screen
const pixelCanvas = document.getElementById('pixel-canvas');
if (pixelCanvas) drawPixelScene(pixelCanvas);

// Draw night scene background
const nightBg = document.getElementById('night-bg');
if (nightBg) drawNightScene(nightBg);

// Generate a random default name
const defaultNames = ['Granny Mae', 'Whiskey Jack', 'Copper Tom', 'Bootleg Billy', 'Sweet Sally', 'Moonshine Mike'];
els.playerName.value = defaultNames[Math.floor(Math.random() * defaultNames.length)];
