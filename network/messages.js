// Message type constants for P2P networking

export const MSG = {
  // Connection
  HELLO: 'HELLO',
  WELCOME: 'WELCOME',
  PLAYER_JOIN: 'PLAYER_JOIN',
  PLAYER_LEAVE: 'PLAYER_LEAVE',

  // Gameplay
  ACTION_SUBMIT: 'ACTION_SUBMIT',
  ACTION: 'ACTION',
  PHASE_CHANGE: 'PHASE_CHANGE',
  GAME_START: 'GAME_START',

  // Chat
  CHAT: 'CHAT',

  // Sync
  STATE_HASH: 'STATE_HASH',
  STATE_SNAPSHOT: 'STATE_SNAPSHOT',
};

// Action types
export const ACTIONS = {
  DRAW: 'DRAW',
  STOP: 'STOP',
  BUY: 'BUY',
  UNBUY: 'UNBUY',
  DONE_BUYING: 'DONE_BUYING',
  BLOWOUT_CHOICE: 'BLOWOUT_CHOICE',
  SPEND_COPPER: 'SPEND_COPPER',
};

// Create a message object
export function createMsg(type, payload = {}) {
  return { type, payload, timestamp: Date.now() };
}
