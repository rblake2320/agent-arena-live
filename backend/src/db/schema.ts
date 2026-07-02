import { relations } from 'drizzle-orm';
import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  integer,
  boolean,
  decimal,
  uuid,
  jsonb,
  uniqueIndex,
  index,
} from 'drizzle-orm/pg-core';

// Users table - for authentication and team ownership
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  username: varchar('username', { length: 50 }).notNull().unique(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }),
  avatar: text('avatar'),
  isVerified: boolean('is_verified').default(false),
  role: varchar('role', { length: 20 }).default('user'), // user, admin, moderator
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
  lastLoginAt: timestamp('last_login_at'),
}, (table) => ({
  usernameIdx: uniqueIndex('users_username_idx').on(table.username),
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
}));

// AI Agents table - GPT-5-Pro, Claude-3.5, etc.
export const agents = pgTable('agents', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  provider: varchar('provider', { length: 50 }).notNull(), // openai, anthropic, meta, etc.
  version: varchar('version', { length: 50 }),
  capabilities: jsonb('capabilities'), // array of capabilities like ["coding", "reasoning", "creativity"]
  maxTokens: integer('max_tokens'),
  costPerToken: decimal('cost_per_token', { precision: 10, scale: 8 }),
  isActive: boolean('is_active').default(true),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nameIdx: uniqueIndex('agents_name_idx').on(table.name),
  providerIdx: index('agents_provider_idx').on(table.provider),
}));

// Teams table - Neural Nexus, Quantum Core, etc.
export const teams = pgTable('teams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(),
  owner: varchar('owner', { length: 100 }).notNull(), // @craig_dev, @quantum_ai, etc.
  ownerId: integer('owner_id').references(() => users.id),
  description: text('description'),
  logo: text('logo'), // URL or base64
  rating: integer('rating').default(1200), // ELO-style rating
  wins: integer('wins').default(0),
  losses: integer('losses').default(0),
  draws: integer('draws').default(0),
  currentStreak: integer('current_streak').default(0), // positive for win streak, negative for loss streak
  longestWinStreak: integer('longest_win_streak').default(0),
  rank: integer('rank'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  nameIdx: uniqueIndex('teams_name_idx').on(table.name),
  ratingIdx: index('teams_rating_idx').on(table.rating),
  rankIdx: index('teams_rank_idx').on(table.rank),
  ownerIdx: index('teams_owner_idx').on(table.ownerId),
}));

// Team-Agent associations (many-to-many)
export const teamAgents = pgTable('team_agents', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id),
  agentId: integer('agent_id').references(() => agents.id),
  role: varchar('role', { length: 50 }).default('member'), // leader, member, backup
  addedAt: timestamp('added_at').defaultNow(),
}, (table) => ({
  teamAgentIdx: uniqueIndex('team_agents_team_agent_idx').on(table.teamId, table.agentId),
  teamIdx: index('team_agents_team_idx').on(table.teamId),
  agentIdx: index('team_agents_agent_idx').on(table.agentId),
}));

// Match types
export const matchTypes = pgTable('match_types', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 100 }).notNull().unique(), // "Debate Battle", "Speed Trial", "Creative Challenge"
  description: text('description'),
  timeLimit: integer('time_limit'), // in seconds
  maxRounds: integer('max_rounds').default(1),
  scoringCriteria: jsonb('scoring_criteria'), // JSON object defining how matches are scored
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

// Matches table - live battles
export const matches = pgTable('matches', {
  id: serial('id').primaryKey(),
  uuid: uuid('uuid').defaultRandom().unique(),
  matchTypeId: integer('match_type_id').references(() => matchTypes.id),
  topic: text('topic').notNull(),
  status: varchar('status', { length: 20 }).default('pending'), // pending, live, completed, cancelled
  currentRound: integer('current_round').default(1),
  maxRounds: integer('max_rounds').default(1),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  winnerId: integer('winner_id').references(() => teams.id),
  viewerCount: integer('viewer_count').default(0),
  peakViewers: integer('peak_viewers').default(0),
  metadata: jsonb('metadata'), // additional match-specific data
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
}, (table) => ({
  statusIdx: index('matches_status_idx').on(table.status),
  startTimeIdx: index('matches_start_time_idx').on(table.startTime),
  typeIdx: index('matches_type_idx').on(table.matchTypeId),
}));

// Match participants (many-to-many between matches and teams)
export const matchParticipants = pgTable('match_participants', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').references(() => matches.id),
  teamId: integer('team_id').references(() => teams.id),
  side: varchar('side', { length: 10 }).notNull(), // 'A' or 'B'
  score: decimal('score', { precision: 10, scale: 2 }).default('0'),
  isWinner: boolean('is_winner').default(false),
  joinedAt: timestamp('joined_at').defaultNow(),
}, (table) => ({
  matchTeamIdx: uniqueIndex('match_participants_match_team_idx').on(table.matchId, table.teamId),
  matchIdx: index('match_participants_match_idx').on(table.matchId),
  teamIdx: index('match_participants_team_idx').on(table.teamId),
}));

