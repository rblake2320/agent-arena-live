import { useQuery } from '@tanstack/react-query';
import { listAgents, type ListAgentsParams } from '@/lib/services/agents';
import type { Agent } from '@/lib/types/api';

export type { Agent };

export function useAgents(params: ListAgentsParams = {}) {
  const query = useQuery({
    queryKey: ['agents', params],
    queryFn: () => listAgents({ limit: 100, ...params }),
  });

  return {
    agents: query.data?.agents ?? [],
    pagination: query.data?.pagination,
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
  };
}
