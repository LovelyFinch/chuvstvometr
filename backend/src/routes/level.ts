// Express routes for level management
import { Router, Request, Response } from 'express';
import { readState, writeState } from '../services/storage';
import { broadcastUpdate } from '../services/websocket';
import { getLevelInfo, isValidLevel, LEVELS } from '../constants';
import { requireApiKey } from '../middleware/auth';
import { readLimiter, writeLimiter } from '../middleware/rateLimit';
import { LevelState } from '../types/index';
import { log } from '../config';

export const levelRouter = Router();

// GET /api/level — get current level
levelRouter.get('/level', readLimiter, (_req: Request, res: Response) => {
  try {
    const state = readState();
    const levelInfo = getLevelInfo(state.level);

    if (!levelInfo) {
      res.status(500).json({ error: 'Invalid state: unknown level' });
      return;
    }

    res.json({
      level: state.level,
      color: levelInfo.color,
      hex: levelInfo.hex,
      updatedAt: state.updatedAt,
      updatedBy: state.updatedBy,
    });
  } catch (err) {
    log('error', 'GET /api/level error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/level — set new level (requires API key)
levelRouter.post('/level', writeLimiter, requireApiKey, (req: Request, res: Response) => {
  try {
    const { level, source } = req.body as { level: unknown; source?: string };

    if (typeof level !== 'number' || !isValidLevel(level)) {
      res.status(400).json({ error: 'Invalid level. Must be an integer between 1 and 7.' });
      return;
    }

    const newState: LevelState = {
      level,
      updatedAt: new Date().toISOString(),
      updatedBy: source ?? 'api',
    };

    writeState(newState);

    const levelInfo = getLevelInfo(level)!;

    // Broadcast to all WebSocket clients
    broadcastUpdate({
      level,
      color: levelInfo.color,
      hex: levelInfo.hex,
      updatedAt: newState.updatedAt,
    });

    log('info', `Level updated to ${level} (${levelInfo.color}) by ${newState.updatedBy}`);

    res.json({
      level,
      color: levelInfo.color,
      hex: levelInfo.hex,
      updatedAt: newState.updatedAt,
      updatedBy: newState.updatedBy,
    });
  } catch (err) {
    log('error', 'POST /api/level error', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/levels — get all available levels
levelRouter.get('/levels', readLimiter, (_req: Request, res: Response) => {
  res.json({ levels: LEVELS });
});

// GET /api/health — health check
levelRouter.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', uptime: process.uptime() });
});
