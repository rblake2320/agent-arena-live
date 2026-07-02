import { Router } from 'express';
import { eq, desc, sql, ilike, and, inArray } from 'drizzle-orm';
import { db, agents, teamAgents, teams } from '../db/index.js';
import { asyncHandler, notFoundError, validationError } from '../middleware/error.js';
import { logger } from '../utils/logger.js';

const router = Router();

// Get all agents with filtering and pagination
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
  const offset = (page - 1) * limit;
  const provider = req.query.provider as string;
  const search = req.query.search as string;
  const isActive = req.query.isActive as string;

  let query = db.select().from(agents);

  // Apply filters
  const conditions = [];

  if (provider) {
    conditions.push(eq(agents.provider, provider));
  }

  if (search) {
    conditions.push(ilike(agents.name, `%${search}%`));
  }

  if (isActive !== undefined) {
    conditions.push(eq(agents.isActive, isActive === 'true'));
  }

  if (conditions.length > 0) {
    query = query.where(and(...conditions));
  }

  const allAgents = await query
    .orderBy(agents.provider, agents.name)
    .limit(limit)
    .offset(offset);

  // Get total count for pagination
  let countQuery = db.select({ count: sql<number>`count(*)` }).from(agents);
  if (conditions.length > 0) {
    countQuery = countQuery.where(and(...conditions));
  }

  const totalResult = await countQuery;
  const total = totalResult[0]?.count || 0;

  // Get team count for each agent
  const agentIds = allAgents.map(agent => agent.id);
  const teamCounts = agentIds.length > 0 ? await db
    .select({
      agentId: teamAgents.agentId,
      teamCount: sql<number>`count(*)`,
    })
    .from(teamAgents)
    .where(inArray(teamAgents.agentId, agentIds))
    .groupBy(teamAgents.agentId) : [];

  const teamCountMap = teamCounts.reduce((acc, tc) => {
    acc[tc.agentId] = tc.teamCount;
    return acc;
  }, {} as Record<number, number>);

  // Enrich agents with team count
  const enrichedAgents = allAgents.map(agent => ({
    ...agent,
    teamCount: teamCountMap[agent.id] || 0,
  }));

  res.json({
    agents: enrichedAgents,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    },
  });
}));

// Get agent by ID with detailed information
router.get('/:id', asyncHandler(async (req, res) => {
  const agentId = parseInt(req.params.id);

  if (isNaN(agentId)) {
    throw validationError('Invalid agent ID');
  }

  const agent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent.length) {
    throw notFoundError('Agent');
  }

  // Get teams using this agent
  const agentTeams = await db
    .select({
      teamId: teams.id,
      teamName: teams.name,
      teamOwner: teams.owner,
      teamRating: teams.rating,
      role: teamAgents.role,
      addedAt: teamAgents.addedAt,
    })
    .from(teamAgents)
    .innerJoin(teams, eq(teamAgents.teamId, teams.id))
    .where(eq(teamAgents.agentId, agentId))
    .orderBy(desc(teams.rating));

  res.json({
    agent: agent[0],
    teams: agentTeams,
  });
}));

// Get agent statistics
router.get('/:id/stats', asyncHandler(async (req, res) => {
  const agentId = parseInt(req.params.id);

  if (isNaN(agentId)) {
    throw validationError('Invalid agent ID');
  }

  const agent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!agent.length) {
    throw notFoundError('Agent');
  }

  // Get total teams using this agent
  const teamCountResult = await db
    .select({ count: sql<number>`count(*)` })
    .from(teamAgents)
    .where(eq(teamAgents.agentId, agentId));

  const teamCount = teamCountResult[0]?.count || 0;

  // Get average rating of teams using this agent
  const avgRatingResult = await db
    .select({ avgRating: sql<number>`avg(${teams.rating})` })
    .from(teamAgents)
    .innerJoin(teams, eq(teamAgents.teamId, teams.id))
    .where(eq(teamAgents.agentId, agentId));

  const avgRating = avgRatingResult[0]?.avgRating || 0;

  // Get win/loss stats for teams using this agent
  const winLossResult = await db
    .select({
      totalWins: sql<number>`sum(${teams.wins})`,
      totalLosses: sql<number>`sum(${teams.losses})`,
      totalDraws: sql<number>`sum(${teams.draws})`,
    })
    .from(teamAgents)
    .innerJoin(teams, eq(teamAgents.teamId, teams.id))
    .where(eq(teamAgents.agentId, agentId));

  const winLossStats = winLossResult[0] || { totalWins: 0, totalLosses: 0, totalDraws: 0 };
  const totalMatches = winLossStats.totalWins + winLossStats.totalLosses + winLossStats.totalDraws;
  const winRate = totalMatches > 0 ? (winLossStats.totalWins / totalMatches) * 100 : 0;

  res.json({
    agent: agent[0],
    stats: {
      teamCount,
      averageTeamRating: Math.round(avgRating * 100) / 100,
      totalMatches,
      totalWins: winLossStats.totalWins,
      totalLosses: winLossStats.totalLosses,
      totalDraws: winLossStats.totalDraws,
      winRate: Math.round(winRate * 100) / 100,
    },
  });
}));

