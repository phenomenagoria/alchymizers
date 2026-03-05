// Game rules, constants, track layout, ingredient definitions, holler cards

export const TOTAL_ROUNDS = 9;
export const BLOWOUT_THRESHOLD = 7;
export const MAX_BUYS_PER_ROUND = 2;
export const COPPER_PER_FLAME = 2; // copper bits to advance flame by 1

// Spiral track (copper coil) - each space has coins, VP, and optional special
export const TRACK = [
  { pos: 0,  coins: 0,  vp: 0 },
  { pos: 1,  coins: 0,  vp: 0 },
  { pos: 2,  coins: 1,  vp: 0, special: 'copper', copperValue: 1 },
  { pos: 3,  coins: 1,  vp: 0, special: 'copper', copperValue: 1 },
  { pos: 4,  coins: 2,  vp: 0 },
  { pos: 5,  coins: 2,  vp: 1, special: 'copper', copperValue: 1 },
  { pos: 6,  coins: 2,  vp: 1 },
  { pos: 7,  coins: 3,  vp: 1, special: 'copper', copperValue: 1 },
  { pos: 8,  coins: 3,  vp: 2 },
  { pos: 9,  coins: 3,  vp: 2 },
  { pos: 10, coins: 4,  vp: 2 },
  { pos: 11, coins: 4,  vp: 3, special: 'copper', copperValue: 1 },
  { pos: 12, coins: 5,  vp: 3 },
  { pos: 13, coins: 5,  vp: 3, special: 'copper', copperValue: 1 },
  { pos: 14, coins: 5,  vp: 4, special: 'flame' },
  { pos: 15, coins: 6,  vp: 4 },
  { pos: 16, coins: 6,  vp: 4 },
  { pos: 17, coins: 7,  vp: 5, special: 'copper', copperValue: 2 },
  { pos: 18, coins: 7,  vp: 5 },
  { pos: 19, coins: 8,  vp: 6, special: 'copper', copperValue: 2 },
  { pos: 20, coins: 8,  vp: 6, special: 'flame' },
  { pos: 21, coins: 9,  vp: 7 },
  { pos: 22, coins: 10, vp: 7 },
  { pos: 23, coins: 10, vp: 8, special: 'copper', copperValue: 2 },
  { pos: 24, coins: 11, vp: 9 },
  { pos: 25, coins: 12, vp: 9 },
  { pos: 26, coins: 13, vp: 10 },
  { pos: 27, coins: 14, vp: 11 },
  { pos: 28, coins: 15, vp: 12, special: 'flame' },
  { pos: 29, coins: 16, vp: 13, special: 'copper', copperValue: 2 },
  { pos: 30, coins: 18, vp: 14 },
  { pos: 31, coins: 20, vp: 15, special: 'copper', copperValue: 2 },
  { pos: 32, coins: 22, vp: 17 },
  { pos: 33, coins: 25, vp: 20 },
];

export const TRACK_MAX = TRACK.length - 1;

// Ingredient color definitions
export const INGREDIENTS = {
  white: {
    name: 'Bad Mash',
    icon: '🫧',
    description: 'Spoiled mash. Too much causes a blowout!',
    values: [1, 2, 3],
    buyable: false,
  },
  orange: {
    name: 'Corn',
    icon: '🌽',
    description: 'Reliable base ingredient. No special ability.',
    values: [1],
    costs: { 1: 3 },
    buyable: true,
  },
  green: {
    name: 'Juniper',
    icon: '🌿',
    description: 'If last or second-last chip is Juniper, gain 1 copper.',
    values: [1, 2, 4],
    costs: { 1: 4, 2: 8, 4: 14 },
    buyable: true,
  },
  red: {
    name: 'Charcoal',
    icon: '♨️',
    description: 'Move extra spaces equal to corn chips already placed.',
    values: [1, 2, 4],
    costs: { 1: 6, 2: 10, 4: 16 },
    buyable: true,
  },
  blue: {
    name: 'Copper Coil',
    icon: '🔵',
    description: 'Draw 1 more chip. If Bad Mash, return it; otherwise place it.',
    values: [1, 2, 4],
    costs: { 1: 5, 2: 10, 4: 19 },
    buyable: true,
  },
  yellow: {
    name: 'Sugar',
    icon: '🍬',
    description: 'Move 1 extra space per Sugar already placed.',
    values: [1, 2, 4],
    costs: { 1: 8, 2: 12, 4: 18 },
    buyable: true,
  },
  purple: {
    name: 'Ghost Pepper',
    icon: '🌶️',
    description: 'End-of-round bonus: 1=1VP, 2=1copper, 3=2VP.',
    values: [1],
    costs: { 1: 9 },
    buyable: true,
  },
};

// Color display mapping
export const COLOR_HEX = {
  white:  '#e8e5dc',
  orange: '#f4a442',
  green:  '#2c6b2f',
  red:    '#8b2a2a',
  blue:   '#2d3a63',
  yellow: '#f4c542',
  purple: '#7b3f8d',
};

// Starting bag for each player
export function createStartingBag() {
  const bag = [];
  // 4x White value 1
  for (let i = 0; i < 4; i++) bag.push({ color: 'white', value: 1 });
  // 2x White value 2
  for (let i = 0; i < 2; i++) bag.push({ color: 'white', value: 2 });
  // 1x White value 3
  bag.push({ color: 'white', value: 3 });
  // 2x Orange value 1
  for (let i = 0; i < 2; i++) bag.push({ color: 'orange', value: 1 });
  return bag; // 9 chips total
}

