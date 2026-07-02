// config must be imported first: it loads .env and validates required variables
// before any other module reads process.env.
import { config } from './config.js';

import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { sql } from 'drizzle-orm';

import { db, client } from './db/index.js';
import { setupWebSocket } from './services/websocket.js';
import { errorHandler, notFoundHandler } from './middleware/error.js';
import { logger } from './utils/logger.js';

// Routes
import authRoutes from './routes/auth.js';
import teamsRoutes from './routes/teams.js';
import matchesRoutes from './routes/matches.js';
import leaderboardRoutes from './routes/leaderboard.js';
import agentsRoutes from './routes/agents.js';
import battleRoutes from './routes/battles.js';

const app = express();
const server = createServer(app);

// Socket.IO setup with CORS
const io = new Server(server, {
  cors: {
    origin: config.corsOrigins,
    credentials: true,
  },
  path: config.wsPath,
});

// Running behind a reverse proxy (nginx, Cloudflare) in production —
// needed so rate limiting sees real client IPs instead of the proxy's.
if (config.isProduction) {
  app.set('trust proxy', 1);
}

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

// CORS configuration
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: config.rateLimitWindowMinutes * 60 * 1000,
  max: config.rateLimitMaxRequests,
  message: { error: true, message: 'Too many requests from this IP, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for credential endpoints to slow brute-force attempts
const authLimiter = rateLimit({
  windowMs: config.rateLimitWindowMinutes * 60 * 1000,
  max: config.authRateLimitMaxRequests,
  message: { error: true, message: 'Too many authentication attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Liveness: process is up
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: process.env.npm_package_version || '1.0.0',
    environment: config.nodeEnv,
  });
});

// Readiness: process is up AND the database is reachable
app.get('/ready', async (_req, res) => {
  try {
    await db.execute(sql`select 1`);
    res.json({ status: 'ready' });
  } catch (error) {
    logger.error('Readiness check failed — database unreachable', { error: (error as Error).message });
    res.status(503).json({ status: 'unavailable', reason: 'database unreachable' });
  }
});

// API routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/teams', teamsRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/agents', agentsRoutes);
app.use('/api/battles', battleRoutes);

// Setup WebSocket handlers
setupWebSocket(io);

// Error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  io.close();
  server.close(async () => {
    logger.info('HTTP server closed.');
    try {
      await client.end({ timeout: 5 });
      logger.info('Database connections closed.');
    } catch {
      // pool already closed or unreachable — nothing left to release
    }
    process.exit(0);
  });

  // Force close server after 10 seconds
  setTimeout(() => {
    logger.error('Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

// Handle shutdown signals
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server unless a test harness imports the app
if (process.env.NODE_ENV !== 'test') {
  server.listen(config.port, config.host, () => {
    logger.info(`🚀 Agent Arena Live Backend started!`);
    logger.info(`📡 HTTP Server running on http://${config.host}:${config.port}`);
    logger.info(`🔗 WebSocket Server running on ws://${config.host}:${config.port}${config.wsPath}`);
    logger.info(`🌍 Environment: ${config.nodeEnv}`);
  });
}

// Export for testing
export { app, server, io };
