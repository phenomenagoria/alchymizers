import { createRng, deriveSeed } from './rng.js';
import {
  TOTAL_ROUNDS, BLOWOUT_THRESHOLD, MAX_BUYS_PER_ROUND,
  TRACK, TRACK_MAX, INGREDIENTS, HOLLER_CARDS,
  createStartingBag, getIngredientCost,
} from './rules.js';

// Game phases
export const PHASES = {
  LOBBY: 'LOBBY',
  ROUND_START: 'ROUND_START',
  DISTILL: 'DISTILL',
  SCORING: 'SCORING',
  MARKET: 'MARKET',
  CLEANUP: 'CLEANUP',
  ENDGAME: 'ENDGAME',
};

// Create a new player state
function createPlayer(id, name) {
  return {
    id,
    name,
    bag: createStartingBag(),
    pot: [],           // chips placed this round (in order)
    position: 0,       // current position on track
    flameStart: 0,     // starting position each round
    whiteTotal: 0,     // sum of white chips this round
    blownOut: false,
    stopped: false,
    dollars: 0,
    reputation: 0,
    copper: 0,
    boughtThisRound: [], // colors bought this round
    chipCount: 0,        // number of chips drawn this round (for first-chip-double)
    hasMulligan: false,  // bought a Rabbit's Foot at market
  };
}

// Create a new game state
export function createGame(seed, playerInfos) {
  const gameRng = createRng(seed);

  // Shuffle holler cards
  const hollerDeck = [...HOLLER_CARDS];
  gameRng.shuffle(hollerDeck);

  const players = {};
  const playerOrder = [];

  for (const info of playerInfos) {
    const player = createPlayer(info.id, info.name);
    // Shuffle each player's starting bag with their own RNG
    const pRng = createRng(deriveSeed(seed, hashString(info.id)));
    pRng.shuffle(player.bag);
    players[info.id] = player;
    playerOrder.push(info.id);
  }

  return {
    seed,
    phase: PHASES.LOBBY,
    round: 0,
    players,
    playerOrder,
    hollerDeck,
    currentHoller: null,
    roundModifiers: {},
    actionSeq: 0,
    log: [],
  };
}

// Simple string hash for deriving player seeds
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// ---- Phase Transitions ----

export function startGame(game) {
  game.phase = PHASES.ROUND_START;
  game.round = 1;
  // Shuffle each player's bag before the first round
  shuffleAllBags(game);
  startRound(game);
  return game;
}

// Shuffle all player bags deterministically for the current round
function shuffleAllBags(game) {
  for (const pid of game.playerOrder) {
    const pRng = createRng(deriveSeed(game.seed, hashString(pid), game.round));
    pRng.shuffle(game.players[pid].bag);
  }
}

export function startRound(game) {
  game.phase = PHASES.ROUND_START;
  game.roundModifiers = {};

  // Draw holler card
  if (game.hollerDeck.length > 0) {
    game.currentHoller = game.hollerDeck.pop();
  } else {
    game.currentHoller = null;
  }

  // Apply immediate holler effects
  if (game.currentHoller) {
    applyHollerCard(game, game.currentHoller);
  }

  // Reset player round state
  for (const pid of game.playerOrder) {
    const p = game.players[pid];
    p.pot = [];
    p.position = p.flameStart;
    p.whiteTotal = 0;
    p.blownOut = false;
    p.stopped = false;
    p.boughtThisRound = [];
    p.chipCount = 0;
  }

  game.log.push(`--- Round ${game.round} ---`);
  if (game.currentHoller) {
    game.log.push(`Holler: ${game.currentHoller.name} - ${game.currentHoller.desc}`);
  }

  // Move to distill phase
  game.phase = PHASES.DISTILL;
}

