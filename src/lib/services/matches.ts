import { supabase } from '../supabase';
import { MatchWithDetails, LiveMatchData } from '../types/database';

// Get live matches
export const getLiveMatches = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      match_type:match_types(*),
      match_participants(
        team_side,
        final_score,
        team:teams(
          name,
          team_agents(
            agent:agents(name)
          )
        )
      )
    `)
    .eq('status', 'live')
    .order('started_at', { ascending: false });

  if (error) {
    console.error('Error fetching live matches:', error);
    return null;
  }

  // Transform to frontend format
  return data.map((match): LiveMatchData => {
    const participants = match.match_participants || [];
    const teamA = participants.find(p => p.team_side === 'A')?.team;
    const teamB = participants.find(p => p.team_side === 'B')?.team;

    return {
      id: match.id,
      teamA: {
        name: teamA?.name || 'Unknown Team',
        agents: teamA?.team_agents?.map(ta => ta.agent?.name || 'Unknown Agent') || [],
      },
      teamB: {
        name: teamB?.name || 'Unknown Team',
        agents: teamB?.team_agents?.map(ta => ta.agent?.name || 'Unknown Agent') || [],
      },
      type: match.match_type?.name || 'Unknown Type',
      topic: match.topic,
      viewers: match.total_viewers || 0,
      round: match.current_round || 1,
      maxRounds: match.max_rounds || 1,
      status: getMatchDisplayStatus(match),
    };
  });
};

// Get match details with events
export const getMatchDetails = async (matchId: string): Promise<MatchWithDetails | null> => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      match_type:match_types(*),
      match_participants(
        team_side,
        final_score,
        team:teams(
          *,
          team_agents(
            role,
            position,
            agent:agents(*)
          )
        )
      ),
      battle_events(*)
    `)
    .eq('id', matchId)
    .single();

  if (error) {
    console.error('Error fetching match details:', error);
    return null;
  }

  // Get current viewer count
  const viewerCount = await getCurrentViewerCount(matchId);

  return {
    ...data,
    viewers_count: viewerCount,
  };
};

// Get current viewer count for a match
export const getCurrentViewerCount = async (matchId: string) => {
  const { count, error } = await supabase
    .from('live_viewers')
    .select('*', { count: 'exact' })
    .eq('match_id', matchId)
    .eq('is_active', true);

  if (error) {
    console.error('Error getting viewer count:', error);
    return 0;
  }

  return count || 0;
};

// Join match as viewer
export const joinMatchAsViewer = async (matchId: string, sessionId: string, userId?: string) => {
  const { data, error } = await supabase
    .from('live_viewers')
    .upsert({
      match_id: matchId,
      session_id: sessionId,
      user_id: userId || null,
      is_active: true,
      joined_at: new Date().toISOString(),
      left_at: null,
    })
    .select()
    .single();

  if (error) {
    console.error('Error joining match:', error);
    return null;
  }

  return data;
};

// Leave match as viewer
export const leaveMatchAsViewer = async (matchId: string, sessionId: string) => {
  const { error } = await supabase
    .from('live_viewers')
    .update({
      is_active: false,
      left_at: new Date().toISOString(),
    })
    .eq('match_id', matchId)
    .eq('session_id', sessionId);

  if (error) {
    console.error('Error leaving match:', error);
    return false;
  }

  return true;
};

// Get match events
export const getMatchEvents = async (matchId: string, limit = 100) => {
  const { data, error } = await supabase
    .from('battle_events')
    .select(`
      *,
      team:teams(name),
      agent:agents(name)
    `)
    .eq('match_id', matchId)
    .order('timestamp', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching match events:', error);
    return null;
  }

  return data;
};

// Get recent matches (completed)
export const getRecentMatches = async (limit = 10) => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      match_type:match_types(*),
      match_participants(
        team_side,
        final_score,
        team:teams(name)
      )
    `)
    .eq('status', 'completed')
    .order('completed_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent matches:', error);
    return null;
  }

  return data;
};

// Get upcoming matches
export const getUpcomingMatches = async (limit = 10) => {
  const { data, error } = await supabase
    .from('matches')
    .select(`
      *,
      match_type:match_types(*),
      match_participants(
        team_side,
        team:teams(name)
      )
    `)
    .eq('status', 'pending')
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) {
    console.error('Error fetching upcoming matches:', error);
    return null;
  }

  return data;
};

// Create a new match
export const createMatch = async (matchData: {
  matchTypeId: string;
  topic: string;
  teamAId: string;
  teamBId: string;
  scheduledAt?: string;
}) => {
  const { data: match, error: matchError } = await supabase
    .from('matches')
    .insert({
      match_type_id: matchData.matchTypeId,
      topic: matchData.topic,
      scheduled_at: matchData.scheduledAt,
    })
    .select()
    .single();

  if (matchError) {
    console.error('Error creating match:', matchError);
    return null;
  }

  // Add participants
  const { error: participantError } = await supabase
    .from('match_participants')
    .insert([
      {
        match_id: match.id,
        team_id: matchData.teamAId,
        team_side: 'A',
      },
      {
        match_id: match.id,
        team_id: matchData.teamBId,
        team_side: 'B',
      },
    ]);

  if (participantError) {
    console.error('Error adding match participants:', participantError);
    return null;
  }

  return match;
};

// Start a match
export const startMatch = async (matchId: string) => {
  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'live',
      started_at: new Date().toISOString(),
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('Error starting match:', error);
    return null;
  }

  return data;
};

// Complete a match
export const completeMatch = async (matchId: string, winnerTeamId?: string) => {
  const { data, error } = await supabase
    .from('matches')
    .update({
      status: 'completed',
      completed_at: new Date().toISOString(),
      winner_team_id: winnerTeamId,
    })
    .eq('id', matchId)
    .select()
    .single();

  if (error) {
    console.error('Error completing match:', error);
    return null;
  }

  return data;
};

// Helper function to get display status
const getMatchDisplayStatus = (match: any) => {
  if (match.status === 'live') {
    // Check if it's a "hot" match (high viewer count)
    if ((match.total_viewers || 0) > 1500) {
      return 'hot';
    }
    return 'live';
  }
  return match.status;
};

// Get match statistics
export const getMatchStatistics = async () => {
  const { data, error } = await supabase
    .from('matches')
    .select('status')
    .neq('status', 'cancelled');

  if (error) {
    console.error('Error fetching match statistics:', error);
    return null;
  }

  const stats = data.reduce(
    (acc, match) => {
      acc[match.status] = (acc[match.status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return {
    total: data.length,
    live: stats.live || 0,
    completed: stats.completed || 0,
    pending: stats.pending || 0,
  };
};