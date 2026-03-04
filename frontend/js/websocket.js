/**
 * WebSocketClient — клиент WebSocket с автоматическим переподключением
 * и fallback на HTTP polling.
 */
class WebSocketClient {
  /**
   * @param {string} wsUrl - WebSocket URL
   * @param {string} apiUrl - REST API URL (для polling fallback)
   * @param {Function} onMessage - callback при получении данных (data)
   * @param {Function} onStatusChange - callback при изменении статуса (status)
   */
  constructor(wsUrl, apiUrl, onMessage, onStatusChange) {
    this.wsUrl = wsUrl;
    this.apiUrl = apiUrl;
    this.onMessage = onMessage;
    this.onStatusChange = onStatusChange;

    this.ws = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.maxReconnectDelay = CONFIG.RECONNECT_MAX_DELAY;
    this.reconnectTimer = null;
    this.pollingTimer = null;
    this.isPolling = false;
    this.isConnected = false;
    this.isClosed = false;
  }

  /**
   * Устанавливает WebSocket соединение.
   */
  connect() {
    if (this.isClosed) return;

    this._setStatus('connecting');

    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('[WS] Connected to', this.wsUrl);
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this._stopPolling();
        this._setStatus('connected');
      };

      this.ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === 'state' || message.type === 'update') {
            this.onMessage(message.data);
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      this.ws.onclose = (event) => {
        console.log(`[WS] Connection closed (code: ${event.code})`);
        this.isConnected = false;
        this._setStatus('disconnected');

        if (!this.isClosed) {
          this._reconnect();
        }
      };

      this.ws.onerror = (err) => {
        console.error('[WS] Error:', err);
        this.isConnected = false;
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
      this._reconnect();
    }
  }

  /**
   * Закрывает соединение и останавливает все таймеры.
   */
  disconnect() {
    this.isClosed = true;
    this._stopPolling();

    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  /**
   * Автоматическое переподключение с экспоненциальной задержкой.
   */
  _reconnect() {
    if (this.isClosed) return;

    this.reconnectAttempts++;

    if (this.reconnectAttempts > this.maxReconnectAttempts) {
      console.warn('[WS] Max reconnect attempts reached, switching to HTTP polling');
      this._startPolling();
      return;
    }

    const delay = Math.min(this.reconnectDelay, this.maxReconnectDelay);
    console.log(`[WS] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this._setStatus('reconnecting');

    this.reconnectTimer = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 2, this.maxReconnectDelay);
      this.connect();
    }, delay);
  }

  /**
   * Запускает HTTP polling как fallback.
   */
  _startPolling() {
    if (this.isPolling) return;

    console.log('[WS] Starting HTTP polling fallback');
    this.isPolling = true;
    this._setStatus('polling');

    // Immediate first poll
    this._poll();

    this.pollingTimer = setInterval(() => {
      this._poll();

      // Periodically try to restore WebSocket
      if (this.reconnectAttempts > this.maxReconnectAttempts) {
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.connect();
      }
    }, CONFIG.POLLING_INTERVAL);
  }

  /**
   * Останавливает HTTP polling.
   */
  _stopPolling() {
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
      this.pollingTimer = null;
    }
    this.isPolling = false;
  }

  /**
   * Выполняет один HTTP запрос для получения текущего уровня.
   */
  async _poll() {
    try {
      const response = await fetch(`${this.apiUrl}/api/level`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      const data = await response.json();
      this.onMessage(data);
    } catch (err) {
      console.error('[WS] Polling error:', err);
      this._setStatus('error');
    }
  }

  /**
   * Обновляет статус соединения.
   * @param {string} status - 'connecting' | 'connected' | 'reconnecting' | 'polling' | 'disconnected' | 'error'
   */
  _setStatus(status) {
    this.onStatusChange(status);
  }
}
