
-- =============================================
-- AGENT ARENA DATABASE SCHEMA
-- =============================================

-- 1. Create role enum for user permissions
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

-- 2. Create match status enum
CREATE TYPE public.match_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');

-- 3. Create team role enum
CREATE TYPE public.team_role AS ENUM ('lead', 'researcher', 'critic', 'creative', 'analyst');

-- =============================================
-- PROFILES TABLE
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- USER ROLES TABLE (separate from profiles for security)
-- =============================================
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- =============================================
-- SECURITY DEFINER FUNCTION FOR ROLE CHECKS
-- =============================================
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- =============================================
-- AGENTS TABLE (AI model registrations)
-- =============================================
CREATE TABLE public.agents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  provider TEXT NOT NULL,
  api_endpoint TEXT,
  capabilities TEXT[] DEFAULT '{}',
  avatar_url TEXT,
  is_public BOOLEAN DEFAULT false,
  elo_rating INTEGER DEFAULT 1200,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.agents ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_agents_owner ON public.agents(owner_id);
CREATE INDEX idx_agents_elo ON public.agents(elo_rating DESC);

-- =============================================
-- TEAMS TABLE
-- =============================================
CREATE TABLE public.teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  elo_rating INTEGER DEFAULT 1200,
  matches_played INTEGER DEFAULT 0,
  wins INTEGER DEFAULT 0,
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.teams ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_teams_owner ON public.teams(owner_id);
CREATE INDEX idx_teams_elo ON public.teams(elo_rating DESC);

-- =============================================
-- TEAM MEMBERS TABLE (junction table)
-- =============================================
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE CASCADE NOT NULL,
  role team_role NOT NULL DEFAULT 'researcher',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (team_id, agent_id),
  CONSTRAINT max_team_size CHECK (position >= 0 AND position < 5)
);

ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_team_members_team ON public.team_members(team_id);
CREATE INDEX idx_team_members_agent ON public.team_members(agent_id);

-- =============================================
-- MATCHES TABLE
-- =============================================
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  challenger_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  defender_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  status match_status NOT NULL DEFAULT 'pending',
  match_type TEXT NOT NULL DEFAULT 'debate',
  topic TEXT,
  current_round INTEGER DEFAULT 0,
  total_rounds INTEGER DEFAULT 3,
  winner_team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  challenger_score INTEGER DEFAULT 0,
  defender_score INTEGER DEFAULT 0,
  viewer_count INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_matches_challenger ON public.matches(challenger_team_id);
CREATE INDEX idx_matches_defender ON public.matches(defender_team_id);
CREATE INDEX idx_matches_created ON public.matches(created_at DESC);

-- =============================================
-- MATCH MESSAGES TABLE (battle turns/responses)
-- =============================================
CREATE TABLE public.match_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE SET NULL,
  agent_id UUID REFERENCES public.agents(id) ON DELETE SET NULL,
  round INTEGER NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'response',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.match_messages ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_match_messages_match ON public.match_messages(match_id);
CREATE INDEX idx_match_messages_round ON public.match_messages(match_id, round);

-- =============================================
-- MATCH VOTES TABLE (for judging)
-- =============================================
CREATE TABLE public.match_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  round INTEGER,
  score INTEGER CHECK (score >= 1 AND score <= 10),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (match_id, voter_id, round)
);

ALTER TABLE public.match_votes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_match_votes_match ON public.match_votes(match_id);

-- =============================================
-- RLS POLICIES
-- =============================================

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- User Roles: Only admins can manage, users can view own
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Agents: Owners can manage, public agents viewable by all
CREATE POLICY "Public agents are viewable by everyone"
  ON public.agents FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Users can create own agents"
  ON public.agents FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own agents"
  ON public.agents FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own agents"
  ON public.agents FOR DELETE
  USING (auth.uid() = owner_id);

-- Teams: Owners can manage, public teams viewable by all
CREATE POLICY "Public teams are viewable by everyone"
  ON public.teams FOR SELECT
  USING (is_public = true OR auth.uid() = owner_id);

CREATE POLICY "Users can create own teams"
  ON public.teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Users can update own teams"
  ON public.teams FOR UPDATE
  USING (auth.uid() = owner_id);

CREATE POLICY "Users can delete own teams"
  ON public.teams FOR DELETE
  USING (auth.uid() = owner_id);

-- Team Members: Team owners can manage
CREATE POLICY "Team members viewable if team is viewable"
  ON public.team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id
      AND (t.is_public = true OR t.owner_id = auth.uid())
    )
  );

CREATE POLICY "Team owners can manage members"
  ON public.team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = team_id AND t.owner_id = auth.uid()
    )
  );

-- Matches: All can view, participants can create
CREATE POLICY "Matches are viewable by everyone"
  ON public.matches FOR SELECT
  USING (true);

CREATE POLICY "Team owners can create matches"
  ON public.matches FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.teams t
      WHERE t.id = challenger_team_id AND t.owner_id = auth.uid()
    )
  );

CREATE POLICY "Admins can update matches"
  ON public.matches FOR UPDATE
  USING (public.has_role(auth.uid(), 'admin'));

-- Match Messages: All can view
CREATE POLICY "Match messages are viewable by everyone"
  ON public.match_messages FOR SELECT
  USING (true);

CREATE POLICY "System can insert match messages"
  ON public.match_messages FOR INSERT
  WITH CHECK (true);

-- Match Votes: Authenticated users can vote
CREATE POLICY "Votes are viewable by everyone"
  ON public.match_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote"
  ON public.match_votes FOR INSERT
  WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can update own votes"
  ON public.match_votes FOR UPDATE
  USING (auth.uid() = voter_id);

-- =============================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMPS
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_agents_updated_at
  BEFORE UPDATE ON public.agents
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON public.teams
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username, display_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'username',
    COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.raw_user_meta_data ->> 'username')
  );
  
  -- Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ENABLE REALTIME FOR KEY TABLES
-- =============================================
ALTER PUBLICATION supabase_realtime ADD TABLE public.matches;
ALTER PUBLICATION supabase_realtime ADD TABLE public.match_messages;
