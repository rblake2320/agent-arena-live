// Agent endpoints — thin wrappers over the REST API.
import { getJson, toQuery } from '@/lib/api';
import type { AgentListResponse } from '@/lib/types/api';

export interface ListAgentsParams {
  search?: string;
  provider?: string;
  page?: number;
  limit?: number;
}

export function listAgents(params: ListAgentsParams = {}): Promise<AgentListResponse> {
  return getJson<AgentListResponse>(`/api/agents${toQuery(params)}`);
}
