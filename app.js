import {
  createGame, startGame as engineStartGame, drawChip, stopDrawing,
  buyIngredient, finishBuying, spendCopper, blowoutChoice,
  getLeaderboard, getWinner, getPlayerState, PHASES,
} from './engine/gameEngine.js';
import {
  TRACK, BLOWOUT_THRESHOLD, INGREDIENTS, TOTAL_ROUNDS,
  getShopItems, MAX_BUYS_PER_ROUND,
} from './engine/rules.js';
import { renderTrack, renderPlacedChips, updateBlowoutMeter, updatePlayerStats, showHollerCard, updateRoundPhase } from './ui/board.js';
import { renderLeaderboard } from './ui/leaderboard.js';
import { addChatMessage, addSystemMessage, updateGameLog } from './ui/chat.js';
import { createNetworkManager } from './network/peer.js';
import { ACTIONS } from './network/messages.js';

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
  coilTrack: document.getElementById('coil-track'),
  placedChips: document.getElementById('placed-chips'),
  blowoutFill: document.getElementById('blowout-fill'),
  blowoutValue: document.getElementById('blowout-value'),
  hollerCard: document.getElementById('holler-card'),
  actionButtons: document.getElementById('action-buttons'),
  blowoutChoice: document.getElementById('blowout-choice'),
  copperSpend: document.getElementById('copper-spend'),
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

  try {
    const peerId = await network.createRoom();
    els.roomCode.textContent = generateRoomCode();
    els.hostPeerId.textContent = peerId;

    lobbyPlayers = [{ id: myPlayerId, name: myName, isHost: true }];
    renderLobby();
    showScreen('lobby');
    els.btnStartGame.classList.remove('hidden');
  } catch (err) {
    els.titleStatus.textContent = `Failed to create room: ${err.message}`;
  }
});

// Join room
document.getElementById('btn-join').addEventListener('click', () => {
  els.joinPanel.classList.toggle('hidden');
});

document.getElementById('btn-join-connect').addEventListener('click', async () => {
  myName = getPlayerName();
  networkMode = 'client';

  const hostId = els.joinHostId.value.trim();
  if (!hostId) {
    els.titleStatus.textContent = 'Please enter the host peer ID.';
    return;
  }

  setupNetwork();

  try {
    els.titleStatus.textContent = 'Connecting...';
    const welcome = await network.joinRoom(hostId, myName);
    myPlayerId = welcome.playerId;

    lobbyPlayers = [
      ...welcome.playerList,
      { id: myPlayerId, name: myName },
    ];
    renderLobby();
    showScreen('lobby');
  } catch (err) {
    els.titleStatus.textContent = `Failed to join: ${err.message}`;
  }
});

// Copy host ID
document.getElementById('btn-copy-id').addEventListener('click', () => {
  const id = els.hostPeerId.textContent;
  navigator.clipboard?.writeText(id).then(() => {
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
    case ACTIONS.DRAW:
      drawChip(game, payload.playerId);
      break;
    case ACTIONS.STOP:
      stopDrawing(game, payload.playerId);
      break;
    case ACTIONS.BUY:
      buyIngredient(game, payload.playerId, payload.data.color, payload.data.value);
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
  }

  updateUI();
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
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  let code = '';
  for (let i = 0; i < 4; i++) code += chars[Math.floor(Math.random() * chars.length)];
  code += '-' + Math.floor(1000 + Math.random() * 9000);
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

  // Track
  const threshold = BLOWOUT_THRESHOLD - (game.roundModifiers.thresholdReduction || 0);
  renderTrack(els.coilTrack, player.position, player.flameStart, threshold);

  // Placed chips
  renderPlacedChips(els.placedChips, player.pot);

  // Blowout meter
  updateBlowoutMeter(els.blowoutFill, els.blowoutValue, player.whiteTotal, threshold);

  // Leaderboard
  const lb = getLeaderboard(game);
  renderLeaderboard(els.leaderboard, lb, myPlayerId);

  // Game log
  updateGameLog(els.gameLog, game.log);

  // Action buttons visibility
  updateActionButtons(player);

  // Phase-specific UI
  handlePhaseUI();
}

function updateActionButtons(player) {
  const canAct = game.phase === PHASES.DISTILL && !player.stopped && !player.blownOut;
  const drawBtn = document.getElementById('btn-draw');
  const stopBtn = document.getElementById('btn-stop');

  drawBtn.disabled = !canAct || player.bag.length === 0;
  stopBtn.disabled = !canAct;

  els.actionButtons.classList.toggle('hidden', game.phase !== PHASES.DISTILL);

  // Show blowout choice if player blew out and hasn't chosen yet
  const showBlowout = player.blownOut && !player._blowoutChosen &&
    (game.phase === PHASES.DISTILL || game.phase === PHASES.SCORING || game.phase === PHASES.MARKET);
  els.blowoutChoice.classList.toggle('hidden', !showBlowout);

  // Copper spend (show during distill and market phases)
  const showCopper = player.copper >= 2 && (game.phase === PHASES.DISTILL || game.phase === PHASES.MARKET);
  els.copperSpend.classList.toggle('hidden', !showCopper);
}

let currentPhaseShown = null;

function handlePhaseUI() {
  if (game.phase === PHASES.MARKET && currentPhaseShown !== 'MARKET') {
    currentPhaseShown = 'MARKET';
    showMarket();
  } else if (game.phase !== PHASES.MARKET) {
    hideOverlay('market');
  }

  if (game.phase === PHASES.ENDGAME && currentPhaseShown !== 'ENDGAME') {
    currentPhaseShown = 'ENDGAME';
    showEndgame();
  }

  if (game.phase === PHASES.DISTILL) {
    currentPhaseShown = 'DISTILL';
  }
}

// ===== Player Actions =====

// Draw button
document.getElementById('btn-draw').addEventListener('click', () => {
  if (!game || game.phase !== PHASES.DISTILL) return;

  if (networkMode === 'solo') {
    drawChip(game, myPlayerId);
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.DRAW);
  }
});

// Stop button
document.getElementById('btn-stop').addEventListener('click', () => {
  if (!game || game.phase !== PHASES.DISTILL) return;

  if (networkMode === 'solo') {
    stopDrawing(game, myPlayerId);
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.STOP);
  }
});

