import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getTopTeams } from '@/lib/services/teams';
import { getSocket } from '@/lib/socket';

/**
 * Top teams from GET /api/leaderboard/top, refreshed whenever the server
 * emits `leaderboard_update` over Socket.IO.
 */
export const useRealtimeLeaderboard = (limit = 10) => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['leaderboard', 'top', limit],
    queryFn: () => getTopTeams(limit),
  });

  useEffect(() => {
    const socket = getSocket();
    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });

    socket.on('leaderboard_update', refresh);

    return () => {
      socket.off('leaderboard_update', refresh);
    };
  }, [queryClient]);

  return {
    teams: query.data?.topTeams ?? [],
    lastUpdated: query.data?.lastUpdated,
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
  };
};