function applyHollerCard(game, card) {
  const mods = game.roundModifiers;

  switch (card.effect) {
    case 'ALL_GAIN_COPPER':
      for (const pid of game.playerOrder) {
        game.players[pid].copper += card.value;
      }
      break;
    case 'ALL_GAIN_REP':
      for (const pid of game.playerOrder) {
        game.players[pid].reputation += card.value;
      }
      break;
    case 'PAY_DOLLARS':
      for (const pid of game.playerOrder) {
        game.players[pid].dollars = Math.max(0, game.players[pid].dollars - card.value);
      }
      break;
    case 'ADVANCE_FLAME':
      for (const pid of game.playerOrder) {
        game.players[pid].flameStart = Math.min(TRACK_MAX, game.players[pid].flameStart + card.value);
        game.players[pid].position = game.players[pid].flameStart;
      }
      break;
    case 'FREE_ORANGE':
      for (const pid of game.playerOrder) {
        game.players[pid].bag.push({ color: 'orange', value: 1 });
      }
      break;
    case 'BONUS_DOLLARS':
      mods.bonusDollars = card.value;
      break;
    case 'BONUS_MOVEMENT':
      mods.bonusMovement = card.value;
      break;
    case 'FIRST_CHIP_DOUBLE':
      mods.firstChipDouble = true;
      break;
    case 'LOWER_THRESHOLD':
      mods.thresholdReduction = card.value;
      break;
    case 'DOUBLE_REPUTATION':
      mods.doubleReputation = true;
      break;
    case 'WHITE_1_SAFE':
      mods.white1Safe = true;
      break;
    case 'CORN_BONUS':
      mods.cornBonus = card.value;
      break;
    case 'DISCOUNT':
      mods.discount = card.value;
      break;
    case 'BUY_LIMIT':
      mods.buyLimit = card.value;
      break;
    case 'BLOWOUT_PENALTY':
      mods.blowoutPenalty = card.value;
      break;
  }
}

// Get effective blowout threshold for this round
function getThreshold(game) {
  return BLOWOUT_THRESHOLD - (game.roundModifiers.thresholdReduction || 0);
}

// ---- Player Actions ----

// Draw a chip from the bag
// Bags are pre-shuffled at round start, so draw = pop from end (deterministic)
export function drawChip(game, playerId) {
  const player = game.players[playerId];
  if (!player || player.stopped || player.blownOut) return null;
  if (player.bag.length === 0) {
    player.stopped = true;
    game.log.push(`${player.name}: bag is empty, forced to stop.`);
    checkDistillPhaseEnd(game);
    return null;
  }

  return performDraw(game, player, false);
}

function performDraw(game, player, isBlueDraw) {
  if (player.bag.length === 0) return null;

  // Pop from end of pre-shuffled bag (deterministic)
  const chip = player.bag.pop();

  player.chipCount++;

  // Calculate movement
  let movement = chip.value;

  // First chip double modifier
  if (game.roundModifiers.firstChipDouble && player.chipCount === 1 && !isBlueDraw) {
    movement *= 2;
  }

  // Bonus movement modifier
  if (game.roundModifiers.bonusMovement && chip.color !== 'white') {
    movement += game.roundModifiers.bonusMovement;
  }

  // Corn bonus modifier
  if (game.roundModifiers.cornBonus && chip.color === 'orange') {
    movement += game.roundModifiers.cornBonus;
  }

  // Handle white chips (bad mash)
  if (chip.color === 'white') {
    const whiteValue = chip.value;
    // White-1 safe modifier
    if (game.roundModifiers.white1Safe && whiteValue === 1) {
      // White 1s don't count toward blowout
    } else {
      player.whiteTotal += whiteValue;
    }
    // White chips still advance position
  }

  // Apply ingredient abilities
  const abilityResult = applyChipAbility(game, player, chip, movement);
  movement = abilityResult.movement;

  // Place chip in pot
  player.pot.push(chip);

  // Advance position
  player.position = Math.min(TRACK_MAX, player.position + movement);

  // Check for blowout
  const threshold = getThreshold(game);
  if (player.whiteTotal > threshold) {
    player.blownOut = true;
    game.log.push(`${player.name}: BLOWOUT! (bad mash total: ${player.whiteTotal})`);
  } else {
    const chipName = INGREDIENTS[chip.color]?.name || chip.color;
    game.log.push(`${player.name}: drew ${chipName} ${chip.value} → position ${player.position}`);
  }

  // Blue chip auto-draw
  if (abilityResult.blueDraw && !player.blownOut && player.bag.length > 0) {
    const blueResult = performBlueDraw(game, player);
    if (blueResult) {
      return { chip, blueChip: blueResult };
    }
  }

  checkDistillPhaseEnd(game);
  return { chip };
}

