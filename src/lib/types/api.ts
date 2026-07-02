// Types matching the Agent Arena Express backend REST API responses.

export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  displayName: string | null;
  isVerified: boolean;
  role: string;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
}

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface Agent {
  id: number;
  name: string;
  provider: string;
  version: string | null;
  capabilities: string[];
  maxTokens: number | null;
  costPerToken: number | null;
  isActive: boolean;
  description: string | null;
  teamCount: number;
}

export interface AgentListResponse {
  agents: Agent[];
  pagination: Pagination;
}

export interface Team {
  id: number;
  name: string;
  description?: string | null;
  logo?: string | null;
  rating?: number;
  wins?: number;
  losses?: number;
}

export interface TeamListResponse {
  teams: Team[];
  pagination: Pagination;
}

export interface TeamDetailResponse {
  team: Team;
  agents: Agent[];
  ratingHistory: unknown[];
}

export interface CreateTeamResponse {
  team: Team;
}

export interface LiveMatchTeam {
  name: string;
  agents: string[];
}

export interface LiveMatch {
  id: number;
  teamA: LiveMatchTeam;
  teamB: LiveMatchTeam;
  type: string;
  topic: string;
  viewers: number;
  round: number;
  maxRounds: number;
  status: string;
}

export interface LiveMatchesResponse {
  matches: LiveMatch[];
}

export interface MatchDetailResponse {
  match: Record<string, unknown>;
  participants: unknown[];
  events: BattleEvent[];
}

export interface BattleEvent {
  matchId?: number;
  type?: string;
  [key: string]: unknown;
}

export interface TopTeam {
  rank: number;
  name: string;
  owner: string;
  rating: number;
  wins: number;
  losses: number;
  streak: string;
  badge: string | null;
  winRate: number;
}

export interface TopTeamsResponse {
  topTeams: TopTeam[];
  lastUpdated: string;
}

export interface LeaderboardResponse {
  leaderboard: TopTeam[];
  pagination: Pagination;
  lastUpdated: string;
}
