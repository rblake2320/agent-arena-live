import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Agent {
  id: string;
  name: string;
  provider: string;
  description: string | null;
  capabilities: string[];
  avatar_url: string | null;
  is_public: boolean;
  elo_rating: number;
}

export interface TeamMember {
  id: string;
  agent_id: string;
  role: 'lead' | 'researcher' | 'critic' | 'creative' | 'analyst';
  position: number;
  agent?: Agent;
}

export interface Team {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  elo_rating: number;
  is_public: boolean;
  members?: TeamMember[];
}

export function useTeams() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTeams = async () => {
    if (!user) {
      setTeams([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('teams')
        .select(`
          *,
          members:team_members(
            id,
            agent_id,
            role,
            position,
            agent:agents(id, name, provider, description, capabilities, avatar_url, is_public, elo_rating)
          )
        `)
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform the data to match our interface
      const transformedTeams = (data || []).map(team => ({
        ...team,
        members: team.members?.map((m: any) => ({
          ...m,
          agent: m.agent
        }))
      }));

      setTeams(transformedTeams);
    } catch (error) {
      console.error('Error fetching teams:', error);
      toast({
        title: "Error loading teams",
        description: "Failed to load your teams. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeams();
  }, [user]);

  const createTeam = async (name: string, description?: string) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('teams')
        .insert({
          owner_id: user.id,
          name,
          description: description || null,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchTeams();
      return data;
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        title: "Error creating team",
        description: "Failed to create team. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateTeam = async (teamId: string, updates: { name?: string; description?: string; avatar_url?: string }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('teams')
        .update(updates)
        .eq('id', teamId)
        .eq('owner_id', user.id);

      if (error) throw error;

      await fetchTeams();
      return true;
    } catch (error) {
      console.error('Error updating team:', error);
      toast({
        title: "Error updating team",
        description: "Failed to update team. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteTeam = async (teamId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('teams')
        .delete()
        .eq('id', teamId)
        .eq('owner_id', user.id);

      if (error) throw error;

      await fetchTeams();
      return true;
    } catch (error) {
      console.error('Error deleting team:', error);
      toast({
        title: "Error deleting team",
        description: "Failed to delete team. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const addAgentToTeam = async (teamId: string, agentId: string, role: TeamMember['role'], position: number) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .insert({
          team_id: teamId,
          agent_id: agentId,
          role,
          position,
        });

      if (error) throw error;

      await fetchTeams();
      return true;
    } catch (error) {
      console.error('Error adding agent to team:', error);
      toast({
        title: "Error adding agent",
        description: "Failed to add agent to team. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const removeAgentFromTeam = async (teamId: string, agentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('team_id', teamId)
        .eq('agent_id', agentId);

      if (error) throw error;

      await fetchTeams();
      return true;
    } catch (error) {
      console.error('Error removing agent from team:', error);
      toast({
        title: "Error removing agent",
        description: "Failed to remove agent from team. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const updateTeamMember = async (teamId: string, agentId: string, updates: { role?: TeamMember['role']; position?: number }) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('team_members')
        .update(updates)
        .eq('team_id', teamId)
        .eq('agent_id', agentId);

      if (error) throw error;

      await fetchTeams();
      return true;
    } catch (error) {
      console.error('Error updating team member:', error);
      toast({
        title: "Error updating member",
        description: "Failed to update team member. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    teams,
    loading,
    fetchTeams,
    createTeam,
    updateTeam,
    deleteTeam,
    addAgentToTeam,
    removeAgentFromTeam,
    updateTeamMember,
  };
}