// Create new agent
router.post('/', asyncHandler(async (req, res) => {
  const {
    name,
    provider,
    version,
    capabilities,
    maxTokens,
    costPerToken,
    description
  } = req.body;

  // Validation
  if (!name || name.trim().length < 2) {
    throw validationError('Agent name must be at least 2 characters long');
  }

  if (!provider || provider.trim().length < 2) {
    throw validationError('Provider must be specified');
  }

  // Validate capabilities if provided
  if (capabilities && !Array.isArray(capabilities)) {
    throw validationError('Capabilities must be an array');
  }

  // Validate numeric fields
  if (maxTokens !== undefined && (isNaN(maxTokens) || maxTokens <= 0)) {
    throw validationError('Max tokens must be a positive number');
  }

  if (costPerToken !== undefined && (isNaN(costPerToken) || costPerToken < 0)) {
    throw validationError('Cost per token must be a non-negative number');
  }

  try {
    const [newAgent] = await db
      .insert(agents)
      .values({
        name: name.trim(),
        provider: provider.trim().toLowerCase(),
        version: version?.trim(),
        capabilities: capabilities || null,
        maxTokens: maxTokens || null,
        costPerToken: costPerToken?.toString() || null,
        description: description?.trim() || null,
        isActive: true,
      })
      .returning();

    logger.info(`Agent created: ${newAgent.name} (ID: ${newAgent.id})`);

    res.status(201).json({
      message: 'Agent created successfully',
      agent: newAgent,
    });
  } catch (error: any) {
    if (error.message.includes('duplicate key')) {
      throw validationError('Agent name already exists');
    }
    throw error;
  }
}));

// Update agent
router.put('/:id', asyncHandler(async (req, res) => {
  const agentId = parseInt(req.params.id);
  const {
    name,
    provider,
    version,
    capabilities,
    maxTokens,
    costPerToken,
    description,
    isActive
  } = req.body;

  if (isNaN(agentId)) {
    throw validationError('Invalid agent ID');
  }

  const existingAgent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!existingAgent.length) {
    throw notFoundError('Agent');
  }

  // Validation
  if (name && name.trim().length < 2) {
    throw validationError('Agent name must be at least 2 characters long');
  }

  if (provider && provider.trim().length < 2) {
    throw validationError('Provider must be specified');
  }

  if (capabilities && !Array.isArray(capabilities)) {
    throw validationError('Capabilities must be an array');
  }

  if (maxTokens !== undefined && (isNaN(maxTokens) || maxTokens <= 0)) {
    throw validationError('Max tokens must be a positive number');
  }

  if (costPerToken !== undefined && (isNaN(costPerToken) || costPerToken < 0)) {
    throw validationError('Cost per token must be a non-negative number');
  }

  try {
    const [updatedAgent] = await db
      .update(agents)
      .set({
        ...(name && { name: name.trim() }),
        ...(provider && { provider: provider.trim().toLowerCase() }),
        ...(version !== undefined && { version: version?.trim() || null }),
        ...(capabilities !== undefined && { capabilities }),
        ...(maxTokens !== undefined && { maxTokens }),
        ...(costPerToken !== undefined && { costPerToken: costPerToken?.toString() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(isActive !== undefined && { isActive }),
        updatedAt: new Date(),
      })
      .where(eq(agents.id, agentId))
      .returning();

    logger.info(`Agent updated: ${updatedAgent.name} (ID: ${updatedAgent.id})`);

    res.json({
      message: 'Agent updated successfully',
      agent: updatedAgent,
    });
  } catch (error: any) {
    if (error.message.includes('duplicate key')) {
      throw validationError('Agent name already exists');
    }
    throw error;
  }
}));

// Delete agent (soft delete - mark as inactive)
router.delete('/:id', asyncHandler(async (req, res) => {
  const agentId = parseInt(req.params.id);

  if (isNaN(agentId)) {
    throw validationError('Invalid agent ID');
  }

  const existingAgent = await db
    .select()
    .from(agents)
    .where(eq(agents.id, agentId))
    .limit(1);

  if (!existingAgent.length) {
    throw notFoundError('Agent');
  }

  // Check if agent is used by any teams
  const teamCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(teamAgents)
    .where(eq(teamAgents.agentId, agentId));

  if (teamCount[0]?.count > 0) {
    throw validationError(`Agent cannot be deleted as it is used by ${teamCount[0].count} team(s)`);
  }

  // Soft delete by marking as inactive
  await db
    .update(agents)
    .set({
      isActive: false,
      updatedAt: new Date(),
    })
    .where(eq(agents.id, agentId));

  logger.info(`Agent deactivated: ${existingAgent[0].name} (ID: ${agentId})`);

  res.json({
    message: 'Agent deactivated successfully',
  });
}));

// Get agents by provider
router.get('/provider/:provider', asyncHandler(async (req, res) => {
  const provider = req.params.provider.toLowerCase();

  const providerAgents = await db
    .select()
    .from(agents)
    .where(and(
      eq(agents.provider, provider),
      eq(agents.isActive, true)
    ))
    .orderBy(agents.name);

  res.json({
    provider,
    agents: providerAgents,
  });
}));

// Get all available providers
router.get('/providers/list', asyncHandler(async (req, res) => {
  const providers = await db
    .select({
      provider: agents.provider,
      count: sql<number>`count(*)`,
    })
    .from(agents)
    .where(eq(agents.isActive, true))
    .groupBy(agents.provider)
    .orderBy(agents.provider);

  res.json({
    providers: providers.map(p => ({
      name: p.provider,
      agentCount: p.count,
    })),
  });
}));

export default router;