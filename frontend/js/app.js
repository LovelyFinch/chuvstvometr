/**
 * app.js — точка входа Чувствометра.
 * Инициализирует спидометр и WebSocket соединение.
 */

// Status indicator configuration
const STATUS_CONFIG = {
  connected: { dot: '#4CAF50', text: 'Подключено' },
  connecting: { dot: '#FFC107', text: 'Подключение...' },
  reconnecting: { dot: '#FF9800', text: 'Переподключение...' },
  polling: { dot: '#FF9800', text: 'Режим обновления' },
  disconnected: { dot: '#F44336', text: 'Нет соединения' },
  error: { dot: '#F44336', text: 'Ошибка соединения' },
};

/**
 * Обновляет индикатор статуса соединения.
 * @param {string} status - статус соединения
 */
function updateConnectionStatus(status) {
  const statusDot = document.getElementById('status-dot');
  const statusText = document.getElementById('status-text');

  const config = STATUS_CONFIG[status] || STATUS_CONFIG.disconnected;

  if (statusDot) {
    statusDot.style.backgroundColor = config.dot;
  }
  if (statusText) {
    statusText.textContent = config.text;
  }

  // Hide needle when connection is lost
  if (status === 'disconnected' || status === 'error') {
    gauge.hideNeedle();
  }
}

/**
 * Обрабатывает входящие данные от WebSocket или polling.
 * @param {Object} data - данные уровня
 */
function handleLevelUpdate(data) {
  if (!data || typeof data.level !== 'number') {
    console.warn('[App] Invalid level data received:', data);
    return;
  }

  console.log(`[App] Level update: ${data.level} (${data.color})`);

  // Show needle when data is received from server
  gauge.showNeedle();
  gauge.setLevel(data.level);
  gauge.updateLabel(data.color, data.hex);
}

// Initialize gauge
const gauge = new GaugeRenderer('gauge-container');
gauge.render();

// Initialize WebSocket client
const wsClient = new WebSocketClient(
  CONFIG.WS_URL,
  CONFIG.API_URL,
  handleLevelUpdate,
  updateConnectionStatus
);

// Start connection
updateConnectionStatus('connecting');
wsClient.connect();

// Handle page visibility change (reconnect when tab becomes active)
document.addEventListener('visibilitychange', () => {
  if (!document.hidden && !wsClient.isConnected && !wsClient.isPolling) {
    console.log('[App] Page became visible, attempting reconnect');
    wsClient.reconnectAttempts = 0;
    wsClient.reconnectDelay = 1000;
    wsClient.connect();
  }
});
