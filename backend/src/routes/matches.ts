import { Router } from 'express';
import { eq, desc, sql, and, inArray } from 'drizzle-orm';
import {
  db,
  matches,
  matchParticipants,
  teams,
  matchTypes,
  battleEvents,
  liveViewers,
  agents,
  teamAgents
} from '../db/index.js';
import { asyncHandler, notFoundError, validationError } from '../middleware/error.js';
import { logger } from '../utils/logger.js';
import { broadcastMatchUpdate, broadcastNewMatch, broadcastBattleEvent } from '../services/websocket.js';
import { authenticateToken, requireRole, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Get all matches with filtering and pagination
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;
  const status = req.query.status as string;
  const matchType = req.query.matchType as string;

  let query = db
    .select({
      id: matches.id,
      uuid: matches.uuid,
      topic: matches.topic,
      status: matches.status,
      currentRound: matches.currentRound,
      maxRounds: matches.maxRounds,
      startTime: matches.startTime,
      endTime: matches.endTime,
      viewerCount: matches.viewerCount,
      peakViewers: matches.peakViewers,
      createdAt: matches.createdAt,
      updatedAt: matches.updatedAt,
      matchTypeName: matchTypes.name,
      winnerTeamName: teams.name,
    })
    .from(matches)
    .leftJoin(matchTypes, eq(matches.matchTypeId, matchTypes.id))
    .leftJoin(teams, eq(matches.winnerId, teams.id)).$dynamic();

  // Add filters (collect conditions — chained .where() calls replace each other)
  const conditions = [];
  if (status) {
    conditions.push(eq(matches.status, status));
  }
  if (matchType) {
    conditions.push(eq(matchTypes.name, matchType));
  }
  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const allMatches = await query
    .orderBy(desc(matches.createdAt))
    .limit(limit)
    .offset(offset);

  // Get participants for each match
  const matchIds = allMatches.map(match => match.id);
  const participants = matchIds.length > 0 ? await db
    .select({
      matchId: matchParticipants.matchId,
      teamId: matchParticipants.teamId,
      teamName: teams.name,
      side: matchParticipants.side,
      score: matchParticipants.score,
      isWinner: matchParticipants.isWinner,
    })
    .from(matchParticipants)
    .innerJoin(teams, eq(matchParticipants.teamId, teams.id))
    .where(inArray(matchParticipants.matchId, matchIds)) : [];

  // Group participants by match
  const participantsByMatch = participants.reduce((acc, participant) => {
    if (!acc[participant.matchId]) {
      acc[participant.matchId] = [];
    }
    acc[participant.matchId].push(participant);
    return acc;
  }, {} as Record<number, typeof participants>);

  // Combine match data with participants
  const enrichedMatches = allMatches.map(match => ({
    ...match,
    participants: participantsByMatch[match.id] || [],
  }));

  // Get total count for pagination
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(matches);
  const total = totalResult[0]?.count || 0;

  res.json({
    matches: enrichedMatches,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// Get live matches
router.get('/live', asyncHandler(async (req, res) => {
  const liveMatches = await db
    .select({
      id: matches.id,
      uuid: matches.uuid,
      topic: matches.topic,
      status: matches.status,
      currentRound: matches.currentRound,
      maxRounds: matches.maxRounds,
      startTime: matches.startTime,
      viewerCount: matches.viewerCount,
      createdAt: matches.createdAt,
      matchTypeName: matchTypes.name,
    })
    .from(matches)
    .leftJoin(matchTypes, eq(matches.matchTypeId, matchTypes.id))
    .where(eq(matches.status, 'live'))
    .orderBy(desc(matches.viewerCount));

  // Get participants and their agents for live matches
  const matchIds = liveMatches.map(match => match.id);

  if (matchIds.length === 0) {
    return res.json({ matches: [] });
  }

  const participants = await db
    .select({
      matchId: matchParticipants.matchId,
      teamId: matchParticipants.teamId,
      teamName: teams.name,
      side: matchParticipants.side,
      score: matchParticipants.score,
    })
    .from(matchParticipants)
    .innerJoin(teams, eq(matchParticipants.teamId, teams.id))
    .where(inArray(matchParticipants.matchId, matchIds));

  // Get agents for each team
  const teamIds = participants.map(p => p.teamId);
  const teamAgentsData = teamIds.length > 0 ? await db
    .select({
      teamId: teamAgents.teamId,
      agentName: agents.name,
      role: teamAgents.role,
    })
    .from(teamAgents)
    .innerJoin(agents, eq(teamAgents.agentId, agents.id))
    .where(inArray(teamAgents.teamId, teamIds)) : [];

  // Group data by match
  const enrichedMatches = liveMatches.map(match => {
    const matchParticipants = participants.filter(p => p.matchId === match.id);

    const teamA = matchParticipants.find(p => p.side === 'A');
    const teamB = matchParticipants.find(p => p.side === 'B');

    const teamAAgents = teamA ? teamAgentsData
      .filter(ta => ta.teamId === teamA.teamId)
      .map(ta => ta.agentName) : [];

    const teamBAgents = teamB ? teamAgentsData
      .filter(ta => ta.teamId === teamB.teamId)
      .map(ta => ta.agentName) : [];

    return {
      id: match.id,
      teamA: {
        name: teamA?.teamName || 'TBA',
        agents: teamAAgents,
      },
      teamB: {
        name: teamB?.teamName || 'TBA',
        agents: teamBAgents,
      },
      type: match.matchTypeName || 'Unknown',
      topic: match.topic,
      viewers: match.viewerCount,
      round: match.currentRound,
      maxRounds: match.maxRounds,
      status: match.status,
    };
  });

  res.json({ matches: enrichedMatches });
}));

// Get match by ID with full details
router.get('/:id', asyncHandler(async (req, res) => {
  const matchId = parseInt(req.params.id);

  if (isNaN(matchId)) {
    throw validationError('Invalid match ID');
  }

  // Get match details
  const match = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match.length) {
    throw notFoundError('Match');
  }

  // Get participants
  const participants = await db
    .select({
      teamId: matchParticipants.teamId,
      teamName: teams.name,
      side: matchParticipants.side,
      score: matchParticipants.score,
      isWinner: matchParticipants.isWinner,
    })
    .from(matchParticipants)
    .innerJoin(teams, eq(matchParticipants.teamId, teams.id))
    .where(eq(matchParticipants.matchId, matchId));

  // Get battle events
  const events = await db
    .select()
    .from(battleEvents)
    .where(eq(battleEvents.matchId, matchId))
    .orderBy(battleEvents.timestamp);

  res.json({
    match: match[0],
    participants,
    events,
  });
}));

// Create new match (any authenticated user)
router.post('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const {
    topic,
    matchTypeId,
    teamAId,
    teamBId,
    maxRounds = 1,
    startTime
  } = req.body;

  // Validation
  if (!topic || topic.trim().length < 5) {
    throw validationError('Topic must be at least 5 characters long');
  }

  if (!matchTypeId || !teamAId || !teamBId) {
    throw validationError('Match type and both teams are required');
  }

  if (teamAId === teamBId) {
    throw validationError('Teams must be different');
  }

  // Verify teams exist
  const teamResults = await db
    .select({ id: teams.id })
    .from(teams)
    .where(inArray(teams.id, [teamAId, teamBId]));

  if (teamResults.length !== 2) {
    throw validationError('One or both teams not found');
  }

  try {
    // Create match
    const [newMatch] = await db
      .insert(matches)
      .values({
        topic: topic.trim(),
        matchTypeId,
        maxRounds,
        currentRound: 1,
        status: 'pending',
        startTime: startTime ? new Date(startTime) : undefined,
        viewerCount: 0,
        peakViewers: 0,
      })
      .returning();

    // Add participants
    await db.insert(matchParticipants).values([
      {
        matchId: newMatch.id,
        teamId: teamAId,
        side: 'A',
        score: '0',
        isWinner: false,
      },
      {
        matchId: newMatch.id,
        teamId: teamBId,
        side: 'B',
        score: '0',
        isWinner: false,
      },
    ]);

    logger.info(`Match created: ${newMatch.topic} (ID: ${newMatch.id})`);

    // Broadcast new match to all clients
    broadcastNewMatch({
      id: newMatch.id,
      topic: newMatch.topic,
      status: newMatch.status,
      teams: [teamAId, teamBId],
    });

    res.status(201).json({
      message: 'Match created successfully',
      match: newMatch,
    });
  } catch (error) {
    logger.error('Error creating match:', error);
    throw error;
  }
}));

