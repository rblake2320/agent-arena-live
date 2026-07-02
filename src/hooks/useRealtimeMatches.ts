import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { getLiveMatches } from '../lib/services/matches';
import { LiveMatchData } from '../lib/types/database';

export const useRealtimeMatches = () => {
  const queryClient = useQueryClient();
  const [isSubscribed, setIsSubscribed] = useState(false);

  // Query for live matches
  const {
    data: matches,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['live-matches'],
    queryFn: getLiveMatches,
    refetchInterval: 30000, // Fallback polling every 30 seconds
  });

  useEffect(() => {
    if (isSubscribed) return;

    // Subscribe to match changes
    const matchChannel = supabase
      .channel('live-matches')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'matches',
          filter: 'status=eq.live',
        },
        (payload) => {
          console.log('Match update received:', payload);

          // Invalidate and refetch matches
          queryClient.invalidateQueries({ queryKey: ['live-matches'] });

          // You could also optimistically update here
          // queryClient.setQueryData(['live-matches'], (old) => {
          //   // Update logic here
          // });
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'live_viewers',
        },
        (payload) => {
          console.log('Viewer update received:', payload);

          // Update viewer counts for specific matches
          queryClient.invalidateQueries({ queryKey: ['live-matches'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'battle_events',
        },
        (payload) => {
          console.log('New battle event:', payload);

          // Invalidate match-specific queries
          const matchId = payload.new?.match_id;
          if (matchId) {
            queryClient.invalidateQueries({ queryKey: ['match', matchId] });
            queryClient.invalidateQueries({ queryKey: ['match-events', matchId] });
          }
        }
      )
      .subscribe((status) => {
        console.log('Match subscription status:', status);
        if (status === 'SUBSCRIBED') {
          setIsSubscribed(true);
        }
      });

    return () => {
      matchChannel.unsubscribe();
      setIsSubscribed(false);
    };
  }, [queryClient, isSubscribed]);

  return {
    matches: matches || [],
    isLoading,
    error,
    isSubscribed,
  };
};