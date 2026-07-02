import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger.js';

const SENSITIVE_FIELDS = ['password', 'currentPassword', 'newPassword', 'passwordHash', 'token'];

function redactSensitive(body: unknown): unknown {
  if (!body || typeof body !== 'object') return body;
  const clone: Record<string, unknown> = { ...(body as Record<string, unknown>) };
  for (const field of SENSITIVE_FIELDS) {
    if (field in clone) clone[field] = '[REDACTED]';
  }
  return clone;
}

// Custom error class
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error handling middleware
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error = err;

  // Log error — never log credentials or tokens
  logger.error(`Error ${req.method} ${req.path}:`, {
    message: error.message,
    stack: error.stack,
    body: redactSensitive(req.body),
    params: req.params,
    query: req.query,
  });

  // Default error properties
  let statusCode = 500;
  let message = 'Internal Server Error';

  // Handle known operational errors
  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
  }

  // Handle specific error types
  if (error.message.includes('duplicate key value')) {
    statusCode = 409;
    message = 'Resource already exists';
  } else if (error.message.includes('not found')) {
    statusCode = 404;
    message = 'Resource not found';
  } else if (error.message.includes('invalid input')) {
    statusCode = 400;
    message = 'Invalid input data';
  } else if (error.message.includes('unauthorized')) {
    statusCode = 401;
    message = 'Unauthorized';
  } else if (error.message.includes('forbidden')) {
    statusCode = 403;
    message = 'Forbidden';
  }

  // Send error response
  res.status(statusCode).json({
    error: true,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: error.stack,
      details: error.message,
    }),
  });
};

// 404 handler
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const message = `Route ${req.method} ${req.originalUrl} not found`;
  logger.warn(message);

  res.status(404).json({
    error: true,
    message,
  });
};

// Async error wrapper — generic over the request type so handlers using
// AuthenticatedRequest keep full typing.
export const asyncHandler = <R extends Request = Request>(
  fn: (req: R, res: Response, next: NextFunction) => unknown
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req as R, res, next)).catch(next);
  };
};

// Validation error helper
export const validationError = (message: string): AppError => {
  return new AppError(message, 400);
};

// Authorization error helper
export const authError = (message: string = 'Unauthorized'): AppError => {
  return new AppError(message, 401);
};

// Not found error helper
export const notFoundError = (resource: string = 'Resource'): AppError => {
  return new AppError(`${resource} not found`, 404);
};

// Forbidden error helper
export const forbiddenError = (message: string = 'Forbidden'): AppError => {
  return new AppError(message, 403);
};