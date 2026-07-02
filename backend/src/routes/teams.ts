import { Router } from 'express';
import { eq, desc, sql } from 'drizzle-orm';
import { db, teams, teamAgents, agents, ratingHistory } from '../db/index.js';
import { asyncHandler, notFoundError, validationError, forbiddenError } from '../middleware/error.js';
import { logger } from '../utils/logger.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// Owner or admin/moderator may modify a team
async function assertCanManageTeam(teamId: number, user: { userId: number; role: string }) {
  const team = await db.select().from(teams).where(eq(teams.id, teamId)).limit(1);

  if (!team.length) {
    throw notFoundError('Team');
  }

  const isPrivileged = ['admin', 'moderator'].includes(user.role);
  if (!isPrivileged && team[0].ownerId !== user.userId) {
    throw forbiddenError('You can only manage your own teams');
  }

  return team[0];
}

// Get all teams with pagination and filtering
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 20, 100);
  const offset = (page - 1) * limit;
  const sortBy = (req.query.sortBy as string) || 'rating';
  const order = (req.query.order as string) === 'asc' ? 'asc' : 'desc';
  const search = req.query.search as string;

  let query = db.select({
    id: teams.id,
    name: teams.name,
    owner: teams.owner,
    description: teams.description,
    logo: teams.logo,
    rating: teams.rating,
    wins: teams.wins,
    losses: teams.losses,
    draws: teams.draws,
    currentStreak: teams.currentStreak,
    longestWinStreak: teams.longestWinStreak,
    rank: teams.rank,
    isActive: teams.isActive,
    createdAt: teams.createdAt,
    updatedAt: teams.updatedAt,
  }).from(teams).$dynamic();

  // Add search filter
  if (search) {
    query = query.where(
      sql`${teams.name} ILIKE ${'%' + search + '%'} OR ${teams.owner} ILIKE ${'%' + search + '%'}`
    );
  }

  // Add sorting
  if (sortBy === 'rating') {
    query = order === 'desc' ? query.orderBy(desc(teams.rating)) : query.orderBy(teams.rating);
  } else if (sortBy === 'wins') {
    query = order === 'desc' ? query.orderBy(desc(teams.wins)) : query.orderBy(teams.wins);
  } else if (sortBy === 'rank') {
    query = query.orderBy(teams.rank);
  } else {
    query = query.orderBy(desc(teams.createdAt));
  }

  const allTeams = await query.limit(limit).offset(offset);

  // Get total count for pagination
  const totalResult = await db.select({ count: sql<number>`count(*)` }).from(teams);
  const total = totalResult[0]?.count || 0;

  res.json({
    teams: allTeams,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// Get team by ID with detailed information
router.get('/:id', asyncHandler(async (req, res) => {
  const teamId = parseInt(req.params.id);

  if (isNaN(teamId)) {
    throw validationError('Invalid team ID');
  }

  // Get team details
  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team.length) {
    throw notFoundError('Team');
  }

  // Get team's agents
  const teamAgentsData = await db
    .select({
      agentId: agents.id,
      name: agents.name,
      provider: agents.provider,
      version: agents.version,
      capabilities: agents.capabilities,
      role: teamAgents.role,
      addedAt: teamAgents.addedAt,
    })
    .from(teamAgents)
    .innerJoin(agents, eq(teamAgents.agentId, agents.id))
    .where(eq(teamAgents.teamId, teamId));

  // Get recent rating history
  const recentRatingHistory = await db
    .select()
    .from(ratingHistory)
    .where(eq(ratingHistory.teamId, teamId))
    .orderBy(desc(ratingHistory.createdAt))
    .limit(10);

  res.json({
    team: team[0],
    agents: teamAgentsData,
    ratingHistory: recentRatingHistory,
  });
}));

// Create new team (authenticated — the caller becomes the owner)
router.post('/', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const { name, description, logo, agentIds } = req.body;
  const user = req.user!;

  // Validation
  if (!name || name.trim().length < 2) {
    throw validationError('Team name must be at least 2 characters long');
  }

  if (agentIds && (!Array.isArray(agentIds) || agentIds.length === 0)) {
    throw validationError('At least one agent must be specified');
  }

  try {
    // Create team
    const [newTeam] = await db
      .insert(teams)
      .values({
        name: name.trim(),
        owner: `@${user.username}`,
        ownerId: user.userId,
        description: description?.trim(),
        logo,
        rating: 1200, // Starting ELO rating
        wins: 0,
        losses: 0,
        draws: 0,
        currentStreak: 0,
        longestWinStreak: 0,
        isActive: true,
      })
      .returning();

    // Add agents to team if provided
    if (agentIds && agentIds.length > 0) {
      const teamAgentData = agentIds.map((agentId: number, index: number) => ({
        teamId: newTeam.id,
        agentId,
        role: index === 0 ? 'leader' : 'member',
      }));

      await db.insert(teamAgents).values(teamAgentData);
    }

    logger.info(`Team created: ${newTeam.name} (ID: ${newTeam.id})`);

    res.status(201).json({
      message: 'Team created successfully',
      team: newTeam,
    });
  } catch (error: any) {
    if (error.message.includes('duplicate key')) {
      throw validationError('Team name already exists');
    }
    throw error;
  }
}));

