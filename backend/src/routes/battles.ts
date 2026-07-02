import { Router } from 'express';
import { eq, sql, and } from 'drizzle-orm';
import {
  db,
  matches,
  matchParticipants,
  teams,
  agents,
  teamAgents,
  battleEvents,
  ratingHistory
} from '../db/index.js';
import { asyncHandler, notFoundError, validationError, forbiddenError } from '../middleware/error.js';
import { logger } from '../utils/logger.js';
import { calculateElo, MatchOutcome } from '../utils/elo.js';
import { authenticateToken } from '../middleware/auth.js';
import { broadcastBattleEvent, broadcastMatchUpdate } from '../services/websocket.js';

const router = Router();

// Start a battle (admin/moderator only)
router.post('/:matchId/start', authenticateToken, asyncHandler(async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const userRole = (req as any).user.role;

  if (!['admin', 'moderator'].includes(userRole)) {
    throw forbiddenError('Only admins and moderators can start battles');
  }

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

  if (match[0].status !== 'pending') {
    throw validationError('Only pending matches can be started');
  }

  // Get match participants
  const participants = await db
    .select({
      teamId: matchParticipants.teamId,
      teamName: teams.name,
      side: matchParticipants.side,
    })
    .from(matchParticipants)
    .innerJoin(teams, eq(matchParticipants.teamId, teams.id))
    .where(eq(matchParticipants.matchId, matchId));

  if (participants.length !== 2) {
    throw validationError('Match must have exactly 2 teams to start');
  }

  // Update match status to live
  const [updatedMatch] = await db
    .update(matches)
    .set({
      status: 'live',
      startTime: new Date(),
      currentRound: 1,
      updatedAt: new Date(),
    })
    .where(eq(matches.id, matchId))
    .returning();

  // Create battle start event
  await db.insert(battleEvents).values({
    matchId,
    round: 1,
    eventType: 'battle_start',
    content: `Battle started between ${participants[0].teamName} and ${participants[1].teamName}`,
    metadata: {
      startedBy: (req as any).user.username,
      participants: participants.map(p => ({ teamId: p.teamId, teamName: p.teamName, side: p.side })),
    },
  });

  logger.info(`Battle started: Match ${matchId} - ${participants[0].teamName} vs ${participants[1].teamName}`);

  // Broadcast battle start
  broadcastMatchUpdate(matchId, {
    type: 'battle_started',
    match: updatedMatch,
    participants,
  });

  res.json({
    message: 'Battle started successfully',
    match: updatedMatch,
    participants,
  });
}));

// Submit agent response in a battle
router.post('/:matchId/response', authenticateToken, asyncHandler(async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { agentId, teamId, content, round, responseTime, tokensUsed } = req.body;
  const userId = (req as any).user.userId;

  if (isNaN(matchId)) {
    throw validationError('Invalid match ID');
  }

  // Validation
  if (!agentId || !teamId || !content || !round) {
    throw validationError('Agent ID, team ID, content, and round are required');
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

  if (match[0].status !== 'live') {
    throw validationError('Can only submit responses to live matches');
  }

  if (round !== match[0].currentRound) {
    throw validationError(`Invalid round. Current round is ${match[0].currentRound}`);
  }

  // Verify team ownership or admin/moderator role
  const userRole = (req as any).user.role;
  if (!['admin', 'moderator'].includes(userRole)) {
    const teamOwnership = await db
      .select()
      .from(teams)
      .where(and(eq(teams.id, teamId), eq(teams.ownerId, userId)))
      .limit(1);

    if (!teamOwnership.length) {
      throw forbiddenError('You can only submit responses for your own teams');
    }
  }

  // Verify agent belongs to team
  const teamAgent = await db
    .select()
    .from(teamAgents)
    .where(and(eq(teamAgents.teamId, teamId), eq(teamAgents.agentId, agentId)))
    .limit(1);

  if (!teamAgent.length) {
    throw validationError('Agent is not part of the specified team');
  }

  // Create battle event
  const [battleEvent] = await db
    .insert(battleEvents)
    .values({
      matchId,
      round,
      agentId,
      teamId,
      eventType: 'agent_response',
      content,
      metadata: {
        responseTime: responseTime || null,
        tokensUsed: tokensUsed || null,
        submittedBy: (req as any).user.username,
      },
    })
    .returning();

  logger.debug(`Agent response submitted: Match ${matchId}, Round ${round}, Agent ${agentId}`);

  // Broadcast the response
  broadcastBattleEvent(matchId, {
    type: 'agent_response',
    event: battleEvent,
    round,
    teamId,
    agentId,
  });

  res.status(201).json({
    message: 'Agent response submitted successfully',
    event: battleEvent,
  });
}));

