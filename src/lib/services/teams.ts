import { supabase } from '../supabase';
import { TeamWithAgents, Team, Agent, User } from '../types/database';

// Get all teams with rankings (for leaderboard)
export const getTeamLeaderboard = async (limit = 10) => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      owner:users!teams_owner_id_fkey(username, display_name)
    `)
    .eq('is_active', true)
    .order('rating', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching team leaderboard:', error);
    return null;
  }

  return data.map((team, index) => ({
    ...team,
    rank: index + 1,
  }));
};

// Get team details with agents
export const getTeamWithAgents = async (teamId: string): Promise<TeamWithAgents | null> => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_agents!inner(
        role,
        position,
        agent:agents(*)
      ),
      owner:users!teams_owner_id_fkey(username, display_name, avatar_url)
    `)
    .eq('id', teamId)
    .single();

  if (error) {
    console.error('Error fetching team with agents:', error);
    return null;
  }

  return {
    ...data,
    agents: data.team_agents?.map((ta: any) => ({
      ...ta.agent,
      role: ta.role,
      position: ta.position,
    })) || [],
  };
};

// Get user's teams
export const getUserTeams = async (userId: string) => {
  const { data, error } = await supabase
    .from('teams')
    .select(`
      *,
      team_agents(
        role,
        position,
        agent:agents(name, provider)
      )
    `)
    .eq('owner_id', userId)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching user teams:', error);
    return null;
  }

  return data;
};

// Create a new team
export const createTeam = async (teamData: {
  name: string;
  description?: string;
  ownerId: string;
}) => {
  const { data, error } = await supabase
    .from('teams')
    .insert({
      name: teamData.name,
      description: teamData.description,
      owner_id: teamData.ownerId,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating team:', error);
    return null;
  }

  return data;
};

// Update team details
export const updateTeam = async (teamId: string, updates: Partial<Team>) => {
  const { data, error } = await supabase
    .from('teams')
    .update(updates)
    .eq('id', teamId)
    .select()
    .single();

  if (error) {
    console.error('Error updating team:', error);
    return null;
  }

  return data;
};

// Add agent to team
export const addAgentToTeam = async (teamId: string, agentId: string, role: string, position: number) => {
  const { data, error } = await supabase
    .from('team_agents')
    .insert({
      team_id: teamId,
      agent_id: agentId,
      role,
      position,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding agent to team:', error);
    return null;
  }

  return data;
};

// Remove agent from team
export const removeAgentFromTeam = async (teamId: string, agentId: string) => {
  const { error } = await supabase
    .from('team_agents')
    .delete()
    .eq('team_id', teamId)
    .eq('agent_id', agentId);

  if (error) {
    console.error('Error removing agent from team:', error);
    return false;
  }

  return true;
};

// Update agent role in team
export const updateAgentRole = async (teamId: string, agentId: string, role: string) => {
  const { data, error } = await supabase
    .from('team_agents')
    .update({ role })
    .eq('team_id', teamId)
    .eq('agent_id', agentId)
    .select()
    .single();

  if (error) {
    console.error('Error updating agent role:', error);
    return null;
  }

  return data;
};

// Get team rating history
export const getTeamRatingHistory = async (teamId: string, limit = 50) => {
  const { data, error } = await supabase
    .from('rating_history')
    .select('*')
    .eq('team_id', teamId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching rating history:', error);
    return null;
  }

  return data;
};

// Calculate win rate
export const calculateWinRate = (team: Team) => {
  const totalMatches = team.total_matches || 0;
  if (totalMatches === 0) return 0;
  return Math.round(((team.wins || 0) / totalMatches) * 100);
};

// Format streak display
export const formatStreak = (team: Team) => {
  const streak = team.current_streak || 0;
  const type = team.streak_type;

  if (streak === 0 || type === 'none') return '0';

  const sign = type === 'win' ? '+' : '-';
  return `${sign}${streak}`;
};

// Format rating change
export const formatRatingChange = (change: number) => {
  if (change === 0) return '0';
  return change > 0 ? `+${change}` : `${change}`;
};