// Team + leaderboard endpoints — thin wrappers over the REST API.
import { deleteJson, getJson, postJson, toQuery } from '@/lib/api';
import type {
  CreateTeamResponse,
  LeaderboardResponse,
  TeamDetailResponse,
  TeamListResponse,
  TopTeamsResponse,
} from '@/lib/types/api';

export interface ListTeamsParams {
  search?: string;
  sortBy?: string;
  page?: number;
  limit?: number;
}

export function listTeams(params: ListTeamsParams = {}): Promise<TeamListResponse> {
  return getJson<TeamListResponse>(`/api/teams${toQuery(params)}`);
}

export function getTeam(teamId: number): Promise<TeamDetailResponse> {
  return getJson<TeamDetailResponse>(`/api/teams/${teamId}`);
}

export interface CreateTeamInput {
  name: string;
  description?: string;
  logo?: string;
  agentIds?: number[];
}

export function createTeam(input: CreateTeamInput): Promise<CreateTeamResponse> {
  return postJson<CreateTeamResponse>('/api/teams', input);
}

export function addAgentToTeam(
  teamId: number,
  agentId: number,
  role?: string
): Promise<{ message?: string }> {
  return postJson<{ message?: string }>(`/api/teams/${teamId}/agents`, {
    agentId,
    ...(role ? { role } : {}),
  });
}

export function removeAgentFromTeam(
  teamId: number,
  agentId: number
): Promise<{ message?: string }> {
  return deleteJson<{ message?: string }>(`/api/teams/${teamId}/agents/${agentId}`);
}

export function getTopTeams(limit = 10): Promise<TopTeamsResponse> {
  return getJson<TopTeamsResponse>(`/api/leaderboard/top${toQuery({ limit })}`);
}

export function getLeaderboard(page = 1, limit = 25): Promise<LeaderboardResponse> {
  return getJson<LeaderboardResponse>(`/api/leaderboard${toQuery({ page, limit })}`);
}
