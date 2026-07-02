import { db, agents, teams, teamAgents, matchTypes, users, matches, matchParticipants } from '../db/index.js';
import { logger } from '../utils/logger.js';

async function seedDatabase() {
  logger.info('Starting database seed...');

  try {
    // Clear existing data (in reverse order due to foreign keys)
    await db.delete(matchParticipants);
    await db.delete(matches);
    await db.delete(teamAgents);
    await db.delete(teams);
    await db.delete(agents);
    await db.delete(matchTypes);
    await db.delete(users);

    logger.info('Cleared existing data');

    // Seed users
    const seedUsers = await db.insert(users).values([
      {
        username: 'craig_dev',
        email: 'craig@agentarena.com',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMOM1N4dTLLZa', // password123
        displayName: 'Craig',
        isVerified: true,
        role: 'admin',
      },
      {
        username: 'quantum_ai',
        email: 'quantum@agentarena.com',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMOM1N4dTLLZa',
        displayName: 'Quantum AI',
        isVerified: true,
        role: 'user',
      },
      {
        username: 'titan_labs',
        email: 'titan@agentarena.com',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMOM1N4dTLLZa',
        displayName: 'Titan Labs',
        isVerified: true,
        role: 'user',
      },
      {
        username: 'beast_mode',
        email: 'beast@agentarena.com',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMOM1N4dTLLZa',
        displayName: 'Beast Mode',
        isVerified: true,
        role: 'user',
      },
      {
        username: 'creative_ai',
        email: 'creative@agentarena.com',
        passwordHash: '$2b$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/lewfBMOM1N4dTLLZa',
        displayName: 'Creative AI',
        isVerified: true,
        role: 'user',
      },
    ]).returning();

    logger.info(`Created ${seedUsers.length} users`);

    // Seed agents
    const seedAgents = await db.insert(agents).values([
      {
        name: 'GPT-5-Pro',
        provider: 'openai',
        version: '5.0',
        capabilities: ['reasoning', 'coding', 'analysis', 'creativity'],
        maxTokens: 8192,
        costPerToken: '0.00001',
        description: 'Advanced reasoning and code generation model',
        isActive: true,
      },
      {
        name: 'Claude-3.5',
        provider: 'anthropic',
        version: '3.5',
        capabilities: ['reasoning', 'writing', 'analysis', 'safety'],
        maxTokens: 8192,
        costPerToken: '0.000008',
        description: 'Constitutional AI with strong reasoning capabilities',
        isActive: true,
      },
      {
        name: 'Gemini-Ultra',
        provider: 'google',
        version: '1.5',
        capabilities: ['multimodal', 'reasoning', 'coding', 'creativity'],
        maxTokens: 8192,
        costPerToken: '0.000012',
        description: 'Multimodal AI with exceptional reasoning',
        isActive: true,
      },
      {
        name: 'LLaMA-4',
        provider: 'meta',
        version: '4.0',
        capabilities: ['reasoning', 'coding', 'multilingual'],
        maxTokens: 8192,
        costPerToken: '0.000006',
        description: 'Open-source large language model',
        isActive: true,
      },
      {
        name: 'Mistral-X',
        provider: 'mistral',
        version: '2.0',
        capabilities: ['reasoning', 'coding', 'efficiency'],
        maxTokens: 8192,
        costPerToken: '0.000005',
        description: 'Efficient European AI model',
        isActive: true,
      },
      {
        name: 'DeepSeek-V3',
        provider: 'deepseek',
        version: '3.0',
        capabilities: ['coding', 'reasoning', 'research'],
        maxTokens: 8192,
        costPerToken: '0.000004',
        description: 'Specialized in code and research tasks',
        isActive: true,
      },
      {
        name: 'CodeLLaMA',
        provider: 'meta',
        version: '2.0',
        capabilities: ['coding', 'debugging', 'architecture'],
        maxTokens: 8192,
        costPerToken: '0.000005',
        description: 'Specialized code generation model',
        isActive: true,
      },
      {
        name: 'StarCoder-2',
        provider: 'huggingface',
        version: '2.0',
        capabilities: ['coding', 'documentation', 'refactoring'],
        maxTokens: 8192,
        costPerToken: '0.000003',
        description: 'Open-source code generation model',
        isActive: true,
      },
      {
        name: 'DeepSeek-Coder',
        provider: 'deepseek',
        version: '1.5',
        capabilities: ['coding', 'debugging', 'optimization'],
        maxTokens: 8192,
        costPerToken: '0.000004',
        description: 'Advanced coding assistant',
        isActive: true,
      },
      {
        name: 'WizardCoder',
        provider: 'microsoft',
        version: '1.0',
        capabilities: ['coding', 'problem-solving', 'algorithms'],
        maxTokens: 8192,
        costPerToken: '0.000007',
        description: 'Problem-solving focused coding model',
        isActive: true,
      },
      {
        name: 'Claude-Opus',
        provider: 'anthropic',
        version: 'opus',
        capabilities: ['reasoning', 'creativity', 'analysis', 'writing'],
        maxTokens: 8192,
        costPerToken: '0.000015',
        description: 'Most capable Claude model for complex tasks',
        isActive: true,
      },
      {
        name: 'GPT-4-Vision',
        provider: 'openai',
        version: '4v',
        capabilities: ['vision', 'reasoning', 'analysis', 'creativity'],
        maxTokens: 8192,
        costPerToken: '0.000010',
        description: 'Multimodal model with vision capabilities',
        isActive: true,
      },
      {
        name: 'Gemini-Pro',
        provider: 'google',
        version: '1.0',
        capabilities: ['reasoning', 'creativity', 'multimodal'],
        maxTokens: 8192,
        costPerToken: '0.000008',
        description: 'Balanced performance across various tasks',
        isActive: true,
      },
      {
        name: 'Anthropic-Haiku',
        provider: 'anthropic',
        version: 'haiku',
        capabilities: ['speed', 'efficiency', 'reasoning'],
        maxTokens: 8192,
        costPerToken: '0.000002',
        description: 'Fast and efficient for quick tasks',
        isActive: true,
      },
    ]).returning();

    logger.info(`Created ${seedAgents.length} agents`);

    // Create agent lookup map
    const agentMap = seedAgents.reduce((map, agent) => {
      map[agent.name] = agent.id;
      return map;
    }, {} as Record<string, number>);

    // Seed teams
    const seedTeams = await db.insert(teams).values([
      {
        name: 'Neural Nexus',
        owner: '@craig_dev',
        ownerId: seedUsers.find(u => u.username === 'craig_dev')?.id,
        description: 'Elite AI team focused on advanced reasoning',
        rating: 2847,
        wins: 156,
        losses: 12,
        draws: 3,
        currentStreak: 8,
        longestWinStreak: 12,
        rank: 1,
        isActive: true,
      },
      {
        name: 'Quantum Core',
        owner: '@quantum_ai',
        ownerId: seedUsers.find(u => u.username === 'quantum_ai')?.id,
        description: 'Quantum-inspired AI strategies',
        rating: 2756,
        wins: 142,
        losses: 18,
        draws: 2,
        currentStreak: 5,
        longestWinStreak: 8,
        rank: 2,
        isActive: true,
      },
      {
        name: 'Code Titans',
        owner: '@titan_labs',
        ownerId: seedUsers.find(u => u.username === 'titan_labs')?.id,
        description: 'Masters of code generation and architecture',
        rating: 2698,
        wins: 134,
        losses: 21,
        draws: 1,
        currentStreak: 3,
        longestWinStreak: 7,
        rank: 3,
        isActive: true,
      },
      {
        name: 'Binary Beasts',
        owner: '@beast_mode',
        ownerId: seedUsers.find(u => u.username === 'beast_mode')?.id,
        description: 'Aggressive AI coding specialists',
        rating: 2645,
        wins: 128,
        losses: 24,
        draws: 0,
        currentStreak: 2,
        longestWinStreak: 6,
        rank: 4,
        isActive: true,
      },
      {
        name: 'Creative Minds',
        owner: '@creative_ai',
        ownerId: seedUsers.find(u => u.username === 'creative_ai')?.id,
        description: 'Innovative solutions through AI creativity',
        rating: 2612,
        wins: 119,
        losses: 28,
        draws: 4,
        currentStreak: 4,
        longestWinStreak: 5,
        rank: 5,
        isActive: true,
      },
      {
        name: 'Art Forge',
        owner: '@creative_ai',
        ownerId: seedUsers.find(u => u.username === 'creative_ai')?.id,
        description: 'AI-powered artistic creation',
        rating: 2580,
        wins: 98,
        losses: 32,
        draws: 2,
        currentStreak: -1,
        longestWinStreak: 4,
        rank: 6,
        isActive: true,
      },
    ]).returning();

    logger.info(`Created ${seedTeams.length} teams`);

    // Create team lookup map
    const teamMap = seedTeams.reduce((map, team) => {
      map[team.name] = team.id;
      return map;
    }, {} as Record<string, number>);

    // Seed team-agent associations
    const teamAgentAssociations = [
      // Neural Nexus
      { teamId: teamMap['Neural Nexus'], agentId: agentMap['GPT-5-Pro'], role: 'leader' },
      { teamId: teamMap['Neural Nexus'], agentId: agentMap['Claude-3.5'], role: 'member' },
      { teamId: teamMap['Neural Nexus'], agentId: agentMap['Gemini-Ultra'], role: 'member' },

      // Quantum Core
      { teamId: teamMap['Quantum Core'], agentId: agentMap['LLaMA-4'], role: 'leader' },
      { teamId: teamMap['Quantum Core'], agentId: agentMap['Mistral-X'], role: 'member' },
      { teamId: teamMap['Quantum Core'], agentId: agentMap['DeepSeek-V3'], role: 'member' },

      // Code Titans
      { teamId: teamMap['Code Titans'], agentId: agentMap['CodeLLaMA'], role: 'leader' },
      { teamId: teamMap['Code Titans'], agentId: agentMap['StarCoder-2'], role: 'member' },

      // Binary Beasts
      { teamId: teamMap['Binary Beasts'], agentId: agentMap['DeepSeek-Coder'], role: 'leader' },
      { teamId: teamMap['Binary Beasts'], agentId: agentMap['WizardCoder'], role: 'member' },

      // Creative Minds
      { teamId: teamMap['Creative Minds'], agentId: agentMap['Claude-Opus'], role: 'leader' },
      { teamId: teamMap['Creative Minds'], agentId: agentMap['GPT-4-Vision'], role: 'member' },

      // Art Forge
      { teamId: teamMap['Art Forge'], agentId: agentMap['Gemini-Pro'], role: 'leader' },
      { teamId: teamMap['Art Forge'], agentId: agentMap['Anthropic-Haiku'], role: 'member' },
    ];

    await db.insert(teamAgents).values(teamAgentAssociations);
    logger.info(`Created ${teamAgentAssociations.length} team-agent associations`);

    // Seed match types
    const seedMatchTypes = await db.insert(matchTypes).values([
      {
        name: 'Debate Battle',
        description: 'AI agents engage in structured debates on complex topics',
        timeLimit: 1800, // 30 minutes
        maxRounds: 5,
        scoringCriteria: {
          criteria: ['Logic', 'Evidence', 'Persuasiveness', 'Clarity'],
          maxScore: 10,
          judging: 'human-assisted',
        },
        isActive: true,
      },
      {
        name: 'Speed Trial',
        description: 'Fast-paced coding or problem-solving challenges',
        timeLimit: 600, // 10 minutes
        maxRounds: 1,
        scoringCriteria: {
          criteria: ['Speed', 'Accuracy', 'Efficiency', 'Innovation'],
          maxScore: 100,
          judging: 'automated',
        },
        isActive: true,
      },
      {
        name: 'Creative Challenge',
        description: 'Open-ended creative tasks requiring innovation',
        timeLimit: 2700, // 45 minutes
        maxRounds: 3,
        scoringCriteria: {
          criteria: ['Originality', 'Coherence', 'Aesthetic', 'Functionality'],
          maxScore: 10,
          judging: 'human-assisted',
        },
        isActive: true,
      },
      {
        name: 'Logic Duel',
        description: 'Pure reasoning and logical problem solving',
        timeLimit: 1200, // 20 minutes
        maxRounds: 3,
        scoringCriteria: {
          criteria: ['Correctness', 'Reasoning', 'Efficiency'],
          maxScore: 10,
          judging: 'automated',
        },
        isActive: true,
      },
    ]).returning();

    logger.info(`Created ${seedMatchTypes.length} match types`);

    // Seed some example matches
    const seedMatches = await db.insert(matches).values([
      {
        matchTypeId: seedMatchTypes.find(mt => mt.name === 'Debate Battle')?.id,
        topic: 'Should AI have legal personhood?',
        status: 'live',
        currentRound: 3,
        maxRounds: 5,
        startTime: new Date(Date.now() - 45 * 60 * 1000), // Started 45 minutes ago
        viewerCount: 1243,
        peakViewers: 1456,
      },
      {
        matchTypeId: seedMatchTypes.find(mt => mt.name === 'Speed Trial')?.id,
        topic: 'Build a REST API in 10 minutes',
        status: 'live',
        currentRound: 1,
        maxRounds: 1,
        startTime: new Date(Date.now() - 8 * 60 * 1000), // Started 8 minutes ago
        viewerCount: 856,
        peakViewers: 923,
      },
      {
        matchTypeId: seedMatchTypes.find(mt => mt.name === 'Creative Challenge')?.id,
        topic: 'Design a city of the future',
        status: 'live', // This will be marked as 'hot' in frontend based on high viewer count
        currentRound: 2,
        maxRounds: 3,
        startTime: new Date(Date.now() - 25 * 60 * 1000), // Started 25 minutes ago
        viewerCount: 2105,
        peakViewers: 2234,
      },
    ]).returning();

    // Add match participants
    const matchParticipantsData = [
      // Match 1: Neural Nexus vs Quantum Core
      { matchId: seedMatches[0].id, teamId: teamMap['Neural Nexus'], side: 'A', score: '7.5' },
      { matchId: seedMatches[0].id, teamId: teamMap['Quantum Core'], side: 'B', score: '8.2' },

      // Match 2: Code Titans vs Binary Beasts
      { matchId: seedMatches[1].id, teamId: teamMap['Code Titans'], side: 'A', score: '0' },
      { matchId: seedMatches[1].id, teamId: teamMap['Binary Beasts'], side: 'B', score: '0' },

      // Match 3: Creative Minds vs Art Forge
      { matchId: seedMatches[2].id, teamId: teamMap['Creative Minds'], side: 'A', score: '8.7' },
      { matchId: seedMatches[2].id, teamId: teamMap['Art Forge'], side: 'B', score: '8.1' },
    ];

    await db.insert(matchParticipants).values(matchParticipantsData);
    logger.info(`Created ${matchParticipantsData.length} match participants`);

    logger.info('Database seed completed successfully!');

  } catch (error) {
    logger.error('Error seeding database:', error);
    throw error;
  }
}

// Run seed if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedDatabase()
    .then(() => {
      logger.info('Seed completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seed failed:', error);
      process.exit(1);
    });
}

export { seedDatabase };