import dotenv from 'dotenv';

// Load .env before anything else reads process.env. This module must be the
// first import in server.ts and is imported by every module that needs config,
// so route modules never see an unpopulated environment.
dotenv.config();

function required(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    // eslint-disable-next-line no-console
    console.error(`FATAL: required environment variable ${name} is not set. See backend/.env.example.`);
    process.exit(1);
  }
  return value;
}

const nodeEnv = process.env.NODE_ENV || 'development';
const jwtSecret = required('JWT_SECRET');

if (nodeEnv === 'production' && jwtSecret.length < 32) {
  // eslint-disable-next-line no-console
  console.error('FATAL: JWT_SECRET must be at least 32 characters in production. Generate one with: openssl rand -hex 32');
  process.exit(1);
}

export const config = {
  nodeEnv,
  isProduction: nodeEnv === 'production',
  port: parseInt(process.env.PORT || '3001', 10),
  host: process.env.HOST || '0.0.0.0',
  databaseUrl: required('DATABASE_URL'),
  jwtSecret,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '7d',
  corsOrigins: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:8080')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  wsPath: process.env.WS_PATH || '/socket.io',
  rateLimitWindowMinutes: parseInt(process.env.RATE_LIMIT_WINDOW || '15', 10),
  rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '300', 10),
  authRateLimitMaxRequests: parseInt(process.env.AUTH_RATE_LIMIT_MAX_REQUESTS || '20', 10),
  ratingKFactor: parseInt(process.env.RATING_K_FACTOR || '32', 10),
};
