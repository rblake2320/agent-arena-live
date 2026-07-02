import { Router } from 'express';
import { eq, desc, sql, and } from 'drizzle-orm';
import { db, teams, ratingHistory, matches, matchParticipants } from '../db/index.js';
import { asyncHandler, validationError } from '../middleware/error.js';
import { logger } from '../utils/logger.js';
import { broadcastLeaderboardUpdate } from '../services/websocket.js';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const router = Router();

// Get global leaderboard
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const timeframe = req.query.timeframe as string || 'all'; // all, week, month

  let query = db
    .select({
      id: teams.id,
      name: teams.name,
      owner: teams.owner,
      rating: teams.rating,
      wins: teams.wins,
      losses: teams.losses,
      draws: teams.draws,
      currentStreak: teams.currentStreak,
      longestWinStreak: teams.longestWinStreak,
      updatedAt: teams.updatedAt,
    })
    .from(teams)
    .where(eq(teams.isActive, true))
    .orderBy(desc(teams.rating))
    .limit(limit)
    .offset(offset);

  const topTeams = await query;

  // Calculate additional stats for each team
  const enrichedTeams = await Promise.all(
    topTeams.map(async (team, index) => {
      // Calculate rank (considering pagination)
      const rank = offset + index + 1;

      // Calculate total matches and win rate
      const totalMatches = team.wins + team.losses + team.draws;
      const winRate = totalMatches > 0 ? (team.wins / totalMatches) * 100 : 0;

      // Get 24-hour rating change
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentRatingHistory = await db
        .select({
          oldRating: ratingHistory.oldRating,
          newRating: ratingHistory.newRating,
        })
        .from(ratingHistory)
        .where(and(
          eq(ratingHistory.teamId, team.id),
          sql`${ratingHistory.createdAt} >= ${yesterday}`
        ))
        .orderBy(ratingHistory.createdAt)
        .limit(1);

      const ratingChange = recentRatingHistory.length > 0
        ? team.rating - recentRatingHistory[0].oldRating
        : 0;

      // Determine badge based on rank
      let badge = null;
      if (rank === 1) badge = 'crown';
      else if (rank <= 3) badge = 'medal';

      // Format streak
      const streakSign = team.currentStreak >= 0 ? '+' : '';
      const streak = `${streakSign}${team.currentStreak}`;

      // Format rating change
      const changeSign = ratingChange >= 0 ? '+' : '';
      const change = `${changeSign}${ratingChange}`;

      return {
        rank,
        name: team.name,
        owner: team.owner,
        rating: team.rating,
        wins: team.wins,
        losses: team.losses,
        draws: team.draws,
        streak,
        change,
        badge,
        winRate: Math.round(winRate * 100) / 100,
        totalMatches,
        lastUpdated: team.updatedAt,
      };
    })
  );

  // Get total count for pagination
  const totalResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams)
    .where(eq(teams.isActive, true));

  const total = totalResult[0]?.count || 0;

  res.json({
    leaderboard: enrichedTeams,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
    lastUpdated: new Date().toISOString(),
  });
}));

// Get top teams (simplified for homepage)
router.get('/top', asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  const topTeams = await db
    .select({
      rank: sql<number>`row_number() over (order by ${teams.rating} desc)`,
      id: teams.id,
      name: teams.name,
      owner: teams.owner,
      rating: teams.rating,
      wins: teams.wins,
      losses: teams.losses,
      currentStreak: teams.currentStreak,
    })
    .from(teams)
    .where(eq(teams.isActive, true))
    .orderBy(desc(teams.rating))
    .limit(limit);

  // Format for frontend consumption
  const formattedTeams = topTeams.map(team => {
    // row_number() comes back from postgres as a string — normalize it
    const rank = Number(team.rank);
    const totalMatches = team.wins + team.losses;
    const winRate = totalMatches > 0 ? (team.wins / totalMatches) * 100 : 0;

    let badge = null;
    if (rank === 1) badge = 'crown';
    else if (rank <= 3) badge = 'medal';

    const streakSign = team.currentStreak >= 0 ? '+' : '';
    const streak = `${streakSign}${team.currentStreak}`;

    return {
      rank,
      name: team.name,
      owner: team.owner,
      rating: team.rating,
      wins: team.wins,
      losses: team.losses,
      streak,
      badge,
      winRate: Math.round(winRate * 100) / 100,
    };
  });

  res.json({
    topTeams: formattedTeams,
    lastUpdated: new Date().toISOString(),
  });
}));

// Get rating history for a specific team
router.get('/:teamId/history', asyncHandler(async (req, res) => {
  const teamId = parseInt(req.params.teamId);
  const days = Math.min(parseInt(req.query.days as string) || 30, 365);

  if (isNaN(teamId)) {
    throw validationError('Invalid team ID');
  }

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const history = await db
    .select({
      date: ratingHistory.createdAt,
      oldRating: ratingHistory.oldRating,
      newRating: ratingHistory.newRating,
      change: ratingHistory.ratingChange,
      reason: ratingHistory.reason,
      matchId: ratingHistory.matchId,
    })
    .from(ratingHistory)
    .where(and(
      eq(ratingHistory.teamId, teamId),
      sql`${ratingHistory.createdAt} >= ${startDate}`
    ))
    .orderBy(ratingHistory.createdAt);

  res.json({
    teamId,
    history,
    period: `${days} days`,
  });
}));

