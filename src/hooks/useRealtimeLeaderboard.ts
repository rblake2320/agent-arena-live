import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getTeamLeaderboard } from '../lib/services/teams';

export const useRealtimeLeaderboard = (limit = 10) => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Query for team leaderboard
  const {
    data: teams,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['leaderboard', limit],
    queryFn: () => getTeamLeaderboard(limit),
    refetchInterval: 60000, // Fallback polling every minute
  });

  useEffect(() => {
    if (isSubscribed) return;

    // Subscribe to team changes that affect leaderboard
    const leaderboardChannel = supabase
      .channel('leaderboard-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'teams',
        },
        (payload) => {
          console.log('Team update received:', payload);

          // If rating, wins, losses, or rank changed, update leaderboard
          const { old: oldTeam, new: newTeam } = payload;

          if (
            oldTeam?.rating !== newTeam?.rating ||
            oldTeam?.wins !== newTeam?.wins ||
            oldTeam?.losses !== newTeam?.losses ||
            oldTeam?.rank !== newTeam?.rank
          ) {
            // Invalidate leaderboard queries
            queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rating_history',
        },
        (payload) => {
          console.log('Rating history update:', payload);

          // When new rating history is added, refresh leaderboard
          queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
        }
      )
      .subscribe((status) => {
        console.log('Leaderboard subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
        }
      });

    return () => {
      leaderboardChannel.unsubscribe();
      setIsSubscribed(false);
    };
  }, [queryClient, isSubscribed, limit]);

  return {
    teams: teams || [],
    isLoading,
    error,
    isSubscribed,
  };
};