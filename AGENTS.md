# AGENTS.md

This file provides guidance to agents when working with code in this repository.

## Project Overview

**Чувствометр (Chuvstvometr)** — шуточное веб-приложение с двумя модулями:
- **frontend/** — статический HTML/CSS/JS сайт (деплой на GitHub Pages)
- **backend/** — Node.js/TypeScript сервер с Express + WebSocket + Telegram-бот (деплой на VPS)

## Architecture & Plans

Подробная документация находится в директории `plans/`:
- `plans/architecture.md` — общая архитектура системы
- `plans/api-spec.md` — спецификация REST и WebSocket API
- `plans/frontend-spec.md` — спецификация фронтенда (SVG-спидометр)
- `plans/deployment.md` — план деплоя (GitHub Pages + VPS)
- `plans/project-structure.md` — структура файлов и конфигурации
- `plans/telegram-bot.md` — план и детали реализации Telegram-бота

## Tech Stack

| Component | Technology |
|-----------|-----------|
| Frontend | HTML5, CSS3, Vanilla JavaScript (no frameworks) |
| Backend | Node.js, TypeScript, Express, ws (WebSocket) |
| Storage | JSON file (single state parameter) |
| Telegram Bot | node-telegram-bot-api (polling mode, built into backend) |
| Deploy (frontend) | GitHub Pages |
| Deploy (backend) | VPS with PM2 + Nginx |

## Code Conventions

### Backend (TypeScript)
- **Target**: ES2020, CommonJS modules
- **Strict mode**: enabled
- **File naming**: kebab-case (e.g., `rate-limit.ts`) or camelCase (e.g., `rateLimit.ts`)
- **Exports**: Named exports preferred over default exports
- **Error handling**: All async routes wrapped in try/catch, errors returned as `{ error: string }`
- **Environment**: Configuration via dotenv, all secrets in `.env` (never committed)
- **Logging**: Console-based with log level from config

### Frontend (Vanilla JS)
- **No build step**: Plain JS files loaded via `<script>` tags
- **Module pattern**: Each file defines a class or IIFE, attached to global scope
- **SVG**: Generated programmatically via `document.createElementNS`
- **Config**: All backend URLs and settings in `js/config.js`
- **Language**: Russian for UI text, English for code (variable names, comments)

## Build & Run Commands

### Backend
```bash
cd backend
npm install          # Install dependencies
npm run dev          # Development with nodemon + ts-node
npm run build        # Compile TypeScript to dist/
npm start            # Run compiled JS from dist/
```

### Frontend (local development)
```bash
cd frontend
npx serve .          # Or: python -m http.server 8080
```

## Key Design Decisions

1. **No frontend framework** — simplicity, zero build step, easy GitHub Pages deploy
2. **WebSocket for real-time updates** — instant level changes on all connected clients
3. **HTTP polling fallback** — resilience when WebSocket is unavailable
4. **JSON file storage** — only one parameter stored, no need for a database
5. **API key auth** — simple protection for mutation endpoints
6. **SVG gauge** — scalable, animatable, no external image dependencies

## Important Notes

- The frontend `js/config.js` must be updated with production backend URL before deploying
- CORS on backend must allow the GitHub Pages origin
- WebSocket path is `/ws`, REST API paths start with `/api/`
- State file `backend/data/state.json` must exist before first run
- Level values are integers 1-7 inclusive
- Telegram bot is optional: if `TELEGRAM_BOT_TOKEN` is not set, the bot is silently skipped
- Telegram bot uses long polling mode — no webhook or extra port needed
- Allowed Telegram users are configured via `TELEGRAM_ALLOWED_USERS` (comma-separated user IDs)
- Telegram bot directly calls `writeState()` and `broadcastUpdate()` — no HTTP round-trip
