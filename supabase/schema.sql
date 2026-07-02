-- Agent Arena Live Database Schema
-- Supabase PostgreSQL Schema

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table for authentication and profiles
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Agents table
CREATE TABLE agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  provider TEXT NOT NULL, -- OpenAI, Anthropic, Google, Meta, Mistral, etc.
  model_id TEXT NOT NULL, -- gpt-4-turbo, claude-3-opus, etc.
  capabilities TEXT[] DEFAULT '{}', -- debate, code, creative, analysis, research
  description TEXT,
  max_tokens INTEGER DEFAULT 4000,
  cost_per_1k_tokens DECIMAL(10,6) DEFAULT 0.01,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(provider, model_id)
);

-- Teams table
CREATE TABLE teams (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  owner_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  description TEXT,
  logo_url TEXT,
  rating INTEGER DEFAULT 1500, -- ELO rating system
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  draws INTEGER DEFAULT 0,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  streak_type TEXT DEFAULT 'none', -- 'win', 'loss', 'none'
  total_matches INTEGER DEFAULT 0,
  rank INTEGER DEFAULT 0,
  badge TEXT, -- 'crown', 'medal', null
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(name)
);

-- Team-Agent relationships with roles
CREATE TABLE team_agents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  agent_id UUID NOT NULL REFERENCES agents(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'researcher', -- lead, researcher, critic, creative, analyst
  position INTEGER NOT NULL DEFAULT 1, -- 1-5 for slot position
  added_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(team_id, agent_id),
  UNIQUE(team_id, position),
  CHECK (position >= 1 AND position <= 5)
);

-- Match types/battle formats
CREATE TABLE match_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  max_rounds INTEGER DEFAULT 1,
  time_limit_seconds INTEGER DEFAULT 300, -- 5 minutes default
  scoring_type TEXT DEFAULT 'judge', -- 'judge', 'vote', 'objective'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_type_id UUID NOT NULL REFERENCES match_types(id),
  topic TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, live, completed, cancelled
  current_round INTEGER DEFAULT 1,
  max_rounds INTEGER DEFAULT 1,
  winner_team_id UUID REFERENCES teams(id),
  total_viewers INTEGER DEFAULT 0,
  peak_viewers INTEGER DEFAULT 0,
  scheduled_at TIMESTAMPTZ,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Match participants (teams in matches)
CREATE TABLE match_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_side TEXT NOT NULL, -- 'A', 'B'
  final_score DECIMAL(5,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(match_id, team_id),
  UNIQUE(match_id, team_side)
);

-- Live viewers tracking
CREATE TABLE live_viewers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  left_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  user_agent TEXT,
  ip_address INET,
  UNIQUE(match_id, session_id)
);

-- Battle events for real-time updates
CREATE TABLE battle_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  round_number INTEGER NOT NULL,
  event_type TEXT NOT NULL, -- 'prompt', 'response', 'score', 'round_end', 'match_end'
  team_id UUID REFERENCES teams(id),
  agent_id UUID REFERENCES agents(id),
  content TEXT, -- The actual prompt/response/event data
  metadata JSONB DEFAULT '{}', -- Additional event data
  score DECIMAL(5,2),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rating history for tracking ELO changes
CREATE TABLE rating_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  match_id UUID REFERENCES matches(id) ON DELETE CASCADE,
  old_rating INTEGER NOT NULL,
  new_rating INTEGER NOT NULL,
  rating_change INTEGER NOT NULL,
  reason TEXT DEFAULT 'match_result', -- match_result, manual_adjustment, etc.
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_teams_rating ON teams(rating DESC);
CREATE INDEX idx_teams_owner ON teams(owner_id);
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_created_at ON matches(created_at DESC);
CREATE INDEX idx_match_participants_match ON match_participants(match_id);
CREATE INDEX idx_battle_events_match ON battle_events(match_id, round_number);
CREATE INDEX idx_live_viewers_match ON live_viewers(match_id, is_active);
CREATE INDEX idx_rating_history_team ON rating_history(team_id, created_at DESC);

-- Row Level Security (RLS) Policies

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE live_viewers ENABLE ROW LEVEL SECURITY;
ALTER TABLE battle_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_history ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Teams policies
CREATE POLICY "Anyone can view teams" ON teams
  FOR SELECT USING (true);

CREATE POLICY "Users can create teams" ON teams
  FOR INSERT WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Team owners can update their teams" ON teams
  FOR UPDATE USING (auth.uid() = owner_id);

