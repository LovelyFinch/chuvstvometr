# Чувствометр — Спецификация API бэкенда

## Общие сведения

- **Базовый URL**: `https://<vps-domain>:<port>`
- **Формат данных**: JSON
- **Авторизация**: API-ключ в заголовке `X-API-Key` (только для мутирующих запросов)

## Модель данных

### LevelState

```typescript
interface LevelState {
  level: number;       // 1-7, текущий уровень чувств
  updatedAt: string;   // ISO 8601 timestamp последнего обновления
  updatedBy: string;   // источник изменения: api, telegram, manual
}
```

### LevelInfo

```typescript
interface LevelInfo {
  level: number;
  color: string;       // название цвета на русском
  hex: string;         // HEX-код цвета
}
```

### Константы уровней

```typescript
const LEVELS: LevelInfo[] = [
  { level: 1, color: 'серый',      hex: '#9E9E9E' },
  { level: 2, color: 'белый',      hex: '#F5F5F5' },
  { level: 3, color: 'жёлтый',    hex: '#FFEB3B' },
  { level: 4, color: 'оранжевый', hex: '#FF9800' },
  { level: 5, color: 'красный',   hex: '#F44336' },
  { level: 6, color: 'малиновый', hex: '#E91E63' },
  { level: 7, color: 'клубничный', hex: '#FF1744' },
];
```

## REST API Endpoints

### GET /api/level

Получить текущий уровень чувств.

**Авторизация**: Не требуется

**Ответ 200 OK:**
```json
{
  "level": 3,
  "color": "жёлтый",
  "hex": "#FFEB3B",
  "updatedAt": "2026-03-03T23:00:00.000Z",
  "updatedBy": "api"
}
```

---

### POST /api/level

Установить новый уровень чувств.

**Авторизация**: Требуется `X-API-Key`

**Заголовки:**
```
Content-Type: application/json
X-API-Key: <api-key>
```

**Тело запроса:**
```json
{
  "level": 5,
  "source": "api"
}
```

| Поле | Тип | Обязательное | Описание |
|------|-----|-------------|----------|
| level | number | Да | Значение от 1 до 7 |
| source | string | Нет | Источник изменения (по умолчанию "api") |

**Ответ 200 OK:**
```json
{
  "level": 5,
  "color": "красный",
  "hex": "#F44336",
  "updatedAt": "2026-03-03T23:05:00.000Z",
  "updatedBy": "api"
}
```

**Ответ 400 Bad Request:**
```json
{
  "error": "Invalid level. Must be between 1 and 7."
}
```

**Ответ 401 Unauthorized:**
```json
{
  "error": "Invalid or missing API key."
}
```

---

### GET /api/levels

Получить список всех доступных уровней с цветами.

**Авторизация**: Не требуется

**Ответ 200 OK:**
```json
{
  "levels": [
    { "level": 1, "color": "серый", "hex": "#9E9E9E" },
    { "level": 2, "color": "белый", "hex": "#F5F5F5" },
    { "level": 3, "color": "жёлтый", "hex": "#FFEB3B" },
    { "level": 4, "color": "оранжевый", "hex": "#FF9800" },
    { "level": 5, "color": "красный", "hex": "#F44336" },
    { "level": 6, "color": "малиновый", "hex": "#E91E63" },
    { "level": 7, "color": "клубничный", "hex": "#FF1744" }
  ]
}
```

---

### GET /api/health

Проверка работоспособности сервера.

**Авторизация**: Не требуется

**Ответ 200 OK:**
```json
{
  "status": "ok",
  "uptime": 12345
}
```

## WebSocket API

### Подключение

```
ws://<vps-domain>:<port>/ws
```

### Сообщения от сервера к клиенту

При подключении клиент сразу получает текущее состояние:

```json
{
  "type": "state",
  "data": {
    "level": 3,
    "color": "жёлтый",
    "hex": "#FFEB3B",
    "updatedAt": "2026-03-03T23:00:00.000Z"
  }
}
```

При изменении уровня все подключённые клиенты получают:

```json
{
  "type": "update",
  "data": {
    "level": 5,
    "color": "красный",
    "hex": "#F44336",
    "updatedAt": "2026-03-03T23:05:00.000Z"
  }
}
```

### Heartbeat

Сервер отправляет ping каждые 30 секунд для поддержания соединения. Клиент должен отвечать pong (обрабатывается автоматически на уровне протокола WebSocket).

## Конфигурация сервера

### Переменные окружения (.env)

```env
# Порт HTTP/WebSocket сервера
PORT=3000

# API-ключ для авторизации мутирующих запросов
API_KEY=your-secret-api-key-here

# Разрешённые CORS origins (через запятую)
CORS_ORIGINS=https://username.github.io

# Путь к файлу хранения состояния
STATE_FILE=./data/state.json

# Уровень логирования: debug, info, warn, error
LOG_LEVEL=info
```

## Обработка ошибок

Все ошибки возвращаются в формате:

```json
{
  "error": "Описание ошибки"
}
```

| HTTP код | Описание |
|----------|----------|
| 200 | Успешный запрос |
| 400 | Невалидные данные (уровень вне диапазона 1-7) |
| 401 | Отсутствует или неверный API-ключ |
| 429 | Слишком много запросов (rate limit) |
| 500 | Внутренняя ошибка сервера |

## Rate Limiting

- **GET запросы**: 60 запросов в минуту с одного IP
- **POST запросы**: 10 запросов в минуту с одного IP
- **WebSocket**: Максимум 100 одновременных соединений
