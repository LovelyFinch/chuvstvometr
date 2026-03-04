// Types and interfaces for Chuvstvometr backend

export interface LevelState {
  level: number;       // 1-7, current feelings level
  updatedAt: string;   // ISO 8601 timestamp of last update
  updatedBy: string;   // source of change: api, telegram, manual
}

export interface LevelInfo {
  level: number;
  color: string;       // color name in Russian
  hex: string;         // HEX color code
}

export interface LevelResponse extends LevelInfo {
  updatedAt: string;
  updatedBy: string;
}

export interface SetLevelRequest {
  level: number;
  source?: string;
}

export interface WebSocketMessage {
  type: 'state' | 'update';
  data: {
    level: number;
    color: string;
    hex: string;
    updatedAt: string;
  };
}

export interface AppConfig {
  port: number;
  apiKey: string;
  corsOrigins: string[];
  stateFile: string;
  logLevel: string;
  nodeEnv: string;
}
