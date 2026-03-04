# 🔥 Чувствометр

Шуточное веб-приложение для измерения уровня чувств. Отображает спидометр с 7 уровнями, от серого (1) до клубничного (7).

## Структура проекта

```
chuvstvometr/
├── frontend/    — HTML/CSS/JS сайт (GitHub Pages)
└── backend/     — Node.js/TypeScript сервер (VPS)
```

## Быстрый старт

### Бэкенд

```bash
cd backend
npm install
cp .env.example .env
# Отредактировать .env: установить API_KEY
npm run dev
```

### Фронтенд

```bash
cd frontend
npx serve .
# Открыть http://localhost:3000
```

> Перед запуском фронтенда убедитесь, что в `js/config.js` указан правильный URL бэкенда.

## API

| Метод | Путь | Описание |
|-------|------|----------|
| GET | `/api/level` | Текущий уровень чувст�� |
| POST | `/api/level` | Установить уровень (требует `X-API-Key`) |
| GET | `/api/levels` | Все уровни с цветами |
| GET | `/api/health` | Проверка работоспособности |
| WS | `/ws` | WebSocket для real-time обновлений |

### Пример: установить у��овень

```bash
curl -X POST http://localhost:3000/api/level \
  -H "Content-Type: application/json" \
  -H "X-API-Key: your-api-key" \
  -d '{"level": 5}'
```

## Уровни чувств

| # | Цвет | HEX |
|---|------|-----|
| 1 | Серый | #9E9E9E |
| 2 | Белый | #F5F5F5 |
| 3 | Жёлтый | #FFEB3B |
| 4 | Оранжевый | #FF9800 |
| 5 | Красный | #F44336 |
| 6 | Малиновый | #E91E63 |
| 7 | Клубничный | #FF1744 |

## Деплой

- **Фронтенд**: GitHub Pages (автоматически через GitHub Actions при push в `main`)
- **Бэкенд**: VPS с PM2 + Nginx + SSL

Подробнее: [`plans/deployment.md`](plans/deployment.md)

## Документация

- [`plans/architecture.md`](plans/architecture.md) — архитектура системы
- [`plans/api-spec.md`](plans/api-spec.md) — спецификация API
- [`plans/frontend-spec.md`](plans/frontend-spec.md) — спецификация фронтенда
- [`plans/deployment.md`](plans/deployment.md) — план деплоя
- [`plans/project-structure.md`](plans/project-structure.md) — структура проекта
