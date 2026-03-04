// Configuration loader for Chuvstvometr backend
import dotenv from 'dotenv';
import { AppConfig } from './types/index';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Required environment variable ${name} is not set`);
  }
  return value;
}

export const config: AppConfig = {
  port: parseInt(process.env['PORT'] ?? '3000', 10),
  apiKey: requireEnv('API_KEY'),
  corsOrigins: (process.env['CORS_ORIGINS'] ?? 'http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim()),
  stateFile: process.env['STATE_FILE'] ?? './data/state.json',
  logLevel: process.env['LOG_LEVEL'] ?? 'info',
  nodeEnv: process.env['NODE_ENV'] ?? 'development',
};

export function log(level: string, message: string, ...args: unknown[]): void {
  const levels = ['debug', 'info', 'warn', 'error'];
  const configLevel = levels.indexOf(config.logLevel);
  const messageLevel = levels.indexOf(level);

  if (messageLevel >= configLevel) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`, ...args);
  }
}
