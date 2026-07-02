import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger.js';
import { db, liveViewers, matches } from '../db/index.js';
import { eq, and } from 'drizzle-orm';
import { v4 as uuidv4 } from 'uuid';
import { verifySocketToken } from '../middleware/auth.js';

interface ViewerData {
  sessionId: string;
  userId?: number;
  matchId?: number;
  joinedAt: Date;
}

// Store active viewer sessions in memory for fast lookups
const activeViewers = new Map<string, ViewerData>();

export function setupWebSocket(ioInstance: Server) {
  io = ioInstance;
  logger.info('Setting up WebSocket handlers...');

  io.on('connection', (socket: Socket) => {
    logger.debug(`Client connected: ${socket.id}`);

    // Generate a unique session ID for this viewer
    const sessionId = uuidv4();
    activeViewers.set(socket.id, {
      sessionId,
      joinedAt: new Date(),
    });

    // Handle match viewing
    socket.on('join_match', async (data: { matchId: number; userId?: number }) => {
      try {
        const { matchId, userId } = data;

        // Leave any previous match room
        const rooms = Array.from(socket.rooms);
        const matchRooms = rooms.filter(room => room.startsWith('match_'));
        matchRooms.forEach(room => socket.leave(room));

        // Join the new match room
        const matchRoom = `match_${matchId}`;
        socket.join(matchRoom);

        // Update viewer data
        const viewerData = activeViewers.get(socket.id);
        if (viewerData) {
          viewerData.matchId = matchId;
          viewerData.userId = userId;
          activeViewers.set(socket.id, viewerData);
        }

        // Add viewer to database
        await db.insert(liveViewers).values({
          matchId,
          sessionId: viewerData?.sessionId || sessionId,
          userId: userId || null,
          joinedAt: new Date(),
          isActive: true,
        }).onConflictDoUpdate({
          target: [liveViewers.matchId, liveViewers.sessionId],
          set: {
            isActive: true,
            joinedAt: new Date(),
          },
        });

        // Update viewer count for the match
        await updateMatchViewerCount(matchId);

        // Send current match data to the client
        const matchData = await getMatchData(matchId);
        socket.emit('match_data', matchData);

        logger.debug(`Client ${socket.id} joined match ${matchId}`);

      } catch (error) {
        logger.error('Error handling join_match:', error);
        socket.emit('error', { message: 'Failed to join match' });
      }
    });

    // Handle leaving a match
    socket.on('leave_match', async (data: { matchId: number }) => {
      try {
        const { matchId } = data;
        const matchRoom = `match_${matchId}`;
        socket.leave(matchRoom);

        const viewerData = activeViewers.get(socket.id);
        if (viewerData) {
          // Mark viewer as inactive in database
          await db.update(liveViewers)
            .set({
              leftAt: new Date(),
              isActive: false,
            })
            .where(and(
              eq(liveViewers.matchId, matchId),
              eq(liveViewers.sessionId, viewerData.sessionId)
            ));

          // Update viewer count
          await updateMatchViewerCount(matchId);

          // Clear match from viewer data
          viewerData.matchId = undefined;
          activeViewers.set(socket.id, viewerData);
        }

        logger.debug(`Client ${socket.id} left match ${matchId}`);

      } catch (error) {
        logger.error('Error handling leave_match:', error);
      }
    });

    // Handle battle events — only authenticated admins/moderators may broadcast.
    // Clients pass their JWT via socket handshake: io(url, { auth: { token } })
    socket.on('battle_event', async (data: any) => {
      try {
        const token = socket.handshake.auth?.token as string | undefined;
        const user = token ? verifySocketToken(token) : null;

        if (!user || !['admin', 'moderator'].includes(user.role)) {
          socket.emit('error', { message: 'Not authorized to broadcast battle events' });
          logger.warn(`Unauthorized battle_event attempt from socket ${socket.id}`);
          return;
        }

        const { matchId, event } = data;

        // Broadcast to all viewers of this match
        socket.to(`match_${matchId}`).emit('battle_update', event);

        logger.debug(`Battle event broadcasted for match ${matchId} by ${user.username}`);

      } catch (error) {
        logger.error('Error handling battle_event:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', async () => {
      try {
        const viewerData = activeViewers.get(socket.id);

        if (viewerData && viewerData.matchId) {
          // Mark viewer as inactive in database
          await db.update(liveViewers)
            .set({
              leftAt: new Date(),
              isActive: false,
            })
            .where(and(
              eq(liveViewers.matchId, viewerData.matchId),
              eq(liveViewers.sessionId, viewerData.sessionId)
            ));

          // Update viewer count
          await updateMatchViewerCount(viewerData.matchId);
        }

        // Remove from active viewers
        activeViewers.delete(socket.id);

        logger.debug(`Client disconnected: ${socket.id}`);

      } catch (error) {
        logger.error('Error handling disconnect:', error);
      }
    });

    // Send welcome message
    socket.emit('connected', {
      message: 'Connected to Agent Arena Live',
      sessionId: activeViewers.get(socket.id)?.sessionId,
    });
  });
}

// Helper function to update match viewer count
async function updateMatchViewerCount(matchId: number) {
  try {
    const viewerCount = await db
      .select()
      .from(liveViewers)
      .where(and(
        eq(liveViewers.matchId, matchId),
        eq(liveViewers.isActive, true)
      ));

    const currentCount = viewerCount.length;

    // Update match viewer count
    await db.update(matches)
      .set({
        viewerCount: currentCount,
        updatedAt: new Date(),
      })
      .where(eq(matches.id, matchId));

    // Broadcast updated viewer count to all match viewers
    io.to(`match_${matchId}`).emit('viewer_count_update', {
      matchId,
      viewerCount: currentCount,
    });

    logger.debug(`Updated viewer count for match ${matchId}: ${currentCount} viewers`);

  } catch (error) {
    logger.error('Error updating match viewer count:', error);
  }
}

// Helper function to get match data
async function getMatchData(matchId: number) {
  try {
    const matchData = await db
      .select()
      .from(matches)
      .where(eq(matches.id, matchId))
      .limit(1);

    return matchData[0] || null;
  } catch (error) {
    logger.error('Error getting match data:', error);
    return null;
  }
}

// Broadcast functions for external use
export const broadcastMatchUpdate = (matchId: number, data: any) => {
  io.to(`match_${matchId}`).emit('match_update', data);
  logger.debug(`Broadcasted match update for match ${matchId}`);
};

export const broadcastBattleEvent = (matchId: number, event: any) => {
  io.to(`match_${matchId}`).emit('battle_event', event);
  logger.debug(`Broadcasted battle event for match ${matchId}`);
};

export const broadcastLeaderboardUpdate = (data: any) => {
  io.emit('leaderboard_update', data);
  logger.debug('Broadcasted leaderboard update to all clients');
};

export const broadcastNewMatch = (matchData: any) => {
  io.emit('new_match', matchData);
  logger.debug('Broadcasted new match to all clients');
};

// Global socket.io instance for other modules
let io: Server;

export const getIo = () => io;