// Score a round (admin/moderator only)
router.post('/:matchId/score', authenticateToken, asyncHandler(async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { round, scores, winnerTeamId, judgeNotes } = req.body;
  const userRole = (req as any).user.role;

  if (!['admin', 'moderator'].includes(userRole)) {
    throw forbiddenError('Only admins and moderators can score rounds');
  }

  if (isNaN(matchId)) {
    throw validationError('Invalid match ID');
  }

  if (!round || !scores || !Array.isArray(scores)) {
    throw validationError('Round and scores array are required');
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

  if (match[0].status !== 'live') {
    throw validationError('Can only score live matches');
  }

  // Update participant scores
  for (const score of scores) {
    await db
      .update(matchParticipants)
      .set({
        score: score.score.toString(),
      })
      .where(and(
        eq(matchParticipants.matchId, matchId),
        eq(matchParticipants.teamId, score.teamId)
      ));
  }

  // Create scoring event
  await db.insert(battleEvents).values({
    matchId,
    round,
    eventType: 'round_scored',
    content: judgeNotes || `Round ${round} scored`,
    metadata: {
      scores,
      winnerTeamId,
      scoredBy: (req as any).user.username,
    },
  });

  logger.info(`Round scored: Match ${matchId}, Round ${round}, Winner: ${winnerTeamId || 'Draw'}`);

  // Check if this was the final round
  const isLastRound = round >= (match[0].maxRounds ?? 1);

  if (isLastRound) {
    // Determine overall winner
    const finalScores = await db
      .select({
        teamId: matchParticipants.teamId,
        score: matchParticipants.score,
      })
      .from(matchParticipants)
      .where(eq(matchParticipants.matchId, matchId));

    const teamAScore = parseFloat(finalScores.find(s => s.teamId === finalScores[0].teamId)?.score || '0');
    const teamBScore = parseFloat(finalScores.find(s => s.teamId === finalScores[1].teamId)?.score || '0');

    let overallWinnerId = null;
    if (teamAScore > teamBScore) {
      overallWinnerId = finalScores[0].teamId;
    } else if (teamBScore > teamAScore) {
      overallWinnerId = finalScores[1].teamId;
    }

    // End the match
    await endBattle(matchId, overallWinnerId, (req as any).user.username);
  }

  // Broadcast round score
  broadcastBattleEvent(matchId, {
    type: 'round_scored',
    round,
    scores,
    winnerTeamId,
    isLastRound,
  });

  res.json({
    message: 'Round scored successfully',
    round,
    scores,
    isLastRound,
  });
}));

// End a battle (admin/moderator only)
router.post('/:matchId/end', authenticateToken, asyncHandler(async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const { winnerId, reason } = req.body;
  const userRole = (req as any).user.role;

  if (!['admin', 'moderator'].includes(userRole)) {
    throw forbiddenError('Only admins and moderators can end battles');
  }

  if (isNaN(matchId)) {
    throw validationError('Invalid match ID');
  }

  await endBattle(matchId, winnerId, (req as any).user.username, reason);

  res.json({
    message: 'Battle ended successfully',
  });
}));