function applyChipAbility(game, player, chip, movement) {
  let result = { movement, blueDraw: false };

  switch (chip.color) {
    case 'red': {
      // Charcoal: extra movement = number of orange chips already placed
      const orangeCount = player.pot.filter(c => c.color === 'orange').length;
      result.movement += orangeCount;
      break;
    }
    case 'yellow': {
      // Sugar: +1 for each yellow already placed
      const yellowCount = player.pot.filter(c => c.color === 'yellow').length;
      result.movement += yellowCount;
      break;
    }
    case 'blue': {
      // Copper Coil: trigger a bonus draw
      result.blueDraw = true;
      break;
    }
    // Green and purple abilities are resolved at end of round
    default:
      break;
  }

  return result;
}

function performBlueDraw(game, player) {
  if (player.bag.length === 0) return null;

  // Pop from end of pre-shuffled bag
  const bonusChip = player.bag.pop();

  if (bonusChip.color === 'white') {
    // Return white chip to bag (insert at start so it's not immediately re-drawn)
    player.bag.unshift(bonusChip);
    game.log.push(`${player.name}: Copper Coil filtered out ${INGREDIENTS.white.name} ${bonusChip.value}!`);
    return { chip: bonusChip, returned: true };
  }

  // Place non-white chip
  let movement = bonusChip.value;
  if (game.roundModifiers.bonusMovement) {
    movement += game.roundModifiers.bonusMovement;
  }
  if (game.roundModifiers.cornBonus && bonusChip.color === 'orange') {
    movement += game.roundModifiers.cornBonus;
  }

  // Apply abilities of the bonus chip
  const abilityResult = applyChipAbility(game, player, bonusChip, movement);
  movement = abilityResult.movement;

  bonusChip._blueDrawn = false;
  player.pot.push(bonusChip);
  player.position = Math.min(TRACK_MAX, player.position + movement);

  const chipName = INGREDIENTS[bonusChip.color]?.name || bonusChip.color;
  game.log.push(`${player.name}: Copper Coil drew ${chipName} ${bonusChip.value} → position ${player.position}`);

  return { chip: bonusChip, returned: false };
}

// Player stops drawing
export function stopDrawing(game, playerId) {
  const player = game.players[playerId];
  if (!player || player.stopped || player.blownOut) return;

  player.stopped = true;
  game.log.push(`${player.name}: stopped at position ${player.position}.`);
  checkDistillPhaseEnd(game);
}

function checkDistillPhaseEnd(game) {
  const allDone = game.playerOrder.every(pid => {
    const p = game.players[pid];
    return p.stopped || p.blownOut;
  });

  if (allDone) {
    scoreRound(game);
  }
}

// ---- Scoring ----

