# Чувствометр — Спецификация фронтенда

## Обзор

Фронтенд представляет собой одностраничное приложение (SPA) на чистом HTML/CSS/JS без фреймворков. Главный элемент — SVG-спидометр с 7 цветными секторами и анимированной стрелкой.

## Визуальный дизайн

### Макет страницы

```
┌─────────────────────────────────────┐
│           🔥 Чувствометр 🔥          │  ← Заголовок
│                                     │
│         ╭───────────────╮           │
│        ╱   7 секторов    ╲          │
│       ╱  полукруг-дуга    ╲         │  ← SVG спидометр
│      │    ↗ стрелка        │        │
│      │       ●              │        │
│       ╲                   ╱         │
│        ╰─────────────────╯          │
│                                     │
│      Текущий уровень: Жёлтый        │  ← Текстовая подпись
│                                     │
│         ● Подключено к серверу       │  ← Статус соединения
└─────────────────────────────────────┘
```

### SVG-спидометр

Спидометр реализуется как SVG-элемент с полукруглой дугой, разделённой на 7 равных секторов:

- **Форма**: Полукруг (180°), каждый сектор занимает ~25.7° (180° / 7)
- **Секторы**: Дуги с соответствующими цветами, от серого (слева) до клубничного (справа)
- **Стрелка**: SVG-линия от центра к краю дуги, указывающая на середину текущего сектора
- **Анимация**: CSS transition или SVG animateTransform для плавного перемещения стрелки
- **Центральная точка**: Круг в центре основания полукруга

### Цветовая схема секторов

| Сектор | Угол (от-до) | Цвет | HEX |
|--------|-------------|------|-----|
| 1 | 180° — 154.3° | Серый | #9E9E9E |
| 2 | 154.3° — 128.6° | Белый | #F5F5F5 |
| 3 | 128.6° — 102.9° | Жёлтый | #FFEB3B |
| 4 | 102.9° — 77.1° | Оранжевый | #FF9800 |
| 5 | 77.1° — 51.4° | Красный | #F44336 |
| 6 | 51.4° — 25.7° | Малиновый | #E91E63 |
| 7 | 25.7° — 0° | Клубничный | #FF1744 |

> Углы отсчитываются от левого края полукруга (180°) к правому (0°).

### Стилизация

- **Фон страницы**: Тёмный градиент (#1a1a2e → #16213e) для контраста
- **Спидометр**: Белая/светлая обводка секторов для разделения
- **Стрелка**: Белая или тёмная с тенью для видимости на любом секторе
- **Шрифт**: Google Fonts — Nunito или Comfortaa (округлый, дружелюбный)
- **Адаптивность**: Спидометр масштабируется через viewBox SVG

## Файловая структура

```
frontend/
├── index.html          — основная HTML-страница
├── css/
│   └── style.css       — все стили
├── js/
│   ├── gauge.js        — класс GaugeRenderer: отрисовка и анимация SVG
│   ├── websocket.js    — класс WebSocketClient: соединение, reconnect, fallback
│   └── app.js          — инициализация, связывание модулей
└── assets/
    └── favicon.ico     — иконка сайта
```

## JavaScript модули

### gauge.js — GaugeRenderer

Класс для отрисовки и управления SVG-спидометром.

```typescript
// Псевдокод интерфейса
class GaugeRenderer {
  constructor(containerId: string)
  
  // Создаёт SVG-элемент с секторами
  render(): void
  
  // Анимированно перемещает стрелку на указанный уровень (1-7)
  setLevel(level: number): void
  
  // Обновляет текстовую подпись под спидометром
  updateLabel(color: string, hex: string): void
  
  // Вычисляет угол стрелки для данного уровня
  _calculateAngle(level: number): number
  
  // Создаёт SVG-дугу для сектора
  _createArc(startAngle: number, endAngle: number, color: string): SVGPathElement
}
```

**Ключевые детали реализации:**
- SVG создаётся программно через `document.createElementNS`
- Стрелка вращается через CSS `transform: rotate()` с `transition: transform 0.8s ease-in-out`
- Каждый сектор — отдельный `<path>` элемент с дугой
- viewBox: `0 0 300 200` (полукруг с запасом)

### websocket.js — WebSocketClient

Класс для управления WebSocket-соединением с автоматическим переподключением.

```typescript
// Псевдокод интерфейса
class WebSocketClient {
  constructor(url: string, onMessage: Function, onStatusChange: Function)
  
  // Устанавливает WebSocket соединение
  connect(): void
  
  // Закрывает соединение
  disconnect(): void
  
  // Автоматическое переподключение с экспоненциальной задержкой
  _reconnect(): void
  
  // Fallback на HTTP polling
  _startPolling(): void
  _stopPolling(): void
}
```

**Логика переподключения:**
1. При разрыве — попытка через 1 сек
2. Каждая следующая попытка — удвоение задержки (1, 2, 4, 8, 16 сек)
3. Максимальная задержка — 30 сек
4. После 5 неудачных попыток WebSocket — переключение на HTTP polling (GET /api/level каждые 10 сек)
5. Периодическая попытка восстановить WebSocket даже в режиме polling

### app.js — Инициализация

```typescript
// Псевдокод
const BACKEND_URL = 'wss://<vps-domain>:3000/ws';
const API_URL = 'https://<vps-domain>:3000';

// Инициализация
const gauge = new GaugeRenderer('gauge-container');
gauge.render();

const ws = new WebSocketClient(
  BACKEND_URL,
  (data) => {
    gauge.setLevel(data.level);
    gauge.updateLabel(data.color, data.hex);
  },
  (status) => {
    updateConnectionStatus(status);
  }
);

ws.connect();
```

## HTML структура (index.html)

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Чувствометр</title>
  <link rel="stylesheet" href="css/style.css">
  <link rel="icon" href="assets/favicon.ico">
</head>
<body>
  <div class="container">
    <h1 class="title">🔥 Чувствометр 🔥</h1>
    
    <div id="gauge-container" class="gauge-wrapper">
      <!-- SVG спидометр генерируется через JS -->
    </div>
    
    <div class="level-info">
      <span id="level-text">Загрузка...</span>
    </div>
    
    <div class="connection-status">
      <span id="status-dot" class="status-dot"></span>
      <span id="status-text">Подключение...</span>
    </div>
  </div>

  <script src="js/gauge.js"></script>
  <script src="js/websocket.js"></script>
  <script src="js/app.js"></script>
</body>
</html>
```

## Конфигурация фронтенда

URL бэкенда задаётся в [`app.js`](frontend/js/app.js) как константа. Для удобства можно вынести в отдельный конфиг-объект:

```javascript
const CONFIG = {
  WS_URL: 'wss://your-server.com/ws',
  API_URL: 'https://your-server.com',
  POLLING_INTERVAL: 10000,  // мс, fallback polling
  RECONNECT_MAX_DELAY: 30000, // мс
  ANIMATION_DURATION: 800,  // мс, анимация стрелки
};
```

## Адаптивность

- **Desktop**: Спидометр 400-500px шириной, по центру
- **Tablet**: Спидометр 300-400px
- **Mobile**: Спидометр на всю ширину экрана с отступами
- SVG масштабируется автоматически через `viewBox` и `width: 100%; max-width: 500px`

## Индикатор статуса соединения

| Статус | Цвет точки | Текст |
|--------|-----------|-------|
| Подключено (WebSocket) | 🟢 Зелёный | Подключено |
| Переподключение | 🟡 Жёлтый | Переподключение... |
| Polling режим | 🟠 Оранжевый | Режим обновления |
| Отключено | 🔴 Красный | Нет соединения |