// Holler cards (fortune events)
export const HOLLER_CARDS = [
  {
    id: 1,
    name: "Cold Mountain Spring",
    desc: "Pure spring water flows down the ridge.",
    mechanicalDesc: "All players gain 1 copper.",
    effect: 'ALL_GAIN_COPPER',
    value: 1,
  },
  {
    id: 2,
    name: "Bootleg Demand",
    desc: "The town dance is tonight — extra cash for your batch!",
    mechanicalDesc: "All players earn +$3 bonus dollars this round.",
    effect: 'BONUS_DOLLARS',
    value: 3,
  },
  {
    id: 3,
    name: "Lucky Stars",
    desc: "The stars align for a smooth run.",
    mechanicalDesc: "Your first ingredient drawn this round moves double spaces.",
    effect: 'FIRST_CHIP_DOUBLE',
    value: 0,
  },
  {
    id: 4,
    name: "Harvest Moon",
    desc: "A bountiful harvest makes everything flow easier.",
    mechanicalDesc: "All non-white ingredients move +1 extra space this round.",
    effect: 'BONUS_MOVEMENT',
    value: 1,
  },
  {
    id: 5,
    name: "Old Maggie's Visit",
    desc: "Old Maggie drops off some spare corn.",
    mechanicalDesc: "A free Corn (value 1) is added to every player's stash.",
    effect: 'FREE_ORANGE',
    value: 0,
  },
  {
    id: 6,
    name: "Still Maintenance",
    desc: "Time to tune up the equipment.",
    mechanicalDesc: "All players' flame start position advances by 1.",
    effect: 'ADVANCE_FLAME',
    value: 1,
  },
  {
    id: 7,
    name: "Sheriff's Patrol",
    desc: "The sheriff is riding through the valley tonight.",
    mechanicalDesc: "Blowout threshold reduced by 1 this round (6 instead of 7).",
    effect: 'LOWER_THRESHOLD',
    value: 1,
  },
  {
    id: 8,
    name: "Copper Vein",
    desc: "Found a vein of copper ore in the hills!",
    mechanicalDesc: "All players gain 2 copper.",
    effect: 'ALL_GAIN_COPPER',
    value: 2,
  },
  {
    id: 9,
    name: "Moonshine Festival",
    desc: "The annual festival — everyone wants a taste.",
    mechanicalDesc: "All reputation earned this round is doubled.",
    effect: 'DOUBLE_REPUTATION',
    value: 0,
  },
  {
    id: 10,
    name: "Tax Collector",
    desc: "The tax man cometh.",
    mechanicalDesc: "All players lose $2.",
    effect: 'PAY_DOLLARS',
    value: 2,
  },
  {
    id: 11,
    name: "Cold Snap",
    desc: "A bitter cold settles over the holler.",
    mechanicalDesc: "Bad Mash with value 1 does not count toward blowout this round.",
    effect: 'WHITE_1_SAFE',
    value: 0,
  },
  {
    id: 12,
    name: "Stranger in Town",
    desc: "A mysterious stranger admires your craft.",
    mechanicalDesc: "All players gain 1 reputation.",
    effect: 'ALL_GAIN_REP',
    value: 1,
  },
  {
    id: 13,
    name: "Market Day",
    desc: "Traders arrive with discounted goods.",
    mechanicalDesc: "All market prices reduced by $2 this round (minimum $1).",
    effect: 'DISCOUNT',
    value: 2,
  },
  {
    id: 14,
    name: "Thunder & Lightning",
    desc: "A storm rages — blowouts are extra costly.",
    mechanicalDesc: "Players who blow out lose 2 reputation as a penalty.",
    effect: 'BLOWOUT_PENALTY',
    value: 2,
  },
  {
    id: 15,
    name: "Good Corn Crop",
    desc: "This year's corn is exceptional quality.",
    mechanicalDesc: "Corn ingredients move +1 extra space this round.",
    effect: 'CORN_BONUS',
    value: 1,
  },
  {
    id: 16,
    name: "Supply Shortage",
    desc: "Roads are washed out — limited supplies.",
    mechanicalDesc: "Market limited to 1 purchase this round instead of 2.",
    effect: 'BUY_LIMIT',
    value: 1,
  },
  {
    id: 17,
    name: "Neighborly Help",
    desc: "Your neighbor lends a hand with the still.",
    mechanicalDesc: "All players earn +$2 bonus dollars this round.",
    effect: 'BONUS_DOLLARS',
    value: 2,
  },
  {
    id: 18,
    name: "Full Moon Rising",
    desc: "The full moon brings good fortune.",
    mechanicalDesc: "All players gain 1 reputation.",
    effect: 'ALL_GAIN_REP',
    value: 1,
  },
];

// Get ingredient cost with optional discount
export function getIngredientCost(color, value, discount = 0) {
  const ingredient = INGREDIENTS[color];
  if (!ingredient || !ingredient.costs) return Infinity;
  const baseCost = ingredient.costs[value];
  if (baseCost === undefined) return Infinity;
  return Math.max(1, baseCost - discount);
}

// Get available ingredient shop items
export function getShopItems(discount = 0) {
  const items = [];
  for (const [color, info] of Object.entries(INGREDIENTS)) {
    if (!info.buyable) continue;
    for (const value of info.values) {
      items.push({
        color,
        value,
        name: info.name,
        icon: info.icon,
        cost: getIngredientCost(color, value, discount),
      });
    }
  }
  return items;
}
