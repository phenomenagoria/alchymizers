import { MSG, createMsg } from './messages.js';

// PeerJS networking module
// Star topology: all clients connect to host, host relays

export function createNetworkManager(callbacks) {
  let peer = null;
  let connections = new Map(); // peerId -> DataConnection
  let isHost = false;
  let hostConnection = null;  // client's connection to host
  let myPeerId = null;
  let actionSeq = 0;

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

  // Host: Create a room
  function createRoom() {
    return new Promise((resolve, reject) => {
      isHost = true;
      peer = new Peer();

      peer.on('open', (id) => {
        myPeerId = id;
        setStatus('Room created. Waiting for players...');
        setupHostListeners();
        resolve(id);
      });

      peer.on('error', (err) => {
        setStatus(`Error: ${err.message}`);
        if (onError) onError(err);
        reject(err);
      });
    });
  }

  function setupHostListeners() {
    peer.on('connection', (conn) => {
      conn.on('open', () => {
        // Wait for HELLO message
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
        // Assign sequence number and broadcast
        const action = createMsg(MSG.ACTION, {
          seq: ++actionSeq,
          playerId: msg.payload.playerId,
          action: msg.payload.action,
          data: msg.payload.data,
        });
        broadcast(action);
        // Also apply locally (host is a player too)
        if (onAction) onAction(action.payload);
        break;
      }

      case MSG.CHAT: {
        broadcast(msg);
        if (onChat) onChat(msg.payload.playerName, msg.payload.message);
        break;
      }

      case MSG.STATE_HASH: {
        // Could compare hashes here
        break;
      }
    }
  }

  // Client: Join a room
  function joinRoom(hostId, playerName) {
    return new Promise((resolve, reject) => {
      isHost = false;
      peer = new Peer();

      peer.on('open', (id) => {
        myPeerId = id;
        setStatus('Connecting to host...');

        hostConnection = peer.connect(hostId, { reliable: true });

        hostConnection.on('open', () => {
          hostConnection.send(createMsg(MSG.HELLO, {
            name: playerName,
          }));
          setStatus('Connected! Waiting for welcome...');
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
        setStatus(`Error: ${err.message}`);
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
        // Handled through actions
        break;
    }
  }

  // Broadcast a message to all connected peers
  function broadcast(msg, excludePeerId) {
    for (const [peerId, conn] of connections) {
      if (peerId !== excludePeerId) {
        try { conn.send(msg); } catch (e) { /* ignore dead connections */ }
      }
    }
  }

  // Send an action (client → host, or host processes directly)
  function sendAction(playerId, action, data = {}) {
    const msg = createMsg(MSG.ACTION_SUBMIT, { playerId, action, data });

    if (isHost) {
      // Host processes it directly
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

  // Send chat message
  function sendChat(playerName, message) {
    const msg = createMsg(MSG.CHAT, { playerName, message });

    if (isHost) {
      broadcast(msg);
      if (onChat) onChat(playerName, message);
    } else {
      hostConnection?.send(msg);
    }
  }

  // Host: Start the game
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

  function getMyPeerId() { return myPeerId; }
  function getIsHost() { return isHost; }
  function getConnectionCount() { return connections.size; }

  function destroy() {
    if (peer) peer.destroy();
    connections.clear();
    hostConnection = null;
  }

  return {
    createRoom,
    joinRoom,
    sendAction,
    sendChat,
    startGame,
    getMyPeerId,
    getIsHost,
    getConnectionCount,
    getPlayerList,
    destroy,
  };
}