// Get battle events for a match
router.get('/:matchId/events', asyncHandler(async (req, res) => {
  const matchId = parseInt(req.params.matchId);
  const round = req.query.round ? parseInt(req.query.round as string) : undefined;
  const eventType = req.query.eventType as string;

  if (isNaN(matchId)) {
    throw validationError('Invalid match ID');
  }

  let query = db
    .select({
      id: battleEvents.id,
      round: battleEvents.round,
      eventType: battleEvents.eventType,
      content: battleEvents.content,
      metadata: battleEvents.metadata,
      timestamp: battleEvents.timestamp,
      agentName: agents.name,
      teamName: teams.name,
    })
    .from(battleEvents)
    .leftJoin(agents, eq(battleEvents.agentId, agents.id))
    .leftJoin(teams, eq(battleEvents.teamId, teams.id));

  // Collect filters into one where() — chained .where() calls replace each other
  const conditions = [eq(battleEvents.matchId, matchId)];
  if (round !== undefined && !isNaN(round)) {
    conditions.push(eq(battleEvents.round, round));
  }
  if (eventType) {
    conditions.push(eq(battleEvents.eventType, eventType));
  }

  const events = await query.where(and(...conditions)).orderBy(battleEvents.timestamp);

  res.json({
    matchId,
    events,
  });
}));

// Get battle statistics
router.get('/stats', asyncHandler(async (req, res) => {
  const timeframe = req.query.timeframe as string || 'week'; // day, week, month, all

  let timeCondition = sql`true`;
  if (timeframe === 'day') {
    timeCondition = sql`${matches.startTime} >= current_date - interval '1 day'`;
  } else if (timeframe === 'week') {
    timeCondition = sql`${matches.startTime} >= current_date - interval '1 week'`;
  } else if (timeframe === 'month') {
    timeCondition = sql`${matches.startTime} >= current_date - interval '1 month'`;
  }

  // Total battles
  const totalBattlesResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches)
    .where(and(eq(matches.status, 'completed'), timeCondition));

  // Average battle duration
  const avgDurationResult = await db
    .select({
      avgDuration: sql<number>`avg(extract(epoch from (${matches.endTime} - ${matches.startTime})))`
    })
    .from(matches)
    .where(and(eq(matches.status, 'completed'), timeCondition));

  // Most active agents
  const agentActivityResult = await db
    .select({
      agentName: agents.name,
      eventCount: sql<number>`count(*)`,
    })
    .from(battleEvents)
    .innerJoin(agents, eq(battleEvents.agentId, agents.id))
    .innerJoin(matches, eq(battleEvents.matchId, matches.id))
    .where(timeCondition)
    .groupBy(agents.id, agents.name)
    .orderBy(sql`count(*) desc`)
    .limit(10);

  // Battle outcomes
  const outcomesResult = await db
    .select({
      outcome: sql<string>`
        case
          when ${matches.winnerId} is null then 'draw'
          else 'decided'
        end
      `,
      count: sql<number>`count(*)`,
    })
    .from(matches)
    .where(and(eq(matches.status, 'completed'), timeCondition))
    .groupBy(sql`
      case
        when ${matches.winnerId} is null then 'draw'
        else 'decided'
      end
    `);

  res.json({
    timeframe,
    totalBattles: totalBattlesResult[0]?.count || 0,
    avgDurationSeconds: Math.round(avgDurationResult[0]?.avgDuration || 0),
    mostActiveAgents: agentActivityResult,
    battleOutcomes: outcomesResult,
  });
}));

// Helper function to end a battle
async function endBattle(matchId: number, winnerId: number | null, endedBy: string, reason?: string) {
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

  // Update winner status for participants
  await db
    .update(matchParticipants)
    .set({ isWinner: false })
    .where(eq(matchParticipants.matchId, matchId));

  if (winnerId) {
    await db
      .update(matchParticipants)
      .set({ isWinner: true })
      .where(and(
        eq(matchParticipants.matchId, matchId),
        eq(matchParticipants.teamId, winnerId)
      ));
  }

  // Update team statistics and ratings
  await updateTeamRatings(matchId, winnerId);

  // Create battle end event
  await db.insert(battleEvents).values({
    matchId,
    round: updatedMatch.currentRound,
    eventType: 'battle_end',
    content: reason || 'Battle completed',
    metadata: {
      winnerId,
      endedBy,
      reason,
    },
  });

  logger.info(`Battle ended: Match ${matchId}, Winner: ${winnerId || 'Draw'}`);

  // Broadcast battle end
  broadcastMatchUpdate(matchId, {
    type: 'battle_ended',
    match: updatedMatch,
    winnerId,
  });
}