CREATE POLICY "Team owners can delete their teams" ON teams
  FOR DELETE USING (auth.uid() = owner_id);

-- Agents policies (read-only for most users)
CREATE POLICY "Anyone can view agents" ON agents
  FOR SELECT USING (true);

-- Team-agent relationships
CREATE POLICY "Anyone can view team-agent relationships" ON team_agents
  FOR SELECT USING (true);

CREATE POLICY "Team owners can manage their team agents" ON team_agents
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_agents.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- Match types (read-only)
CREATE POLICY "Anyone can view match types" ON match_types
  FOR SELECT USING (true);

-- Matches (public viewing)
CREATE POLICY "Anyone can view matches" ON matches
  FOR SELECT USING (true);

-- Match participants (public viewing)
CREATE POLICY "Anyone can view match participants" ON match_participants
  FOR SELECT USING (true);

-- Live viewers (users can see their own viewing history)
CREATE POLICY "Users can view their own viewer records" ON live_viewers
  FOR SELECT USING (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can insert their own viewer records" ON live_viewers
  FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE POLICY "Users can update their own viewer records" ON live_viewers
  FOR UPDATE USING (auth.uid() = user_id OR user_id IS NULL);

-- Battle events (public viewing)
CREATE POLICY "Anyone can view battle events" ON battle_events
  FOR SELECT USING (true);

-- Rating history (public viewing)
CREATE POLICY "Anyone can view rating history" ON rating_history
  FOR SELECT USING (true);

-- Functions for common operations

-- Function to update team stats after a match
CREATE OR REPLACE FUNCTION update_team_stats(
  p_team_id UUID,
  p_match_result TEXT, -- 'win', 'loss', 'draw'
  p_new_rating INTEGER
)
RETURNS VOID AS $$
BEGIN
  UPDATE teams
  SET
    wins = CASE WHEN p_match_result = 'win' THEN wins + 1 ELSE wins END,
    losses = CASE WHEN p_match_result = 'loss' THEN losses + 1 ELSE losses END,
    draws = CASE WHEN p_match_result = 'draw' THEN draws + 1 ELSE draws END,
    total_matches = total_matches + 1,
    rating = p_new_rating,
    current_streak = CASE
      WHEN p_match_result = 'win' AND streak_type = 'win' THEN current_streak + 1
      WHEN p_match_result = 'win' THEN 1
      WHEN p_match_result = 'loss' AND streak_type = 'loss' THEN current_streak + 1
      WHEN p_match_result = 'loss' THEN 1
      ELSE 0
    END,
    streak_type = CASE
      WHEN p_match_result IN ('win', 'loss') THEN p_match_result
      ELSE 'none'
    END,
    longest_streak = CASE
      WHEN p_match_result = 'win' AND (streak_type != 'win' OR current_streak + 1 > longest_streak)
      THEN GREATEST(longest_streak, current_streak + 1)
      WHEN p_match_result = 'win' AND streak_type = 'win' AND current_streak + 1 > longest_streak
      THEN current_streak + 1
      ELSE longest_streak
    END,
    updated_at = NOW()
  WHERE id = p_team_id;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate new ELO ratings
CREATE OR REPLACE FUNCTION calculate_elo_rating(
  winner_rating INTEGER,
  loser_rating INTEGER,
  k_factor INTEGER DEFAULT 32
)
RETURNS TABLE(new_winner_rating INTEGER, new_loser_rating INTEGER) AS $$
DECLARE
  expected_winner DECIMAL;
  expected_loser DECIMAL;
  rating_change INTEGER;
BEGIN
  -- Calculate expected scores
  expected_winner := 1.0 / (1.0 + POWER(10.0, (loser_rating - winner_rating) / 400.0));
  expected_loser := 1.0 - expected_winner;

  -- Calculate rating changes
  rating_change := ROUND(k_factor * (1.0 - expected_winner));

  -- Return new ratings
  new_winner_rating := winner_rating + rating_change;
  new_loser_rating := loser_rating - rating_change;

  RETURN NEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to update team rankings
CREATE OR REPLACE FUNCTION update_team_rankings()
RETURNS VOID AS $$
BEGIN
  WITH ranked_teams AS (
    SELECT
      id,
      ROW_NUMBER() OVER (ORDER BY rating DESC, wins DESC, (wins::FLOAT / NULLIF(total_matches, 0)) DESC) as new_rank
    FROM teams
    WHERE is_active = true
  )
  UPDATE teams
  SET rank = ranked_teams.new_rank
  FROM ranked_teams
  WHERE teams.id = ranked_teams.id;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update timestamps
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();