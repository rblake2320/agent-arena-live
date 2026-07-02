import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config.js';

export interface JwtUser {
  userId: number;
  username: string;
  role: string;
}

export interface AuthenticatedRequest extends Request {
  user?: JwtUser;
}

export function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: true, message: 'Access token required' });
  }

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (err) {
      return res.status(403).json({ error: true, message: 'Invalid or expired token' });
    }

    req.user = user as JwtUser;
    next();
  });
}

// Allows anonymous access but attaches req.user when a valid token is present.
export function optionalAuth(req: AuthenticatedRequest, _res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return next();

  jwt.verify(token, config.jwtSecret, (err, user) => {
    if (!err) {
      req.user = user as JwtUser;
    }
    next();
  });
}

export function requireRole(...roles: string[]) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: true, message: 'Access token required' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: true, message: 'Insufficient permissions' });
    }
    next();
  };
}

export function verifySocketToken(token: string): JwtUser | null {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtUser;
  } catch {
    return null;
  }
}