// Helper function to update team ratings using ELO system
async function updateTeamRatings(matchId: number, winnerId: number | null) {
  const K_FACTOR = parseInt(process.env.RATING_K_FACTOR || '32', 10);

  // Get match participants
  const participants = await db
    .select({
      teamId: matchParticipants.teamId,
      currentRating: teams.rating,
    })
    .from(matchParticipants)
    .innerJoin(teams, eq(matchParticipants.teamId, teams.id))
    .where(eq(matchParticipants.matchId, matchId));

  if (participants.length !== 2) return;

  const teamA = participants[0];
  const teamB = participants[1];

  const outcome: MatchOutcome =
    winnerId === teamA.teamId ? 'A' : winnerId === teamB.teamId ? 'B' : 'draw';

  const { newRatingA, newRatingB, scoreA, scoreB } = calculateElo(
    teamA.currentRating,
    teamB.currentRating,
    outcome,
    K_FACTOR
  );

  // Update team A
  await db
    .update(teams)
    .set({
      rating: newRatingA,
      wins: sql`${teams.wins} + ${scoreA === 1 ? 1 : 0}`,
      losses: sql`${teams.losses} + ${scoreA === 0 ? 1 : 0}`,
      draws: sql`${teams.draws} + ${scoreA === 0.5 ? 1 : 0}`,
      currentStreak: scoreA === 1
        ? sql`case when ${teams.currentStreak} >= 0 then ${teams.currentStreak} + 1 else 1 end`
        : scoreA === 0
        ? sql`case when ${teams.currentStreak} <= 0 then ${teams.currentStreak} - 1 else -1 end`
        : sql`0`,
      longestWinStreak: scoreA === 1
        ? sql`greatest(${teams.longestWinStreak}, case when ${teams.currentStreak} >= 0 then ${teams.currentStreak} + 1 else 1 end)`
        : sql`${teams.longestWinStreak}`,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamA.teamId));

  // Update team B
  await db
    .update(teams)
    .set({
      rating: newRatingB,
      wins: sql`${teams.wins} + ${scoreB === 1 ? 1 : 0}`,
      losses: sql`${teams.losses} + ${scoreB === 0 ? 1 : 0}`,
      draws: sql`${teams.draws} + ${scoreB === 0.5 ? 1 : 0}`,
      currentStreak: scoreB === 1
        ? sql`case when ${teams.currentStreak} >= 0 then ${teams.currentStreak} + 1 else 1 end`
        : scoreB === 0
        ? sql`case when ${teams.currentStreak} <= 0 then ${teams.currentStreak} - 1 else -1 end`
        : sql`0`,
      longestWinStreak: scoreB === 1
        ? sql`greatest(${teams.longestWinStreak}, case when ${teams.currentStreak} >= 0 then ${teams.currentStreak} + 1 else 1 end)`
        : sql`${teams.longestWinStreak}`,
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamB.teamId));

  // Record rating history
  await db.insert(ratingHistory).values([
    {
      teamId: teamA.teamId,
      matchId,
      oldRating: teamA.currentRating,
      newRating: newRatingA,
      ratingChange: newRatingA - teamA.currentRating,
      reason: 'match_result',
    },
    {
      teamId: teamB.teamId,
      matchId,
      oldRating: teamB.currentRating,
      newRating: newRatingB,
      ratingChange: newRatingB - teamB.currentRating,
      reason: 'match_result',
    },
  ]);

  logger.debug(`Ratings updated - Team ${teamA.teamId}: ${teamA.currentRating} → ${newRatingA}, Team ${teamB.teamId}: ${teamB.currentRating} → ${newRatingB}`);
}

export default router;