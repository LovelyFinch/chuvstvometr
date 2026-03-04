// Entry point for Chuvstvometr backend
import express from 'express';
import { createServer } from 'http';
import { config, log } from './config';
import { corsMiddleware } from './middleware/cors';
import { levelRouter } from './routes/level';
import { initWebSocketServer } from './services/websocket';
import { initTelegramBot, stopTelegramBot } from './services/telegram';

const app = express();

// Middleware
app.use(corsMiddleware);
app.use(express.json());

// Routes
app.use('/api', levelRouter);

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Create HTTP server (shared with WebSocket)
const server = createServer(app);

// Initialize WebSocket server
initWebSocketServer(server);

// Initialize Telegram bot (optional — only if token is configured)
initTelegramBot();

// Start server
server.listen(config.port, () => {
  log('info', `Chuvstvometr backend started on port ${config.port}`);
  log('info', `Environment: ${config.nodeEnv}`);
  log('info', `CORS origins: ${config.corsOrigins.join(', ')}`);
  log('info', `State file: ${config.stateFile}`);
  log('info', `Telegram bot: ${config.telegram ? 'enabled' : 'disabled'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('info', 'SIGTERM received, shutting down gracefully');
  stopTelegramBot();
  server.close(() => {
    log('info', 'Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('info', 'SIGINT received, shutting down gracefully');
  stopTelegramBot();
  server.close(() => {
    log('info', 'Server closed');
    process.exit(0);
  });
});