// Update team (owner or admin/moderator)
router.put('/:id', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const teamId = parseInt(req.params.id);
  const { name, description, logo, isActive } = req.body;

  if (isNaN(teamId)) {
    throw validationError('Invalid team ID');
  }

  await assertCanManageTeam(teamId, req.user!);

  // Update team
  const [updatedTeam] = await db
    .update(teams)
    .set({
      ...(name && { name: name.trim() }),
      ...(description !== undefined && { description: description?.trim() }),
      ...(logo !== undefined && { logo }),
      ...(isActive !== undefined && { isActive }),
      updatedAt: new Date(),
    })
    .where(eq(teams.id, teamId))
    .returning();

  logger.info(`Team updated: ${updatedTeam.name} (ID: ${updatedTeam.id})`);

  res.json({
    message: 'Team updated successfully',
    team: updatedTeam,
  });
}));

// Add agent to team (owner or admin/moderator)
router.post('/:id/agents', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const teamId = parseInt(req.params.id);
  const { agentId, role = 'member' } = req.body;

  if (isNaN(teamId) || isNaN(agentId)) {
    throw validationError('Invalid team or agent ID');
  }

  await assertCanManageTeam(teamId, req.user!);

  // Check if agent exists
  const agent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent.length) {
    throw notFoundError('Agent');
  }

  try {
    await db.insert(teamAgents).values({
      teamId,
      agentId,
      role,
    });

    res.json({
      message: 'Agent added to team successfully',
    });
  } catch (error: any) {
    if (error.message.includes('duplicate key')) {
      throw validationError('Agent is already part of this team');
    }
    throw error;
  }
}));

// Remove agent from team (owner or admin/moderator)
router.delete('/:id/agents/:agentId', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res) => {
  const teamId = parseInt(req.params.id);
  const agentId = parseInt(req.params.agentId);

  if (isNaN(teamId) || isNaN(agentId)) {
    throw validationError('Invalid team or agent ID');
  }

  await assertCanManageTeam(teamId, req.user!);

  const result = await db
    .delete(teamAgents)
    .where(sql`${teamAgents.teamId} = ${teamId} AND ${teamAgents.agentId} = ${agentId}`)
    .returning();

  if (!result.length) {
    throw notFoundError('Team-Agent association');
  }

  res.json({
    message: 'Agent removed from team successfully',
  });
}));

// Get team leaderboard position and stats
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const teamId = parseInt(req.params.id);

  if (isNaN(teamId)) {
    throw validationError('Invalid team ID');
  }

  const team = await db
    .select()
    .from(teams)
    .where(eq(teams.id, teamId))
    .limit(1);

  if (!team.length) {
    throw notFoundError('Team');
  }

  // Get team rank
  const rankQuery = await db
    .select({ count: sql<number>`count(*)` })
    .from(teams)
    .where(sql`${teams.rating} > ${team[0].rating} AND ${teams.isActive} = true`);

  const rank = (rankQuery[0]?.count || 0) + 1;

  // Calculate win rate
  const totalMatches = team[0].wins + team[0].losses + team[0].draws;
  const winRate = totalMatches > 0 ? (team[0].wins / totalMatches) * 100 : 0;

  res.json({
    team: team[0],
    rank,
    winRate: Math.round(winRate * 100) / 100,
    totalMatches,
  });
}));

export default router;