export function scoreRound(game) {
  game.phase = PHASES.SCORING;

  for (const pid of game.playerOrder) {
    const player = game.players[pid];
    const trackSpace = TRACK[player.position] || TRACK[TRACK_MAX];

    let earnedDollars = trackSpace.coins;
    let earnedRep = trackSpace.vp;

    // Apply holler modifiers
    if (game.roundModifiers.bonusDollars) {
      earnedDollars += game.roundModifiers.bonusDollars;
    }
    if (game.roundModifiers.doubleReputation) {
      earnedRep *= 2;
    }

    if (player.blownOut) {
      // Defer reward assignment — player must choose dollars or rep
      player._needsBlowoutChoice = true;
      player._blowoutEarnedDollars = earnedDollars;
      player._blowoutEarnedRep = earnedRep;

      // Apply blowout penalty
      if (game.roundModifiers.blowoutPenalty) {
        player.reputation = Math.max(0, player.reputation - game.roundModifiers.blowoutPenalty);
      }

      game.log.push(`${player.name}: blew out! Must choose reward.`);
    } else {
      player.dollars += earnedDollars;
      player.reputation += earnedRep;
      game.log.push(`${player.name}: scored $${earnedDollars} and ${earnedRep} rep.`);
    }

    // Copper bonus: only if bottled ON a copper space (not blown out)
    if (!player.blownOut) {
      const landedSpace = TRACK[player.position];
      if (landedSpace && landedSpace.special === 'copper') {
        const copperGain = landedSpace.copperValue || 1;
        player.copper += copperGain;
        game.log.push(`${player.name}: bottled on copper spot — gained ${copperGain} copper.`);
      }
    }

    // Green (Juniper) end-of-round ability
    const potLen = player.pot.length;
    if (potLen > 0) {
      const lastChip = player.pot[potLen - 1];
      const secondLast = potLen > 1 ? player.pot[potLen - 2] : null;
      if (lastChip.color === 'green' || (secondLast && secondLast.color === 'green')) {
        player.copper += 1;
        game.log.push(`${player.name}: Juniper bonus — gained 1 copper.`);
      }
    }

    // Purple (Ghost Pepper) end-of-round ability
    const purpleCount = player.pot.filter(c => c.color === 'purple').length;
    if (purpleCount >= 1) {
      player.reputation += 1;
      game.log.push(`${player.name}: Ghost Pepper (1) — gained 1 rep.`);
    }
    if (purpleCount >= 2) {
      player.copper += 1;
      game.log.push(`${player.name}: Ghost Pepper (2) — gained 1 copper.`);
    }
    if (purpleCount >= 3) {
      player.reputation += 2;
      game.log.push(`${player.name}: Ghost Pepper (3) — gained 2 rep.`);
    }
  }

  // Move to market or endgame
  if (game.round >= TOTAL_ROUNDS) {
    game.phase = PHASES.ENDGAME;
    game.log.push('=== GAME OVER ===');
  } else {
    game.phase = PHASES.MARKET;
  }
}

// ---- Market (Buying) ----

export function buyIngredient(game, playerId, color, value) {
  const player = game.players[playerId];
  if (!player || game.phase !== PHASES.MARKET) return false;

  const maxBuys = game.roundModifiers.buyLimit || MAX_BUYS_PER_ROUND;
  if (player.boughtThisRound.length >= maxBuys) return false;

  // Must be different colors
  if (player.boughtThisRound.includes(color)) return false;

  const ingredient = INGREDIENTS[color];
  if (!ingredient || !ingredient.buyable) return false;
  if (!ingredient.values.includes(value)) return false;

  const discount = game.roundModifiers.discount || 0;
  const cost = getIngredientCost(color, value, discount);
  if (player.dollars < cost) return false;

  player.dollars -= cost;
  player.bag.push({ color, value });
  player.boughtThisRound.push(color);

  game.log.push(`${player.name}: bought ${ingredient.name} (${value}) for $${cost}.`);
  return true;
}

// Undo a purchase (remove from bag, refund dollars)
export function unbuyIngredient(game, playerId, color) {
  const player = game.players[playerId];
  if (!player || game.phase !== PHASES.MARKET) return false;

  const idx = player.boughtThisRound.indexOf(color);
  if (idx === -1) return false;

  // Find the chip in the bag and remove it
  const bagIdx = player.bag.findIndex(c => c.color === color && player.boughtThisRound.includes(color));
  if (bagIdx === -1) return false;

  const chip = player.bag[bagIdx];
  const discount = game.roundModifiers.discount || 0;
  const cost = getIngredientCost(color, chip.value, discount);

  player.bag.splice(bagIdx, 1);
  player.boughtThisRound.splice(idx, 1);
  player.dollars += cost;

  const ingredient = INGREDIENTS[color];
  game.log.push(`${player.name}: returned ${ingredient.name} (+$${cost}).`);
  return true;
}

