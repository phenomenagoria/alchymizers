import { MSG, createMsg } from './messages.js';

// PeerJS networking module
// Star topology: host uses deterministic peer ID from room code
// Clients connect using the same room code — no need to share long IDs

const PEER_PREFIX = 'alchymizers-';

export function createNetworkManager(callbacks) {
  let peer = null;
  let connections = new Map(); // peerId -> DataConnection
  let isHost = false;
  let hostConnection = null;  // client's connection to host
  let myPeerId = null;
  let actionSeq = 0;
  let roomCode = null;

  const {
    onConnected,
    onPlayerJoin,
    onPlayerLeave,
    onAction,
    onGameStart,
    onChat,
    onSnapshot,
    onError,
    onStatusChange,
  } = callbacks;

  function setStatus(msg) {
    if (onStatusChange) onStatusChange(msg);
  }

  function peerIdFromCode(code) {
    return PEER_PREFIX + code.toLowerCase();
  }

  // Host: Create a room with a deterministic peer ID
  function createRoom(code) {
    return new Promise((resolve, reject) => {
      isHost = true;
      roomCode = code;
      const deterministicId = peerIdFromCode(code);

      peer = new Peer(deterministicId);

      peer.on('open', (id) => {
        myPeerId = id;
        setStatus('Room created. Share the code with friends!');
        setupHostListeners();
        resolve(code);
      });

      peer.on('error', (err) => {
        if (err.type === 'unavailable-id') {
          setStatus('Room code already in use. Try another.');
        } else {
          setStatus(`Error: ${err.message}`);
        }
        if (onError) onError(err);
        reject(err);
      });
    });
  }

  function setupHostListeners() {
    peer.on('connection', (conn) => {
      conn.on('open', () => {
        conn.on('data', (msg) => handleHostMessage(conn, msg));
      });

      conn.on('close', () => {
        const pid = conn.metadata?.playerId;
        if (pid) {
          connections.delete(conn.peer);
          if (onPlayerLeave) onPlayerLeave(pid);
          broadcast(createMsg(MSG.PLAYER_LEAVE, { playerId: pid }));
        }
      });
    });
  }

  function handleHostMessage(conn, msg) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case MSG.HELLO: {
        const playerId = `player_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
        conn.metadata = { playerId, name: msg.payload.name };
        connections.set(conn.peer, conn);

        // Send welcome
        conn.send(createMsg(MSG.WELCOME, {
          playerId,
          playerList: getPlayerList(),
        }));

        // Notify others
        broadcast(createMsg(MSG.PLAYER_JOIN, {
          playerId,
          name: msg.payload.name,
        }), conn.peer);

        if (onPlayerJoin) onPlayerJoin(playerId, msg.payload.name);
        break;
      }

      case MSG.ACTION_SUBMIT: {
        const action = createMsg(MSG.ACTION, {
          seq: ++actionSeq,
          playerId: msg.payload.playerId,
          action: msg.payload.action,
          data: msg.payload.data,
        });
        broadcast(action);
        if (onAction) onAction(action.payload);
        break;
      }

      case MSG.CHAT: {
        broadcast(msg);
        if (onChat) onChat(msg.payload.playerName, msg.payload.message);
        break;
      }

      case MSG.STATE_HASH: {
        break;
      }
    }
  }

  // Client: Join a room using the 6-char code
  function joinRoom(code, playerName) {
    return new Promise((resolve, reject) => {
      isHost = false;
      roomCode = code;
      const hostPeerId = peerIdFromCode(code);

      peer = new Peer();

      peer.on('open', (id) => {
        myPeerId = id;
        setStatus('Connecting to room...');

        hostConnection = peer.connect(hostPeerId, { reliable: true });

        hostConnection.on('open', () => {
          hostConnection.send(createMsg(MSG.HELLO, {
            name: playerName,
          }));
          setStatus('Connected! Waiting for host...');
        });

        hostConnection.on('data', (msg) => {
          handleClientMessage(msg, resolve);
        });

        hostConnection.on('close', () => {
          setStatus('Disconnected from host.');
          if (onError) onError(new Error('Disconnected'));
        });

        hostConnection.on('error', (err) => {
          setStatus(`Connection error: ${err.message}`);
          reject(err);
        });
      });

      peer.on('error', (err) => {
        if (err.type === 'peer-unavailable') {
          setStatus('Room not found. Check the code and try again.');
        } else {
          setStatus(`Error: ${err.message}`);
        }
        if (onError) onError(err);
        reject(err);
      });
    });
  }

  function handleClientMessage(msg, resolveJoin) {
    if (!msg || !msg.type) return;

    switch (msg.type) {
      case MSG.WELCOME:
        setStatus('Joined the room!');
        if (resolveJoin) resolveJoin(msg.payload);
        break;

      case MSG.PLAYER_JOIN:
        if (onPlayerJoin) onPlayerJoin(msg.payload.playerId, msg.payload.name);
        break;

      case MSG.PLAYER_LEAVE:
        if (onPlayerLeave) onPlayerLeave(msg.payload.playerId);
        break;

      case MSG.ACTION:
        if (onAction) onAction(msg.payload);
        break;

      case MSG.GAME_START:
        if (onGameStart) onGameStart(msg.payload);
        break;

      case MSG.CHAT:
        if (onChat) onChat(msg.payload.playerName, msg.payload.message);
        break;

      case MSG.STATE_SNAPSHOT:
        if (onSnapshot) onSnapshot(msg.payload);
        break;

      case MSG.PHASE_CHANGE:
        break;
    }
  }

  function broadcast(msg, excludePeerId) {
    for (const [peerId, conn] of connections) {
      if (peerId !== excludePeerId) {
        try { conn.send(msg); } catch (e) { /* ignore dead connections */ }
      }
    }
  }

  function sendAction(playerId, action, data = {}) {
    const msg = createMsg(MSG.ACTION_SUBMIT, { playerId, action, data });

    if (isHost) {
      const actionMsg = createMsg(MSG.ACTION, {
        seq: ++actionSeq,
        playerId,
        action,
        data,
      });
      broadcast(actionMsg);
      if (onAction) onAction(actionMsg.payload);
    } else {
      hostConnection?.send(msg);
    }
  }

  function sendChat(playerName, message) {
    const msg = createMsg(MSG.CHAT, { playerName, message });

    if (isHost) {
      broadcast(msg);
      if (onChat) onChat(playerName, message);
    } else {
      hostConnection?.send(msg);
    }
  }

  function startGame(gameData) {
    if (!isHost) return;
    const msg = createMsg(MSG.GAME_START, gameData);
    broadcast(msg);
    if (onGameStart) onGameStart(gameData);
  }

  function getPlayerList() {
    const list = [];
    for (const [, conn] of connections) {
      if (conn.metadata) {
        list.push({
          id: conn.metadata.playerId,
          name: conn.metadata.name,
        });
      }
    }
    return list;
  }

  function getRoomCode() { return roomCode; }
  function getMyPeerId() { return myPeerId; }
  function getIsHost() { return isHost; }
  function getConnectionCount() { return connections.size; }

  function destroy() {
    if (peer) peer.destroy();
    connections.clear();
    hostConnection = null;
    roomCode = null;
  }

  return {
    createRoom,
    joinRoom,
    sendAction,
    sendChat,
    startGame,
    getRoomCode,
    getMyPeerId,
    getIsHost,
    getConnectionCount,
    getPlayerList,
    destroy,
  };
}
