// Constants for Chuvstvometr - feelings levels with colors
import { LevelInfo } from './types/index';

export const LEVELS: LevelInfo[] = [
  { level: 1, color: 'синий',       hex: '#2196F3' },
  { level: 2, color: 'зелёный',     hex: '#4CAF50' },
  { level: 3, color: 'жёлтый',     hex: '#FFEB3B' },
  { level: 4, color: 'оранжевый',  hex: '#FF9800' },
  { level: 5, color: 'красный',    hex: '#F44336' },
  { level: 6, color: 'малиновый',  hex: '#E91E63' },
  { level: 7, color: 'клубничный', hex: '#FF1744' },
];

export const MIN_LEVEL = 1;
export const MAX_LEVEL = 7;

export function getLevelInfo(level: number): LevelInfo | undefined {
  return LEVELS.find((l) => l.level === level);
}

export function isValidLevel(level: number): boolean {
  return Number.isInteger(level) && level >= MIN_LEVEL && level <= MAX_LEVEL;
}