// Player finishes buying
export function finishBuying(game, playerId) {
  const player = game.players[playerId];
  if (!player) return;
  player._doneBuying = true;

  // Check if all players are done buying
  const allDone = game.playerOrder.every(pid => game.players[pid]._doneBuying);
  if (allDone) {
    cleanupRound(game);
  }
}

// ---- Cleanup ----

function cleanupRound(game) {
  game.phase = PHASES.CLEANUP;

  for (const pid of game.playerOrder) {
    const player = game.players[pid];

    // Return all chips from pot to bag
    player.bag.push(...player.pot.map(c => ({ color: c.color, value: c.value })));
    player.pot = [];

    // Auto-spend copper to advance flame
    // Players can choose, but for simplicity we'll make this automatic
    // They can do it manually via the UI

    // Reset round state
    player.whiteTotal = 0;
    player.blownOut = false;
    player.stopped = false;
    player.boughtThisRound = [];
    player.chipCount = 0;
    player._doneBuying = false;
    player._blowoutChosen = false;
    player._needsBlowoutChoice = false;
    player._blowoutEarnedDollars = 0;
    player._blowoutEarnedRep = 0;
    player._skipMarket = false;
    player._distillSent = false;
    player._mulliganUsed = false;
  }

  // Next round
  game.round++;
  if (game.round <= TOTAL_ROUNDS) {
    // Shuffle bags for the new round (deterministic)
    shuffleAllBags(game);
    startRound(game);
  } else {
    game.phase = PHASES.ENDGAME;
  }
}

// Spend copper to advance flame
export function spendCopper(game, playerId) {
  const player = game.players[playerId];
  if (!player || player.copper < 2) return false;

  player.copper -= 2;
  player.flameStart = Math.min(TRACK_MAX, player.flameStart + 1);
  game.log.push(`${player.name}: upgraded still — flame now at ${player.flameStart}.`);
  return true;
}

// Buy Mulligan (Rabbit's Foot) at market — costs 2 copper, grants undo ability
export function buyMulligan(game, playerId) {
  const player = game.players[playerId];
  if (!player || game.phase !== PHASES.MARKET) return false;
  if (player.copper < 2) return false;
  if (player.hasMulligan) return false; // already has one

  player.copper -= 2;
  player.hasMulligan = true;
  game.log.push(`${player.name}: bought a Rabbit's Foot (Mulligan) for 2 copper.`);
  return true;
}

