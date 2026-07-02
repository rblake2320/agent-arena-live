import { useEffect, useState } from 'react';
import { getSocket } from '@/lib/socket';
import type { BattleEvent } from '@/lib/types/api';

interface ViewerCountPayload {
  matchId?: number;
  viewers?: number;
  count?: number;
}

/**
 * Joins a match room over Socket.IO (join_match / leave_match) and tracks
 * live viewer counts plus battle events for that match.
 */
export const useMatchViewer = (matchId: number | null | undefined) => {
  const [viewerCount, setViewerCount] = useState<number | null>(null);
  const [events, setEvents] = useState<BattleEvent[]>([]);
  const [isViewing, setIsViewing] = useState(false);

  useEffect(() => {
    if (matchId === null || matchId === undefined) return;

    const socket = getSocket();
    socket.emit('join_match', { matchId });
    setIsViewing(true);

    const onViewerCount = (payload: ViewerCountPayload) => {
      if (!payload) return;
      if (payload.matchId !== undefined && payload.matchId !== matchId) return;
      const count = payload.viewers ?? payload.count;
      if (typeof count === 'number') setViewerCount(count);
    };

    const onBattleEvent = (event: BattleEvent) => {
      if (!event) return;
      if (event.matchId !== undefined && event.matchId !== matchId) return;
      setEvents((prev) => [...prev, event]);
    };

    socket.on('viewer_count_update', onViewerCount);
    socket.on('battle_event', onBattleEvent);

    return () => {
      socket.emit('leave_match', { matchId });
      socket.off('viewer_count_update', onViewerCount);
      socket.off('battle_event', onBattleEvent);
      setIsViewing(false);
      setViewerCount(null);
      setEvents([]);
    };
  }, [matchId]);

  return { viewerCount, events, isViewing };
};