// Start a match (admin/moderator — official lifecycle control)
router.post('/:id/start', authenticateToken, requireRole('admin', 'moderator'), asyncHandler(async (req, res) => {
  const matchId = parseInt(req.params.id);

  if (isNaN(matchId)) {
    throw validationError('Invalid match ID');
  }

  const match = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match.length) {
    throw notFoundError('Match');
  }

  if (match[0].status !== 'pending') {
    throw validationError('Only pending matches can be started');
  }

  // Update match status
  const [updatedMatch] = await db
    .update(matches)
    .set({
      status: 'live',
      startTime: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId))
    .returning();

  logger.info(`Match started: ${updatedMatch.topic} (ID: ${updatedMatch.id})`);

  // Broadcast match update
  broadcastMatchUpdate(matchId, {
    type: 'match_started',
    match: updatedMatch,
  });

  res.json({
    message: 'Match started successfully',
    match: updatedMatch,
  });
}));

// End a match (admin/moderator — official lifecycle control)
router.post('/:id/end', authenticateToken, requireRole('admin', 'moderator'), asyncHandler(async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { winnerId, finalScores } = req.body;

  if (isNaN(matchId)) {
    throw validationError('Invalid match ID');
  }

  const match = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match.length) {
    throw notFoundError('Match');
  }

  if (match[0].status !== 'live') {
    throw validationError('Only live matches can be ended');
  }

  // Update match
  const [updatedMatch] = await db
    .update(matches)
    .set({
      status: 'completed',
      endTime: new Date(),
      winnerId: winnerId || null,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId))
    .returning();

  // Update participant scores if provided
  if (finalScores && Array.isArray(finalScores)) {
    for (const score of finalScores) {
      await db
        .update(matchParticipants)
        .set({
          score: score.score.toString(),
          isWinner: score.teamId === winnerId,
        })
        .where(and(
          eq(matchParticipants.matchId, matchId),
          eq(matchParticipants.teamId, score.teamId)
        ));
    }
  }

  logger.info(`Match ended: ${updatedMatch.topic} (ID: ${updatedMatch.id})`);

  // Broadcast match end
  broadcastMatchUpdate(matchId, {
    type: 'match_ended',
    match: updatedMatch,
    winner: winnerId,
  });

  res.json({
    message: 'Match ended successfully',
    match: updatedMatch,
  });
}));

