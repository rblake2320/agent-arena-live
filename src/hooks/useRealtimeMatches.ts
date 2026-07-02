import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLiveMatches } from '@/lib/services/matches';
import { getSocket } from '@/lib/socket';

const LIVE_MATCHES_KEY = ['matches', 'live'] as const;

/**
 * Live matches from GET /api/matches/live, refreshed whenever the server
 * emits `new_match` or `match_update` over Socket.IO.
 */
export const useRealtimeMatches = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: LIVE_MATCHES_KEY,
    queryFn: getLiveMatches,
    refetchInterval: 60_000,
  });

  useEffect(() => {
    const socket = getSocket();
    const refresh = () =>
      queryClient.invalidateQueries({ queryKey: LIVE_MATCHES_KEY });

    socket.on('new_match', refresh);
    socket.on('match_update', refresh);

    return () => {
      socket.off('new_match', refresh);
      socket.off('match_update', refresh);
    };
  }, [queryClient]);

  return {
    matches: query.data?.matches ?? [],
    isLoading: query.isLoading,
    error: (query.error as Error | null) ?? null,
    refetch: query.refetch,
  };
};
