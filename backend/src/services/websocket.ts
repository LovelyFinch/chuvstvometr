// WebSocket server service with broadcast and heartbeat
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage, Server } from 'http';
import { readState } from './storage';
import { getLevelInfo } from '../constants';
import { WebSocketMessage } from '../types/index';
import { log } from '../config';

let wss: WebSocketServer | null = null;

const HEARTBEAT_INTERVAL = 30000; // 30 seconds

export function initWebSocketServer(server: Server): void {
  wss = new WebSocketServer({ server, path: '/ws' });

  log('info', 'WebSocket server initialized on path /ws');

  wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
    const clientIp = req.socket.remoteAddress ?? 'unknown';
    log('info', `WebSocket client connected from ${clientIp}. Total clients: ${wss!.clients.size}`);

    // Send current state to newly connected client
    try {
      const state = readState();
      const levelInfo = getLevelInfo(state.level);

      if (levelInfo) {
        const message: WebSocketMessage = {
          type: 'state',
          data: {
            level: state.level,
            color: levelInfo.color,
            hex: levelInfo.hex,
            updatedAt: state.updatedAt,
          },
        };
        ws.send(JSON.stringify(message));
      }
    } catch (err) {
      log('error', 'Failed to send initial state to WebSocket client', err);
    }

    // Handle client disconnect
    ws.on('close', () => {
      log('info', `WebSocket client disconnected from ${clientIp}. Total clients: ${wss!.clients.size}`);
    });

    // Handle errors
    ws.on('error', (err) => {
      log('error', `WebSocket client error from ${clientIp}`, err);
    });

    // Ignore messages from clients (read-only WebSocket)
    ws.on('message', () => {
      log('debug', `Ignoring message from WebSocket client ${clientIp}`);
    });
  });

  // Heartbeat to keep connections alive and detect dead clients
  const heartbeatInterval = setInterval(() => {
    if (!wss) return;

    wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.ping();
      }
    });
  }, HEARTBEAT_INTERVAL);

  wss.on('close', () => {
    clearInterval(heartbeatInterval);
  });
}

export function broadcastUpdate(data: {
  level: number;
  color: string;
  hex: string;
  updatedAt: string;
}): void {
  if (!wss) {
    log('warn', 'WebSocket server not initialized, cannot broadcast');
    return;
  }

  const message: WebSocketMessage = {
    type: 'update',
    data,
  };

  const messageStr = JSON.stringify(message);
  let sentCount = 0;

  wss.clients.forEach((ws) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(messageStr);
      sentCount++;
    }
  });

  log('info', `Broadcast update (level=${data.level}) to ${sentCount} WebSocket clients`);
}

export function getConnectedClientsCount(): number {
  return wss?.clients.size ?? 0;
}
