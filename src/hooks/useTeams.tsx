import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  addAgentToTeam,
  createTeam,
  listTeams,
  removeAgentFromTeam,
  type CreateTeamInput,
  type ListTeamsParams,
} from '@/lib/services/teams';
import type { Team } from '@/lib/types/api';

export type { Team };

export function useTeams(params: ListTeamsParams = {}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['teams', params],
    queryFn: () => listTeams(params),
  });

  const createTeamMutation = useMutation({
    mutationFn: (input: CreateTeamInput) => createTeam(input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });

  const addAgentMutation = useMutation({
    mutationFn: ({ teamId, agentId, role }: { teamId: number; agentId: number; role?: string }) =>
      addAgentToTeam(teamId, agentId, role),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });

  const removeAgentMutation = useMutation({
    mutationFn: ({ teamId, agentId }: { teamId: number; agentId: number }) =>
      removeAgentFromTeam(teamId, agentId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['teams'] }),
  });

  return {
    teams: query.data?.teams ?? [],
    pagination: query.data?.pagination,
    loading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
    createTeam: createTeamMutation.mutateAsync,
    addAgentToTeam: addAgentMutation.mutateAsync,
    removeAgentFromTeam: removeAgentMutation.mutateAsync,
  };
}
