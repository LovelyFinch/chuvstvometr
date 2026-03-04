# Чувствометр — Структура проекта

## Полное дерево файлов

```
chuvstvometr/
├── .github/
│   └── workflows/
│       └── deploy-frontend.yml    — CI/CD для GitHub Pages
│
├── frontend/                       — Фронтенд (GitHub Pages)
│   ├── index.html                  — Главная страница
│   ├── css/
│   │   └── style.css               — Стили приложения
│   ├── js/
│   │   ├── config.js               — Конфигурация (URL бэкенда и т.д.)
│   │   ├── gauge.js                — SVG-спидометр: отрисовка и анимация
│   │   ├── websocket.js            — WebSocket клиент с reconnect и fallback
│   │   └── app.js                  — Точка входа, инициализация
│   └── assets/
│       └── favicon.ico             — Иконка сайта
│
├── backend/                        — Бэкенд (VPS)
│   ├── src/
│   │   ├── index.ts                — Точка входа: запуск Express + WebSocket
│   │   ├── config.ts               — Загрузка конфигурации из .env
│   │   ├── constants.ts            — Константы уровней чувств (цвета, HEX)
│   │   ├── types/
│   │   │   └── index.ts            — TypeScript интерфейсы и типы
│   │   ├── routes/
│   │   │   └── level.ts            — Express роуты: GET/POST /api/level, GET /api/levels
│   │   ├── services/
│   │   │   ├── storage.ts          — Чтение/запись JSON-файла состояния
│   │   │   └── websocket.ts        — WebSocket сервер, broadcast, heartbeat
│   │   └── middleware/
│   │       ├── auth.ts             — Проверка API-ключа
│   │       ├── cors.ts             — CORS настройки
│   │       └── rateLimit.ts        — Rate limiting
│   ├── data/
│   │   └── state.json              — Персистентное хранилище состояния
│   ├── scripts/
│   │   └── deploy.sh               — Скрипт деплоя на VPS
│   ├── package.json
│   ├── tsconfig.json
│   ├── .env.example                — Пример переменных окружения
│   └── ecosystem.config.js         — PM2 конфигурация
│
├── plans/                          — Документация и планы
│   ├── architecture.md             — Архитектура системы
│   ├── api-spec.md                 — Спецификация API
│   ├── frontend-spec.md            — Спецификация фронтенда
│   ├── deployment.md               — План деплоя
│   └── project-structure.md        — Этот файл
│
├── AGENTS.md                       — Инструкции для AI-агентов
├── README.md                       — Описание проекта
├── task.txt                        — Исходное описание задачи
└── .gitignore                      — Игнорируемые файлы
```

## Конфигурационные файлы

### backend/package.json

```json
{
  "name": "chuvstvometr-backend",
  "version": "1.0.0",
  "description": "Backend for Chuvstvometr - feelings gauge app",
  "main": "dist/index.js",
  "scripts": {
    "dev": "nodemon --exec ts-node src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "lint": "eslint src/**/*.ts"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.21.0",
    "express-rate-limit": "^7.4.0",
    "ws": "^8.18.0"
  },
  "devDependencies": {
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/node": "^20.14.0",
    "@types/ws": "^8.5.12",
    "nodemon": "^3.1.4",
    "ts-node": "^10.9.2",
    "typescript": "^5.5.0"
  }
}
```

### backend/tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "commonjs",
    "lib": ["ES2020"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### backend/.env.example

```env
# Порт сервера
PORT=3000

# API-ключ для авторизации мутирующих запросов
API_KEY=change-me-to-a-secure-key

# Разрешённые CORS origins (через запятую)
CORS_ORIGINS=http://localhost:8080,http://127.0.0.1:8080

# Путь к файлу состояния
STATE_FILE=./data/state.json

# Уровень логирования: debug, info, warn, error
LOG_LEVEL=debug

# Окружение: development, production
NODE_ENV=development
```

### backend/data/state.json (начальное состояние)

```json
{
  "level": 1,
  "updatedAt": "2026-03-03T00:00:00.000Z",
  "updatedBy": "manual"
}
```

### .gitignore

```gitignore
# Dependencies
node_modules/

# Build output
backend/dist/

# Environment files
.env
.env.local
.env.production

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

# Logs
*.log
npm-debug.log*
```

### frontend/js/config.js

```javascript
/**
 * Конфигурация фронтенда Чувствометра.
 * Перед деплоем обновить URL бэкенда.
 */
const CONFIG = {
  // WebSocket URL бэкенда
  WS_URL: 'ws://localhost:3000/ws',
  
  // REST API URL бэкенда
  API_URL: 'http://localhost:3000',
  
  // Интервал polling в мс (fallback при недоступности WebSocket)
  POLLING_INTERVAL: 10000,
  
  // Максимальная задержка reconnect в мс
  RECONNECT_MAX_DELAY: 30000,
  
  // Длительность анимации стрелки в мс
  ANIMATION_DURATION: 800,
  
  // Уровни чувств
  LEVELS: [
    { level: 1, color: 'серый',      hex: '#9E9E9E' },
    { level: 2, color: 'белый',      hex: '#F5F5F5' },
    { level: 3, color: 'жёлтый',    hex: '#FFEB3B' },
    { level: 4, color: 'оранжевый', hex: '#FF9800' },
    { level: 5, color: 'красный',   hex: '#F44336' },
    { level: 6, color: 'малиновый', hex: '#E91E63' },
    { level: 7, color: 'клубничный', hex: '#FF1744' },
  ],
};
```

## Порядок реализации

### Фаза 1: Бэкенд
1. Инициализация проекта: `package.json`, `tsconfig.json`
2. Типы и константы: `types/index.ts`, `constants.ts`
3. Конфигурация: `config.ts`
4. Хранилище: `services/storage.ts`
5. Middleware: `auth.ts`, `cors.ts`, `rateLimit.ts`
6. REST API роуты: `routes/level.ts`
7. WebSocket сервер: `services/websocket.ts`
8. Точка входа: `index.ts`
9. Тестирование через curl/Postman

### Фаза 2: Фронтенд
1. HTML-каркас: `index.html`
2. Стили: `css/style.css`
3. Конфигурация: `js/config.js`
4. SVG-спидометр: `js/gauge.js`
5. WebSocket клиент: `js/websocket.js`
6. Инициализация: `js/app.js`
7. Тестирование с локальным бэкендом

### Фаза 3: Деплой
1. GitHub Actions для фронтенда
2. Настройка VPS для бэкенда
3. Обновление конфигурации фронтенда с production URL
4. Интеграционное тестирование

### Фаза 4: Telegram-бот (будущее)
1. Создание бота через BotFather
2. Реализация модуля бота
3. Интеграция с API бэкенда