// Battle events/rounds within matches
export const battleEvents = pgTable('battle_events', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').references(() => matches.id),
  round: integer('round').notNull(),
  agentId: integer('agent_id').references(() => agents.id),
  teamId: integer('team_id').references(() => teams.id),
  eventType: varchar('event_type', { length: 50 }).notNull(), // 'response', 'action', 'score', 'timeout'
  content: text('content'),
  metadata: jsonb('metadata'), // tokens used, response time, etc.
  timestamp: timestamp('timestamp').defaultNow(),
}, (table) => ({
  matchRoundIdx: index('battle_events_match_round_idx').on(table.matchId, table.round),
  matchIdx: index('battle_events_match_idx').on(table.matchId),
  timestampIdx: index('battle_events_timestamp_idx').on(table.timestamp),
}));

// Live viewers tracking
export const liveViewers = pgTable('live_viewers', {
  id: serial('id').primaryKey(),
  matchId: integer('match_id').references(() => matches.id),
  sessionId: varchar('session_id', { length: 100 }).notNull(),
  userId: integer('user_id').references(() => users.id), // nullable for anonymous viewers
  joinedAt: timestamp('joined_at').defaultNow(),
  leftAt: timestamp('left_at'),
  isActive: boolean('is_active').default(true),
}, (table) => ({
  matchSessionIdx: uniqueIndex('live_viewers_match_session_idx').on(table.matchId, table.sessionId),
  matchIdx: index('live_viewers_match_idx').on(table.matchId),
  userIdx: index('live_viewers_user_idx').on(table.userId),
}));

// Rating history for tracking team performance over time
export const ratingHistory = pgTable('rating_history', {
  id: serial('id').primaryKey(),
  teamId: integer('team_id').references(() => teams.id),
  matchId: integer('match_id').references(() => matches.id),
  oldRating: integer('old_rating').notNull(),
  newRating: integer('new_rating').notNull(),
  ratingChange: integer('rating_change').notNull(),
  reason: varchar('reason', { length: 100 }), // 'match_win', 'match_loss', 'manual_adjustment'
  createdAt: timestamp('created_at').defaultNow(),
}, (table) => ({
  teamIdx: index('rating_history_team_idx').on(table.teamId),
  matchIdx: index('rating_history_match_idx').on(table.matchId),
  createdAtIdx: index('rating_history_created_at_idx').on(table.createdAt),
}));

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  teams: many(teams),
  liveViewers: many(liveViewers),
}));

export const teamsRelations = relations(teams, ({ one, many }) => ({
  owner: one(users, {
    fields: [teams.ownerId],
    references: [users.id],
  }),
  teamAgents: many(teamAgents),
  matchParticipants: many(matchParticipants),
  battleEvents: many(battleEvents),
  ratingHistory: many(ratingHistory),
  wonMatches: many(matches),
}));

export const agentsRelations = relations(agents, ({ many }) => ({
  teamAgents: many(teamAgents),
  battleEvents: many(battleEvents),
}));

export const matchesRelations = relations(matches, ({ one, many }) => ({
  matchType: one(matchTypes, {
    fields: [matches.matchTypeId],
    references: [matchTypes.id],
  }),
  winner: one(teams, {
    fields: [matches.winnerId],
    references: [teams.id],
  }),
  participants: many(matchParticipants),
  battleEvents: many(battleEvents),
  liveViewers: many(liveViewers),
  ratingHistory: many(ratingHistory),
}));

export const matchTypesRelations = relations(matchTypes, ({ many }) => ({
  matches: many(matches),
}));

export const teamAgentsRelations = relations(teamAgents, ({ one }) => ({
  team: one(teams, {
    fields: [teamAgents.teamId],
    references: [teams.id],
  }),
  agent: one(agents, {
    fields: [teamAgents.agentId],
    references: [agents.id],
  }),
}));

export const matchParticipantsRelations = relations(matchParticipants, ({ one }) => ({
  match: one(matches, {
    fields: [matchParticipants.matchId],
    references: [matches.id],
  }),
  team: one(teams, {
    fields: [matchParticipants.teamId],
    references: [teams.id],
  }),
}));

export const battleEventsRelations = relations(battleEvents, ({ one }) => ({
  match: one(matches, {
    fields: [battleEvents.matchId],
    references: [matches.id],
  }),
  agent: one(agents, {
    fields: [battleEvents.agentId],
    references: [agents.id],
  }),
  team: one(teams, {
    fields: [battleEvents.teamId],
    references: [teams.id],
  }),
}));

export const liveViewersRelations = relations(liveViewers, ({ one }) => ({
  match: one(matches, {
    fields: [liveViewers.matchId],
    references: [matches.id],
  }),
  user: one(users, {
    fields: [liveViewers.userId],
    references: [users.id],
  }),
}));

export const ratingHistoryRelations = relations(ratingHistory, ({ one }) => ({
  team: one(teams, {
    fields: [ratingHistory.teamId],
    references: [teams.id],
  }),
  match: one(matches, {
    fields: [ratingHistory.matchId],
    references: [matches.id],
  }),
}));