// Add battle event (admin/moderator)
router.post('/:id/events', authenticateToken, requireRole('admin', 'moderator'), asyncHandler(async (req, res) => {
  const matchId = parseInt(req.params.id);
  const { round, agentId, teamId, eventType, content, metadata } = req.body;

  if (isNaN(matchId)) {
    throw validationError('Invalid match ID');
  }

  // Validate required fields
  if (!round || !eventType) {
    throw validationError('Round and event type are required');
  }

  // Verify match exists and is live
  const match = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match.length) {
    throw notFoundError('Match');
  }

  if (match[0].status !== 'live') {
    throw validationError('Can only add events to live matches');
  }

  // Create battle event
  const [newEvent] = await db
    .insert(battleEvents)
    .values({
      matchId,
      round,
      agentId: agentId || null,
      teamId: teamId || null,
      eventType,
      content: content || null,
      metadata: metadata || null,
    })
    .returning();

  logger.debug(`Battle event added to match ${matchId}: ${eventType}`);

  // Broadcast battle event
  broadcastBattleEvent(matchId, {
    type: 'battle_event',
    event: newEvent,
  });

  res.status(201).json({
    message: 'Battle event added successfully',
    event: newEvent,
  });
}));

// Get match statistics
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const matchId = parseInt(req.params.id);

  if (isNaN(matchId)) {
    throw validationError('Invalid match ID');
  }

  const match = await db
    .select()
    .from(matches)
    .where(eq(matches.id, matchId))
    .limit(1);

  if (!match.length) {
    throw notFoundError('Match');
  }

  // Get event counts by type
  const eventStats = await db
    .select({
      eventType: battleEvents.eventType,
      count: sql<number>`count(*)`,
    })
    .from(battleEvents)
    .where(eq(battleEvents.matchId, matchId))
    .groupBy(battleEvents.eventType);

  // Get peak viewers
  const peakViewers = match[0].peakViewers;

  // Get current viewers if match is live
  let currentViewers = 0;
  if (match[0].status === 'live') {
    const viewerResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(liveViewers)
      .where(and(
        eq(liveViewers.matchId, matchId),
        eq(liveViewers.isActive, true)
      ));

    currentViewers = viewerResult[0]?.count || 0;
  }

  res.json({
    match: match[0],
    eventStats,
    peakViewers,
    currentViewers,
  });
}));

export default router;