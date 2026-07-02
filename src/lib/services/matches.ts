// Match endpoints — thin wrappers over the REST API.
import { getJson } from '@/lib/api';
import type { LiveMatchesResponse, MatchDetailResponse } from '@/lib/types/api';

export function getLiveMatches(): Promise<LiveMatchesResponse> {
  return getJson<LiveMatchesResponse>('/api/matches/live');
}

export function getMatch(matchId: number): Promise<MatchDetailResponse> {
  return getJson<MatchDetailResponse>(`/api/matches/${matchId}`);
}
