// Storage service for reading/writing state to JSON file
import fs from 'fs';
import path from 'path';
import { LevelState } from '../types/index';
import { config, log } from '../config';

const DEFAULT_STATE: LevelState = {
  level: 1,
  updatedAt: new Date().toISOString(),
  updatedBy: 'manual',
};

export function readState(): LevelState {
  try {
    const filePath = path.resolve(config.stateFile);
    if (!fs.existsSync(filePath)) {
      log('warn', `State file not found at ${filePath}, using default state`);
      return { ...DEFAULT_STATE };
    }
    const raw = fs.readFileSync(filePath, 'utf-8');
    const state = JSON.parse(raw) as LevelState;
    log('debug', `State read: level=${state.level}`);
    return state;
  } catch (err) {
    log('error', 'Failed to read state file, using default', err);
    return { ...DEFAULT_STATE };
  }
}

export function writeState(state: LevelState): void {
  try {
    const filePath = path.resolve(config.stateFile);
    const dir = path.dirname(filePath);

    // Ensure directory exists
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(filePath, JSON.stringify(state, null, 2), 'utf-8');
    log('debug', `State written: level=${state.level}`);
  } catch (err) {
    log('error', 'Failed to write state file', err);
    throw new Error('Failed to persist state');
  }
}