// Get leaderboard statistics
router.get('/stats', asyncHandler(async (req, res) => {
  // Get total teams
  const totalTeamsResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams)
    .where(eq(teams.isActive, true));

  const totalTeams = totalTeamsResult[0]?.count || 0;

  // Get rating distribution
  const ratingDistribution = await db
    .select({
      range: sql<string>`
        case
          when ${teams.rating} < 1200 then 'Bronze'
          when ${teams.rating} < 1400 then 'Silver'
          when ${teams.rating} < 1600 then 'Gold'
          when ${teams.rating} < 1800 then 'Platinum'
          when ${teams.rating} < 2000 then 'Diamond'
          else 'Master'
        end
      `,
      count: sql<number>`count(*)`,
    })
    .from(teams)
    .where(eq(teams.isActive, true))
    .groupBy(sql`
      case
        when ${teams.rating} < 1200 then 'Bronze'
        when ${teams.rating} < 1400 then 'Silver'
        when ${teams.rating} < 1600 then 'Gold'
        when ${teams.rating} < 1800 then 'Platinum'
        when ${teams.rating} < 2000 then 'Diamond'
        else 'Master'
      end
    `);

  // Get recent matches count
  const recentMatches = await db
    .select({ count: sql<number>`count(*)` })
    .from(matches)
    .where(sql`${matches.createdAt} >= current_date - interval '7 days'`);

  // Get highest rated team
  const highestRatedTeam = await db
    .select({
      name: teams.name,
      rating: teams.rating,
    })
    .from(teams)
    .where(eq(teams.isActive, true))
    .orderBy(desc(teams.rating))
    .limit(1);

  // Get most active team (most matches in last 30 days)
  const mostActiveTeam = await db
    .select({
      teamName: teams.name,
      matchCount: sql<number>`count(*)`,
    })
    .from(matchParticipants)
    .innerJoin(teams, eq(matchParticipants.teamId, teams.id))
    .innerJoin(matches, eq(matchParticipants.matchId, matches.id))
    .where(sql`${matches.createdAt} >= current_date - interval '30 days'`)
    .groupBy(teams.id, teams.name)
    .orderBy(sql`count(*) desc`)
    .limit(1);

  res.json({
    totalTeams,
    ratingDistribution,
    recentMatchesCount: recentMatches[0]?.count || 0,
    highestRatedTeam: highestRatedTeam[0] || null,
    mostActiveTeam: mostActiveTeam[0] || null,
    lastUpdated: new Date().toISOString(),
  });
}));

// Update leaderboard rankings (admin/moderator only)
router.post('/update-rankings', authenticateToken, requireRole('admin', 'moderator'), asyncHandler(async (req, res) => {
  logger.info('Updating leaderboard rankings...');

  // Get all teams ordered by rating
  const allTeams = await db
    .select({
      id: teams.id,
      rating: teams.rating,
    })
    .from(teams)
    .where(eq(teams.isActive, true))
    .orderBy(desc(teams.rating));

  // Update ranks
  for (let i = 0; i < allTeams.length; i++) {
    const rank = i + 1;
    await db
      .update(teams)
      .set({
        rank,
        updatedAt: new Date(),
      })
      .where(eq(teams.id, allTeams[i].id));
  }

  // Get updated top teams for broadcast
  const topUpdatedTeams = await db
    .select()
    .from(teams)
    .where(eq(teams.isActive, true))
    .orderBy(teams.rank)
    .limit(10);

  // Broadcast leaderboard update
  broadcastLeaderboardUpdate({
    type: 'rankings_updated',
    topTeams: topUpdatedTeams,
    updatedAt: new Date().toISOString(),
  });

  logger.info(`Updated rankings for ${allTeams.length} teams`);

  res.json({
    message: 'Leaderboard rankings updated successfully',
    teamsUpdated: allTeams.length,
    updatedAt: new Date().toISOString(),
  });
}));

// Get team rank changes over time
router.get('/rank-changes', asyncHandler(async (req, res) => {
  const days = Math.min(parseInt(req.query.days as string) || 7, 30);
  const limit = Math.min(parseInt(req.query.limit as string) || 10, 50);

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  // Get teams with significant rank changes
  const rankChanges = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      currentRating: teams.rating,
      currentRank: teams.rank,
      ratingChange: sql<number>`
        ${teams.rating} - (
          select ${ratingHistory.oldRating}
          from ${ratingHistory}
          where ${ratingHistory.teamId} = ${teams.id}
          and ${ratingHistory.createdAt} >= ${startDate}
          order by ${ratingHistory.createdAt}
          limit 1
        )
      `,
    })
    .from(teams)
    .where(eq(teams.isActive, true))
    .orderBy(sql`abs(${teams.rating} - coalesce((
      select ${ratingHistory.oldRating}
      from ${ratingHistory}
      where ${ratingHistory.teamId} = ${teams.id}
      and ${ratingHistory.createdAt} >= ${startDate}
      order by ${ratingHistory.createdAt}
      limit 1
    ), ${teams.rating})) desc`)
    .limit(limit);

  res.json({
    rankChanges: rankChanges.filter(change => change.ratingChange !== null),
    period: `${days} days`,
    lastUpdated: new Date().toISOString(),
  });
}));

export default router;