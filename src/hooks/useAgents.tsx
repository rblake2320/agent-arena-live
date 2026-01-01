import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

export interface Agent {
  id: string;
  owner_id: string;
  name: string;
  provider: string;
  description: string | null;
  api_endpoint: string | null;
  capabilities: string[];
  avatar_url: string | null;
  is_public: boolean;
  elo_rating: number;
  matches_played: number;
  wins: number;
  created_at: string;
}

export function useAgents() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [publicAgents, setPublicAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAgents = async () => {
    if (!user) {
      setAgents([]);
      setLoading(false);
      return;
    }

    try {
      // Fetch user's own agents
      const { data: ownAgents, error: ownError } = await supabase
        .from('agents')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (ownError) throw ownError;

      // Fetch public agents from other users
      const { data: pubAgents, error: pubError } = await supabase
        .from('agents')
        .select('*')
        .eq('is_public', true)
        .neq('owner_id', user.id)
        .order('elo_rating', { ascending: false })
        .limit(50);

      if (pubError) throw pubError;

      setAgents(ownAgents || []);
      setPublicAgents(pubAgents || []);
    } catch (error) {
      console.error('Error fetching agents:', error);
      toast({
        title: "Error loading agents",
        description: "Failed to load agents. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, [user]);

  const createAgent = async (agent: {
    name: string;
    provider: string;
    description?: string;
    api_endpoint?: string;
    capabilities?: string[];
    is_public?: boolean;
  }) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('agents')
        .insert({
          owner_id: user.id,
          name: agent.name,
          provider: agent.provider,
          description: agent.description || null,
          api_endpoint: agent.api_endpoint || null,
          capabilities: agent.capabilities || [],
          is_public: agent.is_public ?? false,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchAgents();
      return data;
    } catch (error) {
      console.error('Error creating agent:', error);
      toast({
        title: "Error creating agent",
        description: "Failed to create agent. Please try again.",
        variant: "destructive",
      });
      return null;
    }
  };

  const updateAgent = async (agentId: string, updates: Partial<Omit<Agent, 'id' | 'owner_id' | 'created_at'>>) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agents')
        .update(updates)
        .eq('id', agentId)
        .eq('owner_id', user.id);

      if (error) throw error;

      await fetchAgents();
      return true;
    } catch (error) {
      console.error('Error updating agent:', error);
      toast({
        title: "Error updating agent",
        description: "Failed to update agent. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const deleteAgent = async (agentId: string) => {
    if (!user) return false;

    try {
      const { error } = await supabase
        .from('agents')
        .delete()
        .eq('id', agentId)
        .eq('owner_id', user.id);

      if (error) throw error;

      await fetchAgents();
      return true;
    } catch (error) {
      console.error('Error deleting agent:', error);
      toast({
        title: "Error deleting agent",
        description: "Failed to delete agent. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  // Combined list of all available agents (own + public)
  const allAvailableAgents = [...agents, ...publicAgents];

  return {
    agents,
    publicAgents,
    allAvailableAgents,
    loading,
    fetchAgents,
    createAgent,
    updateAgent,
    deleteAgent,
  };
}
