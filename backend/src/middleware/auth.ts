// API key authentication middleware
import { Request, Response, NextFunction } from 'express';
import { config, log } from '../config';

export function requireApiKey(req: Request, res: Response, next: NextFunction): void {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey || apiKey !== config.apiKey) {
    log('warn', `Unauthorized request from ${req.ip}: invalid or missing API key`);
    res.status(401).json({ error: 'Invalid or missing API key.' });
    return;
  }

  next();
}