// Blowout choices
document.getElementById('btn-choose-dollars').addEventListener('click', () => {
  const player = getPlayerState(game, myPlayerId);
  if (player) player._blowoutChosen = true;

  if (networkMode === 'solo') {
    blowoutChoice(game, myPlayerId, 'dollars');
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.BLOWOUT_CHOICE, { choice: 'dollars' });
  }
});

document.getElementById('btn-choose-rep').addEventListener('click', () => {
  const player = getPlayerState(game, myPlayerId);
  if (player) player._blowoutChosen = true;

  if (networkMode === 'solo') {
    blowoutChoice(game, myPlayerId, 'reputation');
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.BLOWOUT_CHOICE, { choice: 'reputation' });
  }
});

// Spend copper
document.getElementById('btn-spend-copper').addEventListener('click', () => {
  if (networkMode === 'solo') {
    spendCopper(game, myPlayerId);
    updateUI();
  } else {
    network.sendAction(myPlayerId, ACTIONS.SPEND_COPPER);
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
let marketCart = []; // { color, value, cost }

function showMarket() {
  const player = getPlayerState(game, myPlayerId);
  if (!player) return;

  const discount = game.roundModifiers.discount || 0;
  const maxBuys = game.roundModifiers.buyLimit || MAX_BUYS_PER_ROUND;

  els.marketDollars.textContent = `$${player.dollars}`;
  els.marketBuyLimit.textContent = maxBuys;
  marketCart = [];

  renderMarketItems(player, discount, maxBuys);
  renderCart();
  showOverlay('market');
}

function renderMarketItems(player, discount, maxBuys) {
  const items = getShopItems(discount);
  els.marketItems.innerHTML = '';

  items.forEach(item => {
    const div = document.createElement('div');
    div.className = 'market-item';

    const canBuy = player.dollars >= item.cost &&
                   player.boughtThisRound.length < maxBuys &&
                   !player.boughtThisRound.includes(item.color) &&
                   !marketCart.some(c => c.color === item.color);

    if (!canBuy) div.classList.add('disabled');

    div.innerHTML = `
      <div class="mi-icon">${item.icon}</div>
      <div class="mi-name">${item.name}</div>
      <div class="mi-value">Value: ${item.value}</div>
      <div class="mi-cost">$${item.cost}</div>
      <div class="mi-desc">${INGREDIENTS[item.color].description}</div>
    `;

    if (canBuy) {
      div.addEventListener('click', () => {
        doBuy(item.color, item.value);
      });
    }

    els.marketItems.appendChild(div);
  });
}

function doBuy(color, value) {
  if (networkMode === 'solo') {
    buyIngredient(game, myPlayerId, color, value);
    updateUI();
    // Re-render market
    const player = getPlayerState(game, myPlayerId);
    const discount = game.roundModifiers.discount || 0;
    const maxBuys = game.roundModifiers.buyLimit || MAX_BUYS_PER_ROUND;
    els.marketDollars.textContent = `$${player.dollars}`;
    renderMarketItems(player, discount, maxBuys);
    renderCart();
  } else {
    network.sendAction(myPlayerId, ACTIONS.BUY, { color, value });
  }
}

function renderCart() {
  const player = getPlayerState(game, myPlayerId);
  if (!player) return;

  els.cartItems.innerHTML = '';
  player.boughtThisRound.forEach(color => {
    const div = document.createElement('div');
    div.className = 'cart-chip';
    div.innerHTML = `${INGREDIENTS[color].icon} ${INGREDIENTS[color].name}`;
    els.cartItems.appendChild(div);
  });

  if (player.boughtThisRound.length === 0) {
    els.cartItems.innerHTML = '<span style="color: var(--text-dim);">Nothing yet...</span>';
  }
}

// Done buying
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
        ${winner.reputation} Reputation | $${winner.dollars} | ${winner.copper} Copper
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
      <span class="eg-rep">★ ${entry.reputation}</span>
    `;
    els.endgameScores.appendChild(div);
  });

  showScreen('endgame');
}

// Play again
document.getElementById('btn-play-again').addEventListener('click', () => {
  game = null;
  lobbyPlayers = [];
  if (network) {
    network.destroy();
    network = null;
  }
  showScreen('title');
});

// ===== Check URL for join link =====
function checkJoinLink() {
  const hash = window.location.hash;
  if (hash.includes('join?host=')) {
    const hostId = hash.split('host=')[1];
    if (hostId) {
      els.joinHostId.value = hostId;
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

// Generate a random default name
const defaultNames = ['Granny Mae', 'Whiskey Jack', 'Copper Tom', 'Bootleg Billy', 'Sweet Sally', 'Moonshine Mike'];
els.playerName.value = defaultNames[Math.floor(Math.random() * defaultNames.length)];