// Use Mulligan during brew — undo last draw, reshuffle bag, once per round
export function useMulligan(game, playerId) {
  const player = game.players[playerId];
  if (!player || game.phase !== PHASES.DISTILL) return null;
  if (!player.hasMulligan || player._mulliganUsed) return null;
  if (player.pot.length === 0) return null;
  if (player.stopped || player.blownOut) return null;

  player._mulliganUsed = true;
  player.hasMulligan = false;

  // Remove the last chip from pot and put it back in the bag
  const undoneChip = player.pot.pop();
  player.bag.push(undoneChip);

  // Reshuffle the bag (only the remaining undrawn chips + returned chip)
  // Use a deterministic seed unique to this mulligan event
  const mulliganSeed = deriveSeed(game.seed, hashString(playerId), game.round, 0x40071694);
  const mRng = createRng(mulliganSeed);
  mRng.shuffle(player.bag);

  // Recalculate white total from remaining pot
  let whiteTotal = 0;
  for (const chip of player.pot) {
    if (chip.color === 'white') {
      if (game.roundModifiers.white1Safe && chip.value === 1) continue;
      whiteTotal += chip.value;
    }
  }
  player.whiteTotal = whiteTotal;

  // Un-blow-out (mulligan can save you from a blowout)
  player.blownOut = false;

  // Recalculate position from scratch by replaying pot
  let position = player.flameStart;
  for (let i = 0; i < player.pot.length; i++) {
    const chip = player.pot[i];
    let movement = chip.value;
    const chipIdx = i + 1;

    if (game.roundModifiers.firstChipDouble && chipIdx === 1) {
      movement *= 2;
    }
    if (game.roundModifiers.bonusMovement && chip.color !== 'white') {
      movement += game.roundModifiers.bonusMovement;
    }
    if (game.roundModifiers.cornBonus && chip.color === 'orange') {
      movement += game.roundModifiers.cornBonus;
    }
    if (chip.color === 'red') {
      movement += player.pot.slice(0, i).filter(c => c.color === 'orange').length;
    }
    if (chip.color === 'yellow') {
      movement += player.pot.slice(0, i).filter(c => c.color === 'yellow').length;
    }

    position += movement;
  }
  player.position = Math.min(TRACK_MAX, position);

  const chipName = INGREDIENTS[undoneChip.color]?.name || undoneChip.color;
  game.log.push(`${player.name}: used Mulligan — returned ${chipName} ${undoneChip.value} to stash and reshuffled.`);
  return undoneChip;
}

// ---- Blowout Choice ----

export function blowoutChoice(game, playerId, choice) {
  const player = game.players[playerId];
  if (!player || !player.blownOut || !player._needsBlowoutChoice) return;

  const earnedDollars = player._blowoutEarnedDollars || 0;
  const earnedRep = player._blowoutEarnedRep || 0;

  player._needsBlowoutChoice = false;

  if (choice === 'dollars') {
    player.dollars += earnedDollars;
    game.log.push(`${player.name}: chose dollars ($${earnedDollars}).`);
  } else {
    // reputation — give rep and skip market
    player.reputation += earnedRep;
    player._skipMarket = true;
    player._doneBuying = true;
    game.log.push(`${player.name}: chose reputation (${earnedRep}), skipping market.`);

    // Check if all players are done buying now
    const allDone = game.playerOrder.every(pid => game.players[pid]._doneBuying);
    if (allDone) {
      cleanupRound(game);
    }
  }
}

// ---- Queries ----

export function getWinner(game) {
  if (game.phase !== PHASES.ENDGAME) return null;

  let best = null;
  for (const pid of game.playerOrder) {
    const p = game.players[pid];
    if (!best ||
        p.reputation > best.reputation ||
        (p.reputation === best.reputation && p.position > best.position)) {
      best = p;
    }
  }
  return best;
}

export function getPlayerState(game, playerId) {
  return game.players[playerId] || null;
}

export function getLeaderboard(game) {
  return game.playerOrder
    .map(pid => {
      const p = game.players[pid];
      return {
        id: p.id,
        name: p.name,
        reputation: p.reputation,
        dollars: p.dollars,
        copper: p.copper,
        position: p.position,
        whiteTotal: p.whiteTotal,
        blownOut: p.blownOut,
        stopped: p.stopped,
        flameStart: p.flameStart,
        bagSize: p.bag.length,
      };
    })
    .sort((a, b) => b.reputation - a.reputation || b.position - a.position);
}

// Generate a state hash for desync detection
export function computeStateHash(game) {
  const data = JSON.stringify({
    round: game.round,
    phase: game.phase,
    players: game.playerOrder.map(pid => {
      const p = game.players[pid];
      return {
        id: p.id, pos: p.position, rep: p.reputation,
        dol: p.dollars, cop: p.copper, wt: p.whiteTotal,
        flame: p.flameStart, bagLen: p.bag.length,
      };
    }),
  });
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) - hash + data.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}
