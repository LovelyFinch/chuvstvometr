/**
 * Конфигурация фронтенда Чувствометра.
 * Перед деплоем обновить WS_URL и API_URL на production значения.
 */
const CONFIG = {
  // WebSocket URL бэкенда (ws:// для HTTP, wss:// для HTTPS)
  WS_URL: 'ws://64.188.89.59:45027/ws',

  // REST API URL бэкенда
  API_URL: 'http://64.188.89.59:45027',

  // Интервал polling в мс (fallback при недоступности WebSocket)
  POLLING_INTERVAL: 10000,

  // Максимальная задержка reconnect в мс
  RECONNECT_MAX_DELAY: 30000,

  // Длительность анимации стрелки в мс
  ANIMATION_DURATION: 800,

  // Уровни чувств (должны совпадать с бэкендом)
  LEVELS: [
    { level: 1, color: 'серый',       hex: '#9E9E9E' },
    { level: 2, color: 'белый',       hex: '#F5F5F5' },
    { level: 3, color: 'жёлтый',     hex: '#FFEB3B' },
    { level: 4, color: 'оранжевый',  hex: '#FF9800' },
    { level: 5, color: 'красный',    hex: '#F44336' },
    { level: 6, color: 'малиновый',  hex: '#E91E63' },
    { level: 7, color: 'клубничный', hex: '#FF1744' },
  ],
};
