import { Router } from 'express';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { db, users } from '../db/index.js';
import { asyncHandler, validationError, authError } from '../middleware/error.js';
import { logger } from '../utils/logger.js';
import { config } from '../config.js';
import { authenticateToken } from '../middleware/auth.js';

const router = Router();

const JWT_SECRET = config.jwtSecret;
const JWT_EXPIRES_IN = config.jwtExpiresIn;

// Register new user
router.post('/register', asyncHandler(async (req, res) => {
  const { username, email, password, displayName } = req.body;

  // Validation
  if (!username || username.trim().length < 3) {
    throw validationError('Username must be at least 3 characters long');
  }

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw validationError('Valid email is required');
  }

  if (!password || password.length < 8) {
    throw validationError('Password must be at least 8 characters long');
  }

  // Check password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(password)) {
    throw validationError('Password must contain at least one lowercase letter, one uppercase letter, and one number');
  }

  try {
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Create user
    const [newUser] = await db
      .insert(users)
      .values({
        username: username.trim().toLowerCase(),
        email: email.trim().toLowerCase(),
        passwordHash,
        displayName: displayName?.trim() || username.trim(),
        isVerified: false,
        role: 'user',
      })
      .returning({
        id: users.id,
        uuid: users.uuid,
        username: users.username,
        email: users.email,
        displayName: users.displayName,
        isVerified: users.isVerified,
        role: users.role,
        createdAt: users.createdAt,
      });

    logger.info(`User registered: ${newUser.username} (ID: ${newUser.id})`);

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: newUser.id,
        username: newUser.username,
        role: newUser.role,
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
    );

    res.status(201).json({
      message: 'User registered successfully',
      user: newUser,
      token,
    });
  } catch (error: any) {
    if (error.message.includes('duplicate key')) {
      if (error.message.includes('username')) {
        throw validationError('Username already exists');
      }
      if (error.message.includes('email')) {
        throw validationError('Email already exists');
      }
    }
    throw error;
  }
}));

// Login user
router.post('/login', asyncHandler(async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    throw validationError('Username and password are required');
  }

  // Find user by username or email
  const user = await db
    .select()
    .from(users)
    .where(eq(users.username, username.trim().toLowerCase()))
    .limit(1);

  if (!user.length) {
    // Try finding by email if username doesn't work
    const userByEmail = await db
      .select()
      .from(users)
      .where(eq(users.email, username.trim().toLowerCase()))
      .limit(1);

    if (!userByEmail.length) {
      throw authError('Invalid username or password');
    }

    user.push(userByEmail[0]);
  }

  // Verify password
  const isPasswordValid = await bcrypt.compare(password, user[0].passwordHash);
  if (!isPasswordValid) {
    throw authError('Invalid username or password');
  }

  // Update last login time
  await db
    .update(users)
    .set({ lastLoginAt: new Date() })
    .where(eq(users.id, user[0].id));

  // Generate JWT token
  const token = jwt.sign(
    {
      userId: user[0].id,
      username: user[0].username,
      role: user[0].role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  logger.info(`User logged in: ${user[0].username} (ID: ${user[0].id})`);

  res.json({
    message: 'Login successful',
    user: {
      id: user[0].id,
      uuid: user[0].uuid,
      username: user[0].username,
      email: user[0].email,
      displayName: user[0].displayName,
      isVerified: user[0].isVerified,
      role: user[0].role,
    },
    token,
  });
}));

// Get current user (requires authentication)
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
  const userId = (req as any).user.userId;

  const user = await db
    .select({
      id: users.id,
      uuid: users.uuid,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatar: users.avatar,
      isVerified: users.isVerified,
      role: users.role,
      createdAt: users.createdAt,
      lastLoginAt: users.lastLoginAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.length) {
    throw authError('User not found');
  }

  res.json({
    user: user[0],
  });
}));

// Update user profile
router.put('/profile', authenticateToken, asyncHandler(async (req, res) => {
  const userId = (req as any).user.userId;
  const { displayName, avatar } = req.body;

  // Validation
  if (displayName && (displayName.trim().length < 1 || displayName.trim().length > 100)) {
    throw validationError('Display name must be between 1 and 100 characters');
  }

  // Update user
  const [updatedUser] = await db
    .update(users)
    .set({
      ...(displayName !== undefined && { displayName: displayName.trim() }),
      ...(avatar !== undefined && { avatar }),
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId))
    .returning({
      id: users.id,
      uuid: users.uuid,
      username: users.username,
      email: users.email,
      displayName: users.displayName,
      avatar: users.avatar,
      isVerified: users.isVerified,
      role: users.role,
    });

  logger.info(`User profile updated: ${updatedUser.username} (ID: ${updatedUser.id})`);

  res.json({
    message: 'Profile updated successfully',
    user: updatedUser,
  });
}));

// Change password
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
  const userId = (req as any).user.userId;
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    throw validationError('Current password and new password are required');
  }

  if (newPassword.length < 8) {
    throw validationError('New password must be at least 8 characters long');
  }

  // Check password strength
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/;
  if (!passwordRegex.test(newPassword)) {
    throw validationError('New password must contain at least one lowercase letter, one uppercase letter, and one number');
  }

  // Get user
  const user = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.length) {
    throw authError('User not found');
  }

  // Verify current password
  const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user[0].passwordHash);
  if (!isCurrentPasswordValid) {
    throw authError('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 12;
  const newPasswordHash = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await db
    .update(users)
    .set({
      passwordHash: newPasswordHash,
      updatedAt: new Date(),
    })
    .where(eq(users.id, userId));

  logger.info(`Password changed for user: ${user[0].username} (ID: ${user[0].id})`);

  res.json({
    message: 'Password changed successfully',
  });
}));

// Logout (invalidate token on client side)
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
  const userId = (req as any).user.userId;

  logger.info(`User logged out: ID ${userId}`);

  res.json({
    message: 'Logged out successfully',
  });
}));

// Refresh token
router.post('/refresh', authenticateToken, asyncHandler(async (req, res) => {
  const userId = (req as any).user.userId;

  const user = await db
    .select({
      id: users.id,
      username: users.username,
      role: users.role,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user.length) {
    throw authError('User not found');
  }

  // Generate new token
  const token = jwt.sign(
    {
      userId: user[0].id,
      username: user[0].username,
      role: user[0].role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  res.json({
    message: 'Token refreshed successfully',
    token,
  });
}));

// Re-exported so existing imports keep working; implementation lives in middleware/auth.ts
export { authenticateToken };

export default router;