// CORS configuration middleware
import cors from 'cors';
import { config, log } from '../config';

export const corsMiddleware = cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (e.g., curl, Postman, same-origin) in development mode
    if (config.nodeEnv === 'development' && !origin ) {
      callback(null, true);
      return;
    }

    if (origin && config.corsOrigins.includes(origin)) {
      callback(null, true);
    } else {
      log('warn', `CORS blocked request from origin: ${origin}`);
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-API-Key'],
  credentials: false,
});
