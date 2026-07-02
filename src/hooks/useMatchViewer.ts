import { useEffect, useState, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';
import { useAuthContext } from '../contexts/AuthContext';
import {
  getCurrentViewerCount,
  joinMatchAsViewer,
  leaveMatchAsViewer,
} from '../lib/services/matches';

export const useMatchViewer = (matchId: string) => {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();
  const [isViewing, setIsViewing] = useState(false);
  const [sessionId] = useState(() => `viewer_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const channelRef = useRef<any>(null);

  // Query for current viewer count
  const {
    data: viewerCount,
    isLoading,
  } = useQuery({
    queryKey: ['viewer-count', matchId],
    queryFn: () => getCurrentViewerCount(matchId),
    refetchInterval: 30000, // Fallback polling
  });

  // Join match as viewer
  const joinMatch = async () => {
    if (isViewing) return;

    try {
      await joinMatchAsViewer(matchId, sessionId, user?.id);
      setIsViewing(true);

      // Set up real-time viewer count subscription
      channelRef.current = supabase
        .channel(`match-viewers-${matchId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'live_viewers',
            filter: `match_id=eq.${matchId}`,
          },
          (payload) => {
            console.log('Viewer count changed:', payload);

            // Update viewer count query
            queryClient.invalidateQueries({ queryKey: ['viewer-count', matchId] });
          }
        )
        .subscribe((status) => {
          console.log('Viewer subscription status:', status);
        });

    } catch (error) {
      console.error('Failed to join match:', error);
    }
  };

  // Leave match
  const leaveMatch = async () => {
    if (!isViewing) return;

    try {
      await leaveMatchAsViewer(matchId, sessionId);
      setIsViewing(false);

      // Unsubscribe from real-time updates
      if (channelRef.current) {
        channelRef.current.unsubscribe();
        channelRef.current = null;
      }
    } catch (error) {
      console.error('Failed to leave match:', error);
    }
  };

  // Auto-join when component mounts
  useEffect(() => {
    joinMatch();

    // Auto-leave when component unmounts
    return () => {
      if (isViewing) {
        leaveMatch();
      }
    };
  }, [matchId]);

  // Handle page visibility changes (leave when tab becomes hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isViewing) {
        leaveMatch();
      } else if (!document.hidden && !isViewing) {
        joinMatch();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isViewing]);

  return {
    viewerCount: viewerCount || 0,
    isViewing,
    isLoading,
    joinMatch,
    leaveMatch,
  